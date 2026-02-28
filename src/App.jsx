import { useState, useEffect, useMemo, useRef } from 'react'
import MapView from './components/MapView'
import Controls from './components/Controls'
import SidePanel from './components/SidePanel'
import Legend from './components/Legend'
import { getQuantileBreaks } from './utils/colorUtils'
import './App.css'

const MONTHS_2022 = [
  '2022-01','2022-02','2022-03','2022-04','2022-05','2022-06',
  '2022-07','2022-08','2022-09','2022-10','2022-11','2022-12',
]

const METRICS = {
  line_km_per_km2: {
    key: 'line_km_per_km2',
    label: 'Grid Density',
    unit: 'km/km²',
    description: 'Total power-grid line length density by municipio area.',
    colorScale: ['#0a0a1a', '#050e24', '#02204d', '#00498a', '#0595e9', '#01ddff', '#b2ffff'],
  },
  HV_km_per_km2: {
    key: 'HV_km_per_km2',
    label: 'HV Density',
    unit: 'km/km²',
    description: 'High-voltage transmission line density by municipio area.',
    colorScale: ['#15405e', '#2a6f77', '#5eaa98', '#edf8b1'],
  },
  grid_intensity_index: {
    key: 'grid_intensity_index',
    label: 'Grid Intensity Index',
    unit: 'index',
    description: 'Composite index combining grid density and infrastructure intensity.',
    colorScale: ['#3a3169','#65609c', '#aeb0d6', '#f5f5f5'],
  },
}

const METRIC_KEYS = Object.keys(METRICS)
const ANIMATION_SPEEDS = {
  '0.5x': 1600,
  '1x': 900,
  '2x': 450,
}

function getFeatureFips(feature) {
  return feature?.properties?.COUNTYFP ?? feature?.properties?.municipio_id ?? null
}

export default function App() {
  const [geoData,       setGeoData]       = useState(null)
  const [powerlineData, setPowerlineData] = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [metric,        setMetric]        = useState('line_km_per_km2')
  const [monthIdx,      setMonthIdx]      = useState(MONTHS_2022.indexOf('2022-09'))
  const [selectedFips,  setSelectedFips]  = useState(null)
  const [hoveredFips,   setHoveredFips]   = useState(null)
  const [showChoropleth, setShowChoropleth] = useState(true)
  const [showNightlight, setShowNightlight] = useState(false)
  const [showPowerlines, setShowPowerlines] = useState(true)
  const [isNightlightAnimating, setIsNightlightAnimating] = useState(false)
  const [nightlightAnimationSpeed, setNightlightAnimationSpeed] = useState('1x')

  const month = MONTHS_2022[monthIdx]

  useEffect(() => {
    if (!showNightlight) {
      setIsNightlightAnimating(false)
    }
  }, [showNightlight])

  useEffect(() => {
    if (!showNightlight || !isNightlightAnimating || MONTHS_2022.length < 2) return
    const intervalMs = ANIMATION_SPEEDS[nightlightAnimationSpeed] ?? ANIMATION_SPEEDS['1x']
    const timer = window.setInterval(() => {
      setMonthIdx(prev => (prev + 1) % MONTHS_2022.length)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [showNightlight, isNightlightAnimating, nightlightAnimationSpeed])

  const [toastMsg, setToastMsg] = useState(null)
  const toastTimerRef = useRef(null)

  const handleSetShowNightlight = (val) => {
    setShowNightlight(val)
    if (val && showChoropleth) {
      setShowChoropleth(false)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      setToastMsg('To optimize visual clarity, choropleth has been turned off — you can manually turn it back on.')
      toastTimerRef.current = setTimeout(() => setToastMsg(null), 5000)
    }
  }

  // Fetch required GeoJSONs in parallel
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/CASA0028-DATASTORY-INDIVIDUAL/'
    Promise.all([
      fetch(base + 'data/pr_municipio_grid_indicators.geojson').then(r => { if (!r.ok) throw new Error(`pr_municipio_grid_indicators.geojson HTTP ${r.status}`); return r.json() }),
      fetch(base + 'data/Powergrid.geojson').then(r => { if (!r.ok) throw new Error(`Powergrid.geojson HTTP ${r.status}`); return r.json() }),
    ])
      .then(([geo, powergrid]) => {
        setGeoData(geo)
        setPowerlineData(powergrid)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const featureMetaByFips = useMemo(() => {
    const out = {}
    const features = geoData?.features ?? []
    features.forEach(feature => {
      const fips = getFeatureFips(feature)
      if (!fips) return
      const properties = feature.properties ?? {}
      out[fips] = {
        name: properties.NAME || properties.municipio || `PR-${fips}`,
        properties,
        geometry: feature.geometry ?? null,
      }
    })
    return out
  }, [geoData])

  const choroplethValues = useMemo(() => {
    const vals = {}
    const features = geoData?.features ?? []
    const metricKey = METRICS[metric].key
    features.forEach(feature => {
      const fips = getFeatureFips(feature)
      if (!fips) return
      const raw = feature?.properties?.[metricKey]
      const val = Number(raw)
      vals[fips] = Number.isFinite(val) ? val : 0
    })
    return vals
  }, [geoData, metric])

  const colorBreaks = useMemo(() => {
    const values = Object.values(choroplethValues).filter(v => Number.isFinite(v))
    if (!values.length) return [0, 0, 0, 0, 0]
    return getQuantileBreaks(values, METRICS[metric].colorScale.length)
  }, [choroplethValues, metric])

  const metricConfig = METRICS[metric]
  const selectedFeature = selectedFips ? featureMetaByFips[selectedFips] : null

  const islandSummary = useMemo(() => {
    const features = geoData?.features ?? []
    if (!features.length) return null
    const avg = (key) => {
      const values = features
        .map(feature => Number(feature?.properties?.[key]))
        .filter(v => Number.isFinite(v))
      if (!values.length) return 0
      return values.reduce((sum, v) => sum + v, 0) / values.length
    }
    return {
      name: 'Puerto Rico (Island Avg)',
      properties: {
        line_km_per_km2: avg('line_km_per_km2'),
        HV_km_per_km2: avg('HV_km_per_km2'),
        grid_intensity_index: avg('grid_intensity_index'),
      },
    }
  }, [geoData])

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="header-badge">SPATIAL DATA STORY</div>
          <h1>Energy Inequality in Puerto Rico</h1>
          <p className="header-sub">
            Explore grid infrastructure inequality across 78 municipios · Click a municipio for detail
          </p>
        </div>
        <div className="header-right">
          <div className="header-stat">
            <span className="stat-num">78</span>
            <span className="stat-label">Municipios</span>
          </div>
          <div className="header-stat">
            <span className="stat-num">{MONTHS_2022.length}</span>
            <span className="stat-label">Months</span>
          </div>
          <div className="header-stat">
            <span className="stat-num">3</span>
            <span className="stat-label">Metrics</span>
          </div>
        </div>
      </header>

      <Controls
        metric={metric}
        setMetric={setMetric}
        metrics={METRICS}
        metricKeys={METRIC_KEYS}
        monthIdx={monthIdx}
        setMonthIdx={setMonthIdx}
        months={MONTHS_2022}
        showChoropleth={showChoropleth}
        setShowChoropleth={setShowChoropleth}
        showNightlight={showNightlight}
        setShowNightlight={handleSetShowNightlight}
        showPowerlines={showPowerlines}
        setShowPowerlines={setShowPowerlines}
        isNightlightAnimating={isNightlightAnimating}
        setIsNightlightAnimating={setIsNightlightAnimating}
        nightlightAnimationSpeed={nightlightAnimationSpeed}
        setNightlightAnimationSpeed={setNightlightAnimationSpeed}
      />

      <main className="app-body">
        {loading && (
          <div className="status-screen">
            <div className="loader-ring" />
            <p>Acquiring signal…</p>
            <span>fetching pr_municipio_grid_indicators, Powergrid…</span>
          </div>
        )}
        {error && (
          <div className="status-screen error">
            <div className="error-icon">⚠</div>
            <p>Signal lost</p>
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && geoData && (
          <>
            <div className="map-container">
              <div className="interference" />
              {monthIdx === 8 && (
                <div className="fiona-warning-bar">
                  <span className="fiona-warning-text">⚠ WARNING: HURRICANE FIONA PERIOD — NIGHTLIGHT DISRUPTION EXPECTED</span>
                </div>
              )}
              <MapView
                geoData={geoData}
                choroplethValues={choroplethValues}
                featureMetaByFips={featureMetaByFips}
                colorBreaks={colorBreaks}
                metricConfig={metricConfig}
                selectedFips={selectedFips}
                setSelectedFips={setSelectedFips}
                hoveredFips={hoveredFips}
                setHoveredFips={setHoveredFips}
                month={month}
                metric={metric}
                showChoropleth={showChoropleth}
                showNightlight={showNightlight}
                powerlineData={powerlineData}
                showPowerlines={showPowerlines}
              />
              <Legend
                colorBreaks={colorBreaks}
                metricConfig={metricConfig}
                showChoropleth={showChoropleth}
                showPowerlines={showPowerlines}
              />
            </div>
            <SidePanel
              selectedFeature={selectedFeature}
              islandSummary={islandSummary}
              metric={metric}
              metricConfig={metricConfig}
              month={month}
              showNightlight={showNightlight}
              selectedGeometry={selectedFeature?.geometry ?? null}
              onClose={() => setSelectedFips(null)}
            />
          </>
        )}
      </main>
      {toastMsg && (
        <div className="toast">
          <span className="toast-icon">i</span>
          <span className="toast-msg">{toastMsg}</span>
          <button className="toast-close" onClick={() => setToastMsg(null)}>✕</button>
        </div>
      )}
    </div>
  )
}