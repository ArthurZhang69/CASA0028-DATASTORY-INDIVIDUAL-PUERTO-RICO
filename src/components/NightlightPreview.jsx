import { useEffect, useRef } from 'react'
import L from 'leaflet'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const PREVIEW_TILESETS_BY_MONTH = {
  '2022-01': 'arthurzhang.3wfajcsn',
  '2022-02': 'arthurzhang.az8etyhh',
  '2022-03': 'arthurzhang.7w4bzl0k',
  '2022-04': 'arthurzhang.davxw60y',
  '2022-05': 'arthurzhang.4d72fkw2',
  '2022-06': 'arthurzhang.5vphepo6',
  '2022-07': 'arthurzhang.3jomsud5',
  '2022-08': 'arthurzhang.0rk2kvpq',
  '2022-09': 'arthurzhang.0x6f6bjc',
  '2022-10': 'arthurzhang.6qmbhbn8',
  '2022-11': 'arthurzhang.45jd6jm5',
  '2022-12': 'arthurzhang.d9mjekpz',
}

const TILESET_NATIVE_MAX_ZOOM = 9
const PR_TILE_BOUNDS = [[17.75, -67.4], [18.6, -65.15]]
const PREVIEW_ZOOM_IN_LEVELS = 0.05
const PREVIEW_LNG_SHIFT = 0.08
const TILE_OPTIONS = {
  opacity: 0,
  maxNativeZoom: TILESET_NATIVE_MAX_ZOOM,
  maxZoom: 18,
  bounds: PR_TILE_BOUNDS,
  noWrap: true,
}

function getMapboxTilesetUrl(tilesetId) {
  return `https://api.mapbox.com/v4/${tilesetId}/{z}/{x}/{y}.png?access_token=${MAPBOX_TOKEN}`
}

export default function NightlightPreview({ month, showNightlightChange, selectedGeometry }) {
  const mapDivRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({})
  const selectedBoundaryLayerRef = useRef(null)

  // Init map + preload ALL month layers at opacity 0
  useEffect(() => {
    if (!mapDivRef.current || !MAPBOX_TOKEN) return

    const map = L.map(mapDivRef.current, {
      center: [18.22, -66.5],
      zoom: 8,
      minZoom: 6,
      maxZoom: 18,
      zoomSnap: 0.1,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
      inertia: false,
    })

    map.createPane('previewNightPane')
    map.getPane('previewNightPane').style.zIndex = '340'
    map.createPane('previewBoundaryPane')
    map.getPane('previewBoundaryPane').style.zIndex = '520'

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      opacity: 0.68,
    }).addTo(map)

    map.whenReady(() => {
      map.fitBounds(PR_TILE_BOUNDS, { padding: [6, 6] })
      map.setZoom(map.getZoom() + PREVIEW_ZOOM_IN_LEVELS)
      const center = map.getCenter()
      map.setView([center.lat, center.lng + PREVIEW_LNG_SHIFT], map.getZoom(), { animate: false })
    })

    // Preload all months at opacity 0
    Object.entries(PREVIEW_TILESETS_BY_MONTH).forEach(([monthKey, tilesetId]) => {
      const layer = L.tileLayer(getMapboxTilesetUrl(tilesetId), {
        ...TILE_OPTIONS,
        pane: 'previewNightPane',
      })
      layer.addTo(map)
      layersRef.current[monthKey] = layer
    })

    mapRef.current = map

    return () => {
      Object.values(layersRef.current).forEach(l => l?.remove())
      layersRef.current = {}
      selectedBoundaryLayerRef.current?.remove()
      selectedBoundaryLayerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Switch month by toggling opacity only — no loading delay
  useEffect(() => {
    if (!mapRef.current) return
    const targetMonth = showNightlightChange ? month : null
    Object.entries(layersRef.current).forEach(([monthKey, layer]) => {
      layer?.setOpacity(monthKey === targetMonth ? 1 : 0)
    })
  }, [month, showNightlightChange])

  // Selected boundary with pulse
  useEffect(() => {
    if (!mapRef.current) return

    selectedBoundaryLayerRef.current?.remove()
    selectedBoundaryLayerRef.current = null

    if (!selectedGeometry) return

    const layer = L.geoJSON(
      { type: 'Feature', geometry: selectedGeometry, properties: {} },
      {
        pane: 'previewBoundaryPane',
        style: { color: '#ff2233', weight: 2.5, opacity: 1, fill: false },
      },
    ).addTo(mapRef.current)

    selectedBoundaryLayerRef.current = layer

    const pane = mapRef.current.getPane('previewBoundaryPane')
    const applyPulse = () => {
      const paths = pane?.querySelectorAll('path')
      if (!paths?.length) return
      paths.forEach(p => {
        p.style.transition = 'none'
        p.style.animation = 'preview-boundary-pulse 0.9s ease-in-out 3'
      })
      setTimeout(() => {
        paths.forEach(p => {
          p.style.animation = 'none'
          p.style.opacity = '1'
          layer.setStyle({ weight: 1.3, opacity: 1 })
        })
      }, 2800)
    }
    setTimeout(applyPulse, 50)
    return () => {}
  }, [selectedGeometry])

  return (
    <div className="nightlight-preview-wrap">
      {!MAPBOX_TOKEN && <div className="nightlight-preview-empty">MAPBOX TOKEN MISSING</div>}
      <div ref={mapDivRef} className="nightlight-preview" />
      <div className="nightlight-legend">
        <div className="nightlight-legend-title">NIGHTTIME LIGHTS</div>
        <div className="nightlight-legend-bar" />
        <div className="nightlight-legend-labels">
          <span>LESS</span>
          <span>MORE</span>
        </div>
      </div>
    </div>
  )
}