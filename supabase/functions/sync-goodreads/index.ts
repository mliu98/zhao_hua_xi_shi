import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export interface DetectedLocation {
  name: string
  lat: number
  lng: number
  isNew: boolean
  existingId?: string
}

export interface GoodreadsBook {
  goodreads_id: string
  title: string
  author: string
  cover_url: string
  date_read: string
  reading_notes: string | null
  detectedLocation: DetectedLocation | null
}

interface RawBook {
  goodreads_id: string
  title: string
  author: string
  cover_url: string
  date_read: string
  reading_notes: string | null
  description: string
}

// --- Inlined parser (mirrors src/lib/goodreadsRssParser.ts) ---

function parseGoodreadsRss(xml: string): RawBook[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
  return items.map(parseItem).filter((b): b is RawBook => b !== null)
}

function parseItem(item: string): RawBook | null {
  const goodreads_id = extractTag(item, 'book_id') ?? extractAttr(item, 'guid')
  const title = decodeEntities(extractTag(item, 'title') ?? '')
  const author = decodeEntities(extractTag(item, 'author_name') ?? '')
  const cover_url = extractTag(item, 'book_image_url') ?? extractTag(item, 'image_url') ?? ''
  const date_read_raw = extractTag(item, 'user_date_read') ?? null
  const reading_notes = cleanHtml(extractTag(item, 'user_review') ?? '') || null
  const description = cleanHtml(
    extractCdata(item, 'book_description') ?? extractTag(item, 'description') ?? ''
  )
  if (!goodreads_id || !title) return null
  return { goodreads_id, title, author, cover_url, date_read: normalizeDate(date_read_raw), reading_notes, description }
}

function extractTag(xml: string, tag: string): string | null {
  const m =
    xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')) ??
    xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i'))
  return m?.[1]?.trim() ?? null
}

function extractCdata(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
  return m?.[1]?.trim() ?? null
}

function extractAttr(xml: string, attr: string): string | null {
  return xml.match(new RegExp(`${attr}="([^"]+)"`))?.[1] ?? null
}

function cleanHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function decodeEntities(str: string): string {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

function normalizeDate(raw: string | null): string {
  if (!raw) return new Date().toISOString().slice(0, 10)
  const d = new Date(raw)
  return isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10)
}

// --- Location detection ---

async function detectLocation(description: string, anthropic: Anthropic): Promise<string | null> {
  if (!description || description.length < 20) return null
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 64,
    messages: [{
      role: 'user',
      content: `Given this book description, identify the PRIMARY real-world location where the story takes place or that the book is primarily about (a specific city, region, or country). Return ONLY the location name (e.g. "Kabul", "Tokyo", "France"), or return null if the book has no clear real-world setting.\n\nDescription: ${description.slice(0, 800)}\n\nLocation (or null):`,
    }],
  })
  const text = (msg.content[0] as { type: string; text: string }).text.trim()
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'none') return null
  return text.replace(/^["']|["']$/g, '')
}

async function geocode(locationName: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'ZhaoHuaXiShi/1.0' } }
  )
  if (!res.ok) return null
  const data = await res.json()
  if (!data.length) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { goodreadsUserId } = await req.json()
    if (!goodreadsUserId) {
      return new Response(JSON.stringify({ error: 'goodreadsUserId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rssUrl = `https://www.goodreads.com/review/list_rss/${goodreadsUserId}?shelf=read&sort=date_read&order=d`
    console.log('Fetching RSS:', rssUrl)
    const rssRes = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ZhaoHuaXiShi/1.0)' }
    })
    console.log('RSS status:', rssRes.status)
    if (!rssRes.ok) {
      const body = await rssRes.text()
      console.error('RSS error body:', body.slice(0, 300))
      return new Response(JSON.stringify({ error: `Goodreads RSS returned ${rssRes.status}`, detail: body.slice(0, 200) }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const rawBooks = parseGoodreadsRss(await rssRes.text())

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: existingRows } = await supabase
      .from('books').select('goodreads_id').not('goodreads_id', 'is', null)
    const existingIds = new Set((existingRows ?? []).map((r: any) => r.goodreads_id as string))
    const newBooks = rawBooks.filter((b) => !existingIds.has(b.goodreads_id))

    if (newBooks.length === 0) {
      return new Response(JSON.stringify({ books: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: existingLocations } = await supabase.from('locations').select('id, name')
    const locationMap = new Map<string, string>(
      (existingLocations ?? []).map((l: any) => [l.name.toLowerCase(), l.id])
    )

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    const results: GoodreadsBook[] = []
    for (const book of newBooks) {
      const locationName = await detectLocation(book.description, anthropic)
      let detectedLocation: DetectedLocation | null = null

      if (locationName) {
        const existingId = locationMap.get(locationName.toLowerCase())
        if (existingId) {
          detectedLocation = { name: locationName, lat: 0, lng: 0, isNew: false, existingId }
        } else {
          const coords = await geocode(locationName)
          if (coords) detectedLocation = { name: locationName, ...coords, isNew: true }
        }
      }

      results.push({
        goodreads_id: book.goodreads_id,
        title: book.title,
        author: book.author,
        cover_url: book.cover_url,
        date_read: book.date_read,
        reading_notes: book.reading_notes,
        detectedLocation,
      })
    }

    return new Response(JSON.stringify({ books: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(JSON.stringify({ error: String(err), stack: err instanceof Error ? err.stack : undefined }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
