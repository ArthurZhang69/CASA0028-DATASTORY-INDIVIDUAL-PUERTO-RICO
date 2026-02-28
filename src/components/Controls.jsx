import { useState, useEffect } from 'react'

const DATA_SOURCES = [
  {
    id: 'grid',
    logo: '/logos/osm-logo.png',
    logoAlt: 'OpenStreetMap',
    category: 'GRID DATA',
    name: 'OPENSTREETMAP',
    url: 'https://www.openstreetmap.org',
  },
  {
    id: 'nightlight',
    logo: '/logos/eog-logo.png',
    logoAlt: 'Earth Observatory Group',
    category: 'NIGHTLIGHT DATA',
    name: 'EARTH OBSERVATORY GROUP',
    url: 'https://eogdata.mines.edu/products/vnl/',
  },
  {
    id: 'dem',
    logo: '/logos/copernicus-logo.png',
    logoAlt: 'Copernicus',
    category: 'TOPOGRAPHY DATA',
    name: 'COPERNICUS DEM',
    url: 'https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM',
  },
]

export default function Controls({
  metric,
  setMetric,
  metrics,
  metricKeys,
  monthIdx,
  setMonthIdx,
  months,
  showChoropleth,
  setShowChoropleth,
  showNightlight,
  setShowNightlight,
  showPowerlines,
  setShowPowerlines,
  isNightlightAnimating,
  setIsNightlightAnimating,
  nightlightAnimationSpeed,
  setNightlightAnimationSpeed,
}) {
  const speedOptions = ['0.5x', '1x', '2x']

  // One-time guided pulse on the NIGHTLIGHT button at page load
  const [nightlightPulse, setNightlightPulse] = useState(false)
  useEffect(() => {
    const startDelay = setTimeout(() => {
      setNightlightPulse(true)
      // Remove class after animation completes (3 pulses × ~700ms + buffer)
      const endDelay = setTimeout(() => setNightlightPulse(false), 2800)
      return () => clearTimeout(endDelay)
    }, 1200) // wait 1.2s after mount so the page finishes loading first
    return () => clearTimeout(startDelay)
  }, [])

  const formatMonth = (m) => {
    const [y, mo] = m.split('-')
    return new Date(y, parseInt(mo) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
  }

  const handleMonthChange = (nextIdx) => {
    setMonthIdx(nextIdx)
    if (isNightlightAnimating) setIsNightlightAnimating(false)
  }

  return (
    <div className="controls-bar">

      {/* METRIC */}
      <div className="control-group">
        <label className="control-label">METRIC</label>
        <div className="metric-buttons">
          {metricKeys.map(key => (
            <button
              key={key}
              className={`metric-btn ${metric === key ? 'active' : ''}`}
              onClick={() => setMetric(key)}
            >
              {metrics[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* TIME PERIOD — grid 0fr→1fr animation, no layout thrash */}
      <div className={`time-anim-wrapper ${showNightlight ? 'time-anim-wrapper--visible' : ''}`}>
        <div className="control-group control-group--time">{/* inner: overflow:hidden clips the fixed-width content */}
          <label className="control-label">
            TIME PERIOD — <span className="month-display">{formatMonth(months[monthIdx])}</span>
          </label>
          <div className="slider-row">
            <span className="slider-edge">{formatMonth(months[0])}</span>
            <div className="slider-wrap">
              <input
                type="range"
                min={0}
                max={months.length - 1}
                value={monthIdx}
                onChange={e => handleMonthChange(Number(e.target.value))}
                className="time-slider"
              />
            </div>
            <span className="slider-edge">{formatMonth(months[months.length - 1])}</span>
          </div>
          <div className="month-ticks">
            {months.map((m, i) => (
              <div
                key={m}
                className={`tick ${i === monthIdx ? 'tick--active' : ''} ${i === 8 ? 'tick--fiona' : ''}`}
                onClick={() => handleMonthChange(i)}
                title={m}
              />
            ))}

          </div>
          <div className="time-actions">
            <button
              className={`metric-btn animate-btn ${isNightlightAnimating ? 'active' : ''}`}
              onClick={() => setIsNightlightAnimating(v => !v)}
            >
              {isNightlightAnimating ? 'Pause' : 'Animate'}
            </button>
            <div className="speed-buttons" role="group" aria-label="Animation speed">
              {speedOptions.map(speed => (
                <button
                  key={speed}
                  className={`metric-btn speed-btn ${nightlightAnimationSpeed === speed ? 'active' : ''}`}
                  onClick={() => setNightlightAnimationSpeed(speed)}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LAYERS */}
      <div className="control-group">
        <label className="control-label">LAYERS</label>
        <div className="layer-toggle-stack">
          <button
            className={`layer-toggle ${showChoropleth ? 'layer-toggle--on' : ''}`}
            onClick={() => setShowChoropleth(v => !v)}
          >
            <span className="layer-toggle-icon">▦</span>
            <span>CHOROPLETH</span>
            <span className={`layer-toggle-dot ${showChoropleth ? 'on' : ''}`} />
          </button>
          <button
            className={`layer-toggle ${showPowerlines ? 'layer-toggle--on' : ''}`}
            onClick={() => setShowPowerlines(v => !v)}
          >
            <span className="layer-toggle-icon">⚡</span>
            <span>POWERGRID</span>
            <span className={`layer-toggle-dot ${showPowerlines ? 'on' : ''}`} />
          </button>
          <button
            className={`layer-toggle ${showNightlight ? 'layer-toggle--on' : ''} ${nightlightPulse ? 'layer-toggle--pulse' : ''}`}
            onClick={() => setShowNightlight(!showNightlight)}
          >
            <span className="layer-toggle-icon">☾</span>
            <span>NIGHTLIGHT</span>
            <span className={`layer-toggle-dot ${showNightlight ? 'on' : ''}`} />
          </button>
        </div>
      </div>

      {/* DATA SOURCES */}
      <div className={`control-group control-group--datasources ${showNightlight ? 'control-group--datasources-compact' : ''}`}>
        <label className="control-label">DATA SOURCES</label>
        <div className={`datasource-cards ${showNightlight ? 'datasource-cards--compact' : ''}`}>
          {DATA_SOURCES.map(({ id, logo, logoAlt, category, name, url }) => (
            <div key={id} className={`datasource-card datasource-card--${id}`} title={`${category}: ${name}`}>
              <a href={url} target="_blank" rel="noopener noreferrer" className="datasource-logo-link">
                <div className="datasource-logo-box">
                  <img src={logo} alt={logoAlt} className="datasource-logo-img" />
                </div>
              </a>
              {!showNightlight && <div className="datasource-vdivider" />}
              {!showNightlight && (
                <div className="datasource-text">
                  <span className="datasource-category">{category}:</span>
                  <span className="datasource-name">{name}</span>
                </div>
              )}
              {!showNightlight && (
                <a href={url} target="_blank" rel="noopener noreferrer" className={`datasource-learn-more datasource-learn-more--${id}`}>LEARN MORE</a>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}