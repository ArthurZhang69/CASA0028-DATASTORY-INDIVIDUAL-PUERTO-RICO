import { useEffect, useRef } from 'react'
import L from 'leaflet'

function getVoltageValue(voltageRaw) {
  if (!voltageRaw) return 0
  return String(voltageRaw)
    .split(';')
    .map(v => parseInt(v, 10))
    .filter(v => Number.isFinite(v))
    .reduce((max, value) => Math.max(max, value), 0)
}

// Voltage → visual weight mapping (glitch CRT aesthetic)
function getLineStyle(props) {
  const voltage = getVoltageValue(props.voltage)
  const power   = props.power

  if (power === 'cable') {
    return { color: '#004466', weight: 1, opacity: 0.5, dashArray: '4 4' }
  }

  // Transmission lines — 3 voltage tiers
  if (voltage >= 230000) {
    // 230 kV: high-voltage backbone — full brightness white-cyan
    return { color: '#00eeff', weight: 1.8, opacity: 0.85, dashArray: null }
  } else if (voltage >= 115000) {
    // 115 kV: subtransmission — medium cyan
    return { color: '#0088bb', weight: 1.2, opacity: 0.7, dashArray: null }
  } else if (voltage >= 38000) {
    // 38 kV: distribution — dim blue
    return { color: '#003a55', weight: 0.8, opacity: 0.6, dashArray: null }
  }
  // Unknown voltage — minimal
  return { color: '#002233', weight: 0.6, opacity: 0.45, dashArray: null }
}

function getPlantStyle() {
  return { color: '#ff9500', fillColor: 'rgba(255,149,0,0.2)', weight: 1.2, fillOpacity: 0.85 }
}

function bindGridTooltip(layer, title, details = '') {
  layer.bindTooltip(
    `<div class="map-tooltip">
      <strong>${title}</strong>
      ${details ? `<div class="tt-sub">${details}</div>` : ''}
    </div>`,
    { className: 'custom-tooltip', sticky: true, opacity: 1 }
  )
}

function getSubstationStyle(props) {
  const sub = props.substation || ''
  if (sub === 'transmission' || sub === 'generation') {
    return { color: '#ff2233', fillColor: 'rgba(255,34,51,0.15)', weight: 1.2, fillOpacity: 0.8 }
  }
  if (sub === 'distribution') {
    return { color: '#00c8ff', fillColor: 'rgba(0,200,255,0.1)', weight: 0.8, fillOpacity: 0.7 }
  }
  return { color: '#004455', fillColor: 'rgba(0,68,85,0.1)', weight: 0.5, fillOpacity: 0.5 }
}

export default function PowerlineLayer({ map, powerlineData, visible }) {
  const layerGroupRef = useRef(null)

  useEffect(() => {
    if (!map || !powerlineData) return

    // Clean up previous layer
    if (layerGroupRef.current) {
      layerGroupRef.current.remove()
      layerGroupRef.current = null
    }

    if (!visible) return

    const group = L.layerGroup()
    const pane = 'powerlinePane'

    // Render in layers: low-voltage first, high-voltage on top
    const lines38  = []
    const lines115 = []
    const lines230 = []
    const linesUnk = []
    const flow38  = []
    const flow115 = []
    const flow230 = []
    const flowUnk = []
    const substations = []
    const powerplants = []

    const addSubstationLayer = (feature, props, geometry) => {
      const style = getSubstationStyle(props)
      const name = props.name || `Substation (${props.substation || 'unknown'})`
      const voltageValue = getVoltageValue(props.voltage)
      const voltageText = voltageValue ? ` · ${(voltageValue / 1000).toFixed(0)}kV` : ''
      const operatorText = props.operator ? props.operator.toUpperCase() : 'UNKNOWN'
      const typeText = (props.substation || '—').toUpperCase()

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0].map(([lng, lat]) => [lat, lng])
        const lyr = L.polygon(coords, { ...style, pane, interactive: true })
        bindGridTooltip(lyr, name, `TYPE // ${typeText} · OPERATOR // ${operatorText}${voltageText}`)
        substations.push(lyr)
        return
      }

      if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates
        const lyr = L.circleMarker([lat, lng], {
          pane,
          radius: 3.5,
          color: style.color,
          weight: 1,
          fillColor: style.fillColor,
          fillOpacity: 0.9,
        })
        bindGridTooltip(lyr, name, `TYPE // ${typeText} · OPERATOR // ${operatorText}${voltageText}`)
        substations.push(lyr)
      }
    }

    const addPowerplantLayer = (props, geometry) => {
      const style = getPlantStyle()
      const name = props.name || 'Power Plant'
      const source = props['plant:source'] || props.source || 'UNKNOWN SOURCE'
      const operator = props.operator ? ` · ${props.operator.toUpperCase()}` : ''
      const details = `${String(source).toUpperCase()}${operator}`

      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0].map(([lng, lat]) => [lat, lng])
        const lyr = L.polygon(coords, { ...style, pane, interactive: true })
        bindGridTooltip(lyr, name, details)
        powerplants.push(lyr)
        return
      }

      if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates
        const lyr = L.circleMarker([lat, lng], {
          pane,
          radius: 4,
          color: style.color,
          weight: 1.2,
          fillColor: style.fillColor,
          fillOpacity: 0.95,
        })
        bindGridTooltip(lyr, name, details)
        powerplants.push(lyr)
      }
    }

    powerlineData.features.forEach(f => {
      const p = f.properties || {}
      const g = f.geometry
      if (!g) return

      if (p.power === 'line' || p.power === 'cable') {
        if (g.type !== 'LineString') return
        const coords = g.coordinates.map(([lng, lat]) => [lat, lng])
        const voltage = parseInt(p.voltage) || 0
        const style = getLineStyle(p)
        const lyr = L.polyline(
          coords,
          { ...style, pane, interactive: false }
        )
        if (voltage >= 230000) lines230.push(lyr)
        else if (voltage >= 115000) lines115.push(lyr)
        else if (voltage >= 38000) lines38.push(lyr)
        else linesUnk.push(lyr)

        if (p.power === 'line') {
          const flowClass = voltage >= 230000
            ? 'powerline-flow powerline-flow--230'
            : voltage >= 115000
              ? 'powerline-flow powerline-flow--115'
              : voltage >= 38000
                ? 'powerline-flow powerline-flow--38'
                : 'powerline-flow powerline-flow--unk'
          const flow = L.polyline(coords, {
            pane,
            interactive: false,
            className: flowClass,
            color: style.color,
            weight: style.weight + 0.9,
            opacity: 0.95,
            dashArray: '10 22',
          })
          if (voltage >= 230000) flow230.push(flow)
          else if (voltage >= 115000) flow115.push(flow)
          else if (voltage >= 38000) flow38.push(flow)
          else flowUnk.push(flow)
        }
      }

      if ((p.power === 'substation' || p.substation) && (g.type === 'Polygon' || g.type === 'Point')) {
        addSubstationLayer(f, p, g)
      }

      if ((p.power === 'plant' || p.power === 'generator' || p['plant:source']) && (g.type === 'Polygon' || g.type === 'Point')) {
        addPowerplantLayer(p, g)
      }
    })

    // Add in Z-order: base lines → animated flow → substations/powerplants
    ;[
      ...linesUnk, ...lines38, ...lines115, ...lines230,
      ...flowUnk, ...flow38, ...flow115, ...flow230,
      ...substations,
      ...powerplants,
    ]
      .forEach(l => l.addTo(group))

    group.addTo(map)
    layerGroupRef.current = group

    return () => {
      group.remove()
      layerGroupRef.current = null
    }
  }, [map, powerlineData, visible])

  return null
}
