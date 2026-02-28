const POWERLINE_LEGEND = [
  { color: '#00eeff', label: '230 kV — Transmission', width: 3 },
  { color: '#0088bb', label: '115 kV — Sub-transmission', width: 2 },
  { color: '#003a55', label: '38 kV — Distribution', width: 1.5 },
  { color: '#002233', label: 'Unknown Voltage', width: 1 },
]

export default function Legend({ colorBreaks, metricConfig, showChoropleth, showPowerlines }) {
  const { colorScale, unit, description } = metricConfig

  const formatBreak = (v) => v.toLocaleString(undefined, { maximumFractionDigits: 3 })

  const hasContent = showChoropleth || showPowerlines

  if (!hasContent) return null

  return (
    <div className="legend">
      {/* Choropleth legend */}
      {showChoropleth && (
        <div className="legend-section">
          <div className="legend-section-label">GRID INEQUALITY</div>
          <div className="legend-title">{unit}</div>
          <div className="legend-gradient-bar-wrap">
            <div className="legend-gradient-labels">
              <span className="legend-gradient-label legend-gradient-label--low">LOW</span>
              <span className="legend-gradient-label legend-gradient-label--high">HIGH</span>
            </div>
            <div className="legend-gradient-bar"
              style={{
                background: `linear-gradient(90deg, ${colorScale.join(', ')})`
              }}
            />
            <div className="legend-gradient-values">
              <span className="legend-gradient-value legend-gradient-value--min">{formatBreak(colorBreaks[0])}</span>
              <span className="legend-gradient-value legend-gradient-value--max">{formatBreak(colorBreaks[colorBreaks.length-1])}</span>
            </div>
          </div>
          <div className="legend-desc">{description}</div>
        </div>
      )}

      {/* Powerline legend */}
      {showPowerlines && (
        <div className="legend-section legend-section--power">
          <div className="legend-section-label">POWER GRID</div>
          {POWERLINE_LEGEND.map(({ color, label, width, dot }) => (
            <div key={label} className="swatch-item swatch-item--line">
              {dot ? (
                <div className="line-dot" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
              ) : (
                <div className="line-swatch" style={{
                  background: color,
                  height: `${width}px`,
                  boxShadow: `0 0 ${width * 2}px ${color}`,
                }} />
              )}
              <span className="swatch-label">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}