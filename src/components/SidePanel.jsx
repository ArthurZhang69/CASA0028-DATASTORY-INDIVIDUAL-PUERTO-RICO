import NightlightPreview from './NightlightPreview'

const METRIC_CARDS = [
  { key: 'line_km_per_km2', label: 'GRID DENSITY', unit: 'km/km²', color: '#00c8ff' },
  { key: 'HV_km_per_km2', label: 'HV DENSITY', unit: 'km/km²', color: '#ff9500' },
  { key: 'grid_intensity_index', label: 'GRID INDEX', unit: 'index', color: '#d36cff' },
]

function formatMetricValue(value) {
  if (value == null || Number.isNaN(value)) return '—'
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
  if (Math.abs(value) >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 3 })
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function KpiCard({ label, value, unit, color }) {
  return (
    <div className="kpi-card" style={{ borderTopColor: color }}>
      <div className="kpi-value" style={{ color }}>{formatMetricValue(value)}</div>
      <div className="kpi-unit">{unit}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

export default function SidePanel({ selectedFeature, islandSummary, metricConfig, month, showNightlight, selectedGeometry, onClose }) {
  const display = selectedFeature || islandSummary
  const properties = display?.properties || {}
  const panelTitle = display?.name || 'Puerto Rico'

  return (
    <aside className={`side-panel ${selectedFeature ? 'side-panel--selected' : ''}`}>
      <div className="panel-header">
        <div>
          <div className="panel-title">{panelTitle}</div>
          {selectedFeature ? (
            <div className="panel-sub">GRID INEQUALITY PROFILE</div>
          ) : (
            <div className="panel-sub">SELECT MUNICIPIO TO EXPLORE MORE</div>
          )}
        </div>
        {selectedFeature ? (
          <button className="close-btn" onClick={onClose} aria-label="Deselect">✕</button>
        ) : (
          <button className="close-btn" style={{ visibility: 'hidden' }} aria-hidden="true">✕</button>
        )}
      </div>

      <div className="chart-section">
        <div className="chart-title" style={{ color: 'var(--red)', fontSize: '15px', fontWeight: 700 }}>Overview</div>
        <div className="chart-desc" style={{ fontSize: 13, color: '#b8d4e8', lineHeight: 1.6, marginTop: 4 }}>
          This study maps electricity infrastructure and energy inequality across Puerto Rico using transmission lines, substations, and power plants. Nighttime lights proxy economic activity and energy use, while September 2022 (Hurricane Fiona) light changes indicate short-term disruption and resilience. Together, these patterns show how long-term spatial inequality intersects with extreme events across the island.
        </div>
      </div>

      <div className="panel-map-section">
        <div className="chart-title" style={{ color: '#92d3ff', fontSize: '15px', fontWeight: 700 }}>NIGHTLIGHT CHANGE</div>
        <NightlightPreview month={month} showNightlightChange={true} selectedGeometry={selectedGeometry} />
      </div>

      <div className="kpi-grid">
        {METRIC_CARDS.map(card => (
          <KpiCard
            key={card.key}
            label={card.label}
            value={Number(properties[card.key])}
            unit={card.unit}
            color={card.color}
          />
        ))}
      </div>
    </aside>
  )
}