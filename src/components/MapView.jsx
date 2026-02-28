import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { getColor } from '../utils/colorUtils'
import PowerlineLayer from './PowerlineLayer'
console.log('MAPBOX_TOKEN:', import.meta.env.VITE_MAPBOX_TOKEN)

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const TILESET_DEM = 'arthurzhang.8u69sbnj'
const TILESET_NIGHTLIGHT_202201 = 'arthurzhang.8f7tcrk4'
const TILESET_NIGHTLIGHT_202202 = 'arthurzhang.3agn8sik'
const TILESET_NIGHTLIGHT_202203 = 'arthurzhang.1627v5fc'
const TILESET_NIGHTLIGHT_202204 = 'arthurzhang.63q3urj9'
const TILESET_NIGHTLIGHT_202205 = 'arthurzhang.at20czr2'
const TILESET_NIGHTLIGHT_202206 = 'arthurzhang.8h2vub5e'
const TILESET_NIGHTLIGHT_202207 = 'arthurzhang.0s1eme52'
const TILESET_NIGHTLIGHT_202208 = 'arthurzhang.b1wtyz5s'
const TILESET_NIGHTLIGHT_202209 = 'arthurzhang.0rvoc7d6'
const TILESET_NIGHTLIGHT_202210 = 'arthurzhang.c9jgdeu9'
const TILESET_NIGHTLIGHT_202211 = 'arthurzhang.7gqskfv0'
const TILESET_NIGHTLIGHT_202212 = 'arthurzhang.5c0zjxze'




const NIGHTLIGHT_TILESETS = {
  '2022-01': TILESET_NIGHTLIGHT_202201,
  '2022-02': TILESET_NIGHTLIGHT_202202,
  '2022-03': TILESET_NIGHTLIGHT_202203,
  '2022-04': TILESET_NIGHTLIGHT_202204,
  '2022-05': TILESET_NIGHTLIGHT_202205,
  '2022-06': TILESET_NIGHTLIGHT_202206,
  '2022-07': TILESET_NIGHTLIGHT_202207,
  '2022-08': TILESET_NIGHTLIGHT_202208,
  '2022-09': TILESET_NIGHTLIGHT_202209,
  '2022-10': TILESET_NIGHTLIGHT_202210,
  '2022-11': TILESET_NIGHTLIGHT_202211,
  '2022-12': TILESET_NIGHTLIGHT_202212,

}
const NIGHTLIGHT_OPACITY = 0.8
const TILESET_NATIVE_MAX_ZOOM = 9
const PR_TILE_BOUNDS = [[17.75, -67.4], [18.6, -65.15]]
const NIGHTLIGHT_TILE_OPTIONS = {
  pane: 'nightlightPane',
  opacity: 0,
  maxNativeZoom: TILESET_NATIVE_MAX_ZOOM,
  maxZoom: 18,
  bounds: PR_TILE_BOUNDS,
  noWrap: true,
}

function getMapboxTilesetUrl(tilesetId) {
  return `https://api.mapbox.com/v4/${tilesetId}/{z}/{x}/{y}.png?access_token=${MAPBOX_TOKEN}`
}

function formatTooltipValue(val) {
  if (val == null || Number.isNaN(val)) return 'N/A'
  if (Math.abs(val) >= 1000) return val.toLocaleString(undefined, { maximumFractionDigits: 1 })
  if (Math.abs(val) >= 1) return val.toLocaleString(undefined, { maximumFractionDigits: 3 })
  return val.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

function getTooltipContent(fips, choroplethValues, featureMetaByFips, metricConfig) {
  const meta = featureMetaByFips[fips]
  if (!meta) return ''
  const val = choroplethValues[fips]
  const formatted = formatTooltipValue(val)
  return `
    <div class="map-tooltip">
      <strong>${meta.name}</strong>
      <div class="tt-row">
        <span class="tt-label">${metricConfig.label}</span>
        <span class="tt-value">${formatted}</span>
      </div>
      <div class="tt-sub">UNIT // ${metricConfig.unit}</div>
    </div>
  `
}

function getFeatureFips(feature) {
  return feature?.properties?.COUNTYFP ?? feature?.properties?.municipio_id ?? null
}

function getFeatureStyle(feature, choroplethValues, colorBreaks, metricConfig, selectedFips, hoveredFips, showNightlight) {
  const fips = getFeatureFips(feature)
  const value = choroplethValues[fips] ?? 0
  const color = getColor(value, colorBreaks, metricConfig.colorScale)
  const isSel = fips === selectedFips
  const isHov = fips === hoveredFips
  const baseOpacity = showNightlight ? 0.55 : 0.86
  return {
    fillColor: color,
    fillOpacity: isSel ? 0.85 : isHov ? 0.72 : baseOpacity,
    color: isSel ? '#ff2233' : isHov ? 'rgba(0,255,255,0.95)' : 'rgba(20,45,70,0.8)',
    weight: isSel ? 2.4 : isHov ? 1.8 : 1.0,
    dashArray: isSel ? '4 2' : undefined,
  }
}

export default function MapView({
  geoData, choroplethValues, featureMetaByFips, colorBreaks,
  metricConfig, selectedFips, setSelectedFips,
  hoveredFips, setHoveredFips, month,
  showChoropleth,
  showNightlight,
  powerlineData, showPowerlines,
}) {
  const mapDivRef   = useRef(null)
  const geoLayerRef = useRef(null)
  const tooltipRef  = useRef(null)
  const nightlightLayersRef = useRef({})
  const activeNightlightMonthRef = useRef(null)
  const selectedFipsRef = useRef(selectedFips)
  const choroplethValuesRef = useRef(choroplethValues)
  const featureMetaByFipsRef = useRef(featureMetaByFips)
  const metricConfigRef = useRef(metricConfig)
  const [mapObj, setMapObj] = useState(null)

  useEffect(() => { selectedFipsRef.current = selectedFips }, [selectedFips])
  useEffect(() => { choroplethValuesRef.current = choroplethValues }, [choroplethValues])
  useEffect(() => { featureMetaByFipsRef.current = featureMetaByFips }, [featureMetaByFips])
  useEffect(() => { metricConfigRef.current = metricConfig }, [metricConfig])

  // Init map once
  useEffect(() => {
    const PR_BOUNDS = L.latLngBounds([[17.0, -68.5], [19.2, -64.5]])
    const map = L.map(mapDivRef.current, {
      center: [19.1, -66.5],
      zoom: 9,
      minZoom: 8,
      maxZoom: 14,
      maxBounds: PR_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      attributionControl: true,
    })
    map.createPane('choroplethPane')
    map.getPane('choroplethPane').style.zIndex = '440'
    map.createPane('powerlinePane')
    map.getPane('powerlinePane').style.zIndex = '460'
    map.createPane('nightlightPane')
    map.getPane('nightlightPane').style.zIndex = '470'
    map.createPane('demPane')
    map.getPane('demPane').style.zIndex = '415'
    map.createPane('labelsPane')
    map.getPane('labelsPane').style.zIndex = '650'
    map.getPane('labelsPane').style.pointerEvents = 'none'

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB',
      maxZoom: 18,
    }).addTo(map)

    L.tileLayer(getMapboxTilesetUrl(TILESET_DEM), {
      pane: 'demPane',
      opacity: 0.4,
      maxNativeZoom: TILESET_NATIVE_MAX_ZOOM,
      maxZoom: 18,
      bounds: PR_TILE_BOUNDS,
      noWrap: true,
    }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB',
      maxZoom: 18,
      pane: 'labelsPane',
    }).addTo(map)

    Object.entries(NIGHTLIGHT_TILESETS).forEach(([monthKey, tilesetId]) => {
      const layer = L.tileLayer(getMapboxTilesetUrl(tilesetId), NIGHTLIGHT_TILE_OPTIONS)
      layer.addTo(map)
      nightlightLayersRef.current[monthKey] = layer
    })

    setMapObj(map)
    return () => {
      activeNightlightMonthRef.current = null
      Object.values(nightlightLayersRef.current).forEach(layer => layer?.remove())
      nightlightLayersRef.current = {}
      map.remove()
      setMapObj(null)
    }
  }, [])

  // Create/remove choropleth layer only when source visibility/data changes
  useEffect(() => {
    if (!mapObj || !geoData) return

    if (!showChoropleth) {
      geoLayerRef.current?.remove()
      geoLayerRef.current = null
      tooltipRef.current?.remove()
      return
    }

    if (geoLayerRef.current) return

    const layer = L.geoJSON(geoData, {
      pane: 'choroplethPane',
      style: (feature) => {
        return getFeatureStyle(feature, choroplethValues, colorBreaks, metricConfig, selectedFips, hoveredFips, showNightlight)
      },
      onEachFeature: (feature, lyr) => {
        const fips = getFeatureFips(feature)
        lyr.on({
          mouseover(e) {
            setHoveredFips(fips)
            const html = getTooltipContent(
              fips,
              choroplethValuesRef.current,
              featureMetaByFipsRef.current,
              metricConfigRef.current,
            )
            if (!tooltipRef.current)
              tooltipRef.current = L.tooltip({ permanent: false, className: 'custom-tooltip', opacity: 1 })
            tooltipRef.current.setContent(html).setLatLng(e.latlng).addTo(mapObj)
          },
          mousemove(e) { tooltipRef.current?.setLatLng(e.latlng) },
          mouseout()   { setHoveredFips(null); tooltipRef.current?.remove() },
          click(e) {
            if (e?.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
            setSelectedFips(selectedFipsRef.current === fips ? null : fips)
          },
        })
      },
    }).addTo(mapObj)
    layer.bringToFront()
    geoLayerRef.current = layer
  }, [mapObj, geoData, showChoropleth])

  useEffect(() => {
    if (!mapObj) return

    const handleMapClick = (e) => {
      const clickTarget = e?.originalEvent?.target
      if (clickTarget?.classList?.contains('leaflet-interactive')) {
        return
      }
      setSelectedFips(null)
    }

    mapObj.on('click', handleMapClick)
    return () => {
      mapObj.off('click', handleMapClick)
    }
  }, [mapObj, setSelectedFips])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedFips(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setSelectedFips])

  // Update choropleth style in place for input/state changes
  useEffect(() => {
    if (!geoLayerRef.current || !showChoropleth) return
    geoLayerRef.current.setStyle((feature) => {
      return getFeatureStyle(feature, choroplethValues, colorBreaks, metricConfig, selectedFips, hoveredFips, showNightlight)
    })
  }, [choroplethValues, colorBreaks, metricConfig, selectedFips, hoveredFips, showChoropleth, showNightlight])

  useEffect(() => {
    if (!mapObj || !MAPBOX_TOKEN) return

    const targetMonth = showNightlight && NIGHTLIGHT_TILESETS[month] ? month : null
    console.log('nightlight month:', month, 'showNightlight:', showNightlight, 'targetMonth:', targetMonth)

    if (!showNightlight) {
      Object.values(nightlightLayersRef.current).forEach(layer => layer?.setOpacity(0))
      activeNightlightMonthRef.current = null
      return
    }

    if (!targetMonth) {
      Object.values(nightlightLayersRef.current).forEach(layer => layer?.setOpacity(0))
      activeNightlightMonthRef.current = null
      return
    }

    Object.entries(nightlightLayersRef.current).forEach(([monthKey, layer]) => {
      // Set target month to NIGHTLIGHT_OPACITY, all others to 0
      layer?.setOpacity(monthKey === targetMonth ? NIGHTLIGHT_OPACITY : 0)
      if (monthKey === targetMonth) {
        console.log('nightlight layer visible:', layer)
      }
    })
    activeNightlightMonthRef.current = targetMonth
  }, [mapObj, month, showNightlight])

  return (
    <>
      <div ref={mapDivRef} className="leaflet-map" />
      <PowerlineLayer map={mapObj} powerlineData={powerlineData} visible={showPowerlines} />
    </>
  )
}