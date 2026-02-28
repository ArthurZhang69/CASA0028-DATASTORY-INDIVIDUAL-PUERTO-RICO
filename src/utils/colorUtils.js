export function getQuantileBreaks(values, n = 5) {
  const sorted = [...values].sort((a, b) => a - b)
  const breaks = []
  for (let i = 0; i <= n; i++) {
    const idx = Math.floor((i / n) * (sorted.length - 1))
    breaks.push(sorted[idx])
  }
  return breaks
}

export function getColor(value, breaks, colorScale) {
  if (value == null || isNaN(value)) return '#e5e7eb'
  if (!breaks?.length || !colorScale?.length) return '#e5e7eb'
  for (let i = 0; i < breaks.length - 1; i++) {
    if (value <= breaks[i + 1]) return colorScale[Math.min(i, colorScale.length - 1)]
  }
  return colorScale[colorScale.length - 1]
}

export function formatValue(value, unit) {
  if (value == null) return 'N/A'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${unit}`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K ${unit}`
  return `${value.toLocaleString()} ${unit}`
}
