interface StackedImagesProps {
  urls: string[]
  width?: number
  height?: number
}

// Shows up to 3 images stacked, back ones peeking to the right
export function StackedImages({ urls, width = 160, height = 200 }: StackedImagesProps) {
  const visible = urls.slice(0, 3).reverse() // render back-to-front
  const offsets = [24, 12, 0]
  const rotations = [3, 1.5, 0]

  return (
    <div style={{ position: 'relative', width: width + (visible.length - 1) * 12, height }}>
      {visible.map((url, i) => {
        const stackIndex = visible.length - 1 - i
        return (
          <div
            key={url + i}
            style={{
              position: 'absolute',
              left: offsets[stackIndex] ?? 0,
              top: 0,
              width,
              height,
              zIndex: i + 1,
              transform: `rotate(${rotations[stackIndex] ?? 0}deg)`,
              transformOrigin: 'bottom left',
              overflow: 'hidden',
              boxShadow: '0 2px 8px var(--paper-shadow)',
            }}
          >
            <img
              src={url}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'contrast(0.92) saturate(0.85)' }}
            />
          </div>
        )
      })}
    </div>
  )
}
