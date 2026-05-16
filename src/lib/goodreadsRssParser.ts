export interface RawGoodreadsBook {
  goodreads_id: string
  title: string
  author: string
  cover_url: string
  date_read: string       // YYYY-MM-DD, defaults to today if missing
  reading_notes: string | null
  description: string
}

export function parseGoodreadsRss(xml: string): RawGoodreadsBook[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
  return items.map(parseItem).filter((b): b is RawGoodreadsBook => b !== null)
}

export function filterNewBooks(
  books: RawGoodreadsBook[],
  existingIds: Set<string>
): RawGoodreadsBook[] {
  return books.filter((b) => !existingIds.has(b.goodreads_id))
}

function parseItem(item: string): RawGoodreadsBook | null {
  const goodreads_id = extractTag(item, 'book_id') ?? extractAttr(item, 'guid')
  const title = decodeEntities(extractTag(item, 'title') ?? '')
  const author = decodeEntities(extractTag(item, 'author_name') ?? '')
  const cover_url = extractTag(item, 'book_image_url') ?? extractTag(item, 'image_url') ?? ''
  const date_read = extractTag(item, 'user_date_read') ?? null
  const reading_notes = cleanHtml(extractTag(item, 'user_review') ?? '') || null
  const description = cleanHtml(
    extractCdata(item, 'book_description') ?? extractTag(item, 'description') ?? ''
  )

  if (!goodreads_id || !title) return null

  return {
    goodreads_id,
    title,
    author,
    cover_url,
    date_read: normalizeDate(date_read),
    reading_notes,
    description,
  }
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
  const m = xml.match(new RegExp(`${attr}="([^"]+)"`))
  return m?.[1] ?? null
}

function cleanHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export function normalizeDate(raw: string | null): string {
  if (!raw) return todayIso()
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return todayIso()
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
