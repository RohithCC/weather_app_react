// src/components/GoogleMap.jsx
// Interactive Google Maps with District → Taluk → Hobli hierarchy

import { useCallback, useRef, useState } from 'react'
import {
  GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle,
} from '@react-google-maps/api'
import { DISTRICT_COORDS, rainColor, tempColor, rainLabel } from '../utils/api'

const MAP_CENTER  = { lat: 15.3173, lng: 75.7139 }
const LIBRARIES   = ['places']

const MAP_OPTIONS = {
  mapTypeId:          'roadmap',
  disableDefaultUI:   false,
  zoomControl:        true,
  mapTypeControl:     false,
  streetViewControl:  false,
  fullscreenControl:  true,
  styles: [
    { elementType: 'geometry',             stylers: [{ color: '#1a2744' }] },
    { elementType: 'labels.text.fill',     stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke',   stylers: [{ color: '#1a3646' }] },
    { featureType: 'water',    elementType: 'geometry',           stylers: [{ color: '#0e1626' }] },
    { featureType: 'water',    elementType: 'labels.text.fill',   stylers: [{ color: '#4e6d70' }] },
    { featureType: 'road',     elementType: 'geometry',           stylers: [{ color: '#2c3d55' }] },
    { featureType: 'road',     elementType: 'geometry.stroke',    stylers: [{ color: '#1a2744' }] },
    { featureType: 'road.highway', elementType: 'geometry',       stylers: [{ color: '#3c5a80' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#4b6a88' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
    { featureType: 'poi',      elementType: 'geometry',           stylers: [{ color: '#1d3557' }] },
    { featureType: 'transit',  elementType: 'geometry',           stylers: [{ color: '#2f3948' }] },
    { featureType: 'landscape',elementType: 'geometry',           stylers: [{ color: '#1b2a3a' }] },
  ],
}

// ── Rainfall popup ────────────────────────────────────────────────────────────
function RainPopup({ district }) {
  return (
    <div style={{ minWidth: 260, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>📍 {district.name}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
          {district.taluks?.length || 0} taluks · {district.count} stations
        </div>
      </div>
      <div style={{ padding: '10px 14px', background: '#0f172a' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
          <div style={{ background: '#1e293b', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>TOTAL RAIN</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>
              {(district.rain ?? 0).toFixed(1)}
              <span style={{ fontSize: 11, marginLeft: 2, color: '#94a3b8' }}>mm</span>
            </div>
          </div>
          <div style={{ background: '#1e293b', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>AVG / STATION</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#7dd3fc' }}>
              {(district.avg ?? 0).toFixed(1)}
              <span style={{ fontSize: 11, marginLeft: 2, color: '#94a3b8' }}>mm</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Taluks
        </div>
        <div style={{ maxHeight: 150, overflowY: 'auto' }}>
          {district.taluks?.slice(0, 8).map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
              <div>
                <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: '#475569' }}>{t.hoblis?.length || 0} hoblis</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: (t.rain ?? 0) > 0 ? '#38bdf8' : '#475569' }}>
                {(t.rain ?? 0).toFixed(1)} mm
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Weather popup ─────────────────────────────────────────────────────────────
function WeatherPopup({ district }) {
  return (
    <div style={{ minWidth: 260, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#0f172a', borderBottom: '1px solid #334155', padding: '10px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>📍 {district.name}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
          {district.taluks?.length || 0} taluks · {district.count} stations
        </div>
      </div>
      <div style={{ padding: '10px 14px', background: '#0f172a' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'MAX TEMP',     value: `${(district.avgMaxTemp ?? 0).toFixed(1)}°C`, color: '#fb923c' },
            { label: 'MIN TEMP',     value: `${(district.avgMinTemp ?? 0).toFixed(1)}°C`, color: '#60a5fa' },
            { label: 'MAX HUMIDITY', value: `${(district.avgMaxRH   ?? 0).toFixed(0)}%`,  color: '#a78bfa' },
            { label: 'MAX WIND',     value: `${(district.avgMaxWS   ?? 0).toFixed(1)} km/h`, color: '#34d399' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#1e293b', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' }}>
          Taluks
        </div>
        <div style={{ maxHeight: 130, overflowY: 'auto' }}>
          {district.taluks?.slice(0, 6).map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
              <div style={{ fontSize: 12, color: '#e2e8f0' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#fb923c', fontWeight: 600 }}>
                {(t.avgMaxTemp ?? 0).toFixed(1)}°C
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WeatherGoogleMap({ rainfallData = [], weatherData = [], mode = 'rainfall', googleMapsApiKey = '' }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries: LIBRARIES,
  })

  const mapRef   = useRef(null)
  const [selected, setSelected] = useState(null)

  const onLoad    = useCallback(map => { mapRef.current = map }, [])
  const onUnmount = useCallback(() => { mapRef.current = null }, [])

  // ── Loading / error states ──
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-400 text-sm gap-2">
        ⚠️ Google Maps failed to load — check your API key.
      </div>
    )
  }

  if (!googleMapsApiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-800/50 rounded-xl border border-slate-700/50 gap-3 text-center px-6">
        <span className="text-3xl">🗺️</span>
        <p className="text-slate-300 font-semibold">Google Maps API key not set</p>
        <p className="text-slate-500 text-xs max-w-xs">
          Add <code className="text-cyan-400">VITE_GOOGLE_MAPS_API_KEY</code> to your <code className="text-cyan-400">.env</code> file.
          <br/>Data is still available in the Rainfall, Weather and Hierarchy tabs.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-slate-600 border-t-cyan-400 rounded-full animate-spin"/>
          <span className="text-slate-400 text-sm">Loading Google Maps…</span>
        </div>
      </div>
    )
  }

  const data = mode === 'rainfall' ? rainfallData : weatherData

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/50" style={{ height: 520 }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={MAP_CENTER}
        zoom={7}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={() => setSelected(null)}
      >
        {/* Circles */}
        {data.map((district, i) => {
          const coord = DISTRICT_COORDS[district.name?.toUpperCase()]
          if (!coord) return null

          const value  = mode === 'rainfall' ? (district.rain ?? 0) : (district.avgMaxTemp ?? 0)
          const color  = mode === 'rainfall' ? rainColor(value) : tempColor(value)
          const radius = mode === 'rainfall'
            ? Math.max(12000, Math.min(55000, 12000 + value * 1000))
            : 22000

          return (
            <Circle
              key={i}
              center={coord}
              radius={radius}
              options={{
                strokeColor:   color,
                strokeOpacity: 0.9,
                strokeWeight:  1.5,
                fillColor:     color,
                fillOpacity:   0.35,
                clickable:     true,
                zIndex:        1,
              }}
              onClick={() => setSelected(district)}
            />
          )
        })}

        {/* Labels */}
        {data.map((district, i) => {
          const coord = DISTRICT_COORDS[district.name?.toUpperCase()]
          if (!coord) return null
          const value = mode === 'rainfall' ? (district.rain ?? 0) : (district.avgMaxTemp ?? 0)

          return (
            <Marker
              key={`lbl-${i}`}
              position={coord}
              onClick={() => setSelected(district)}
              icon={{
                path:  window.google.maps.SymbolPath.CIRCLE,
                scale: 0,
              }}
              label={{
                text:       mode === 'rainfall' ? `${value.toFixed(0)}mm` : `${value.toFixed(0)}°`,
                color:      '#ffffff',
                fontSize:   '10px',
                fontWeight: '700',
              }}
            />
          )
        })}

        {/* InfoWindow */}
        {selected && (() => {
          const coord = DISTRICT_COORDS[selected.name?.toUpperCase()]
          if (!coord) return null
          return (
            <InfoWindow
              position={coord}
              onCloseClick={() => setSelected(null)}
              options={{ pixelOffset: new window.google.maps.Size(0, -10) }}
            >
              {mode === 'rainfall'
                ? <RainPopup    district={selected} />
                : <WeatherPopup district={selected} />
              }
            </InfoWindow>
          )
        })()}
      </GoogleMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur rounded-xl p-3 border border-slate-700/50 text-xs">
        {mode === 'rainfall' ? (
          <>
            <div className="text-slate-400 font-semibold mb-2">Rainfall (mm)</div>
            {[
              ['No rain', '#1e3a4a'],
              ['< 5 mm',  '#155e75'],
              ['5–15',    '#0e7490'],
              ['15–30',   '#0891b2'],
              ['30–60',   '#06b6d4'],
              ['60+',     '#38bdf8'],
            ].map(([l, c]) => (
              <div key={l} className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c }}/>
                <span className="text-slate-300">{l}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="text-slate-400 font-semibold mb-2">Max Temp (°C)</div>
            {[
              ['< 20',  '#3b82f6'],
              ['20–25', '#22d3ee'],
              ['25–30', '#4ade80'],
              ['30–35', '#facc15'],
              ['35–40', '#fb923c'],
              ['40+',   '#ef4444'],
            ].map(([l, c]) => (
              <div key={l} className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c }}/>
                <span className="text-slate-300">{l}</span>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="absolute top-3 right-3 z-10 bg-slate-900/90 rounded-lg px-3 py-1.5 text-xs text-slate-400 border border-slate-700/50">
        {mode === 'rainfall' ? '🌧️ Click district for details' : '🌡️ Click district for details'}
      </div>
    </div>
  )
}