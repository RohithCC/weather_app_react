import { useState, useEffect, useCallback } from 'react'
import { MapPin, Droplets, Thermometer, Wind, RefreshCw, AlertTriangle } from 'lucide-react'
import WeatherGoogleMap from './components/GoogleMap'
import HierarchyPanel  from './components/HierarchyPanel'
import { RainfallChart, WeatherChart } from './components/Charts'
import StatCard from './components/StatCard'
import {
  fetchRainfall, fetchWeather,
  buildRainfallHierarchy, buildWeatherHierarchy,
  formatDate,
} from './utils/api'

// ── Replace with your Google Maps API Key ─────────────────────────────────────
// Get a free key from: https://console.cloud.google.com/
// Enable: Maps JavaScript API
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

const TABS = [
  { id: 'map',      label: '🗺️  Map View'    },
  { id: 'rainfall', label: '🌧️  Rainfall'    },
  { id: 'weather',  label: '🌡️  Weather'     },
  { id: 'data',     label: '📊  Hierarchy'   },
]

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-cyan-400 rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Fetching data...</p>
    </div>
  )
}

function ErrorBox({ msg, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle size={40} className="text-amber-400" />
      <p className="text-slate-300 font-medium">Failed to load data</p>
      <p className="text-slate-500 text-sm max-w-sm text-center">{msg}</p>
      <button onClick={onRetry} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors">
        Retry
      </button>
    </div>
  )
}

export default function App() {
  const [date,      setDate]      = useState('2024-06-01')
  const [tab,       setTab]       = useState('map')
  const [mapMode,   setMapMode]   = useState('rainfall')
  const [wMetric,   setWMetric]   = useState('temp')

  // Raw data from API
  const [rawRain,    setRawRain]    = useState([])
  const [rawWeather, setRawWeather] = useState([])

  // Aggregated hierarchical data
  const [rainHier,   setRainHier]   = useState([])
  const [weatherHier,setWeatherHier]= useState([])

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [rain, weather] = await Promise.all([
        fetchRainfall(date),
        fetchWeather(date),
      ])
      setRawRain(rain)
      setRawWeather(weather)
      setRainHier(buildRainfallHierarchy(rain))
      setWeatherHier(buildWeatherHierarchy(weather))
    } catch (e) {
      setError(e.message || 'Network error. Is the API reachable?')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRain    = rainHier.reduce((s, d) => s + (d.rain ?? 0), 0)
  const rainyDists   = rainHier.filter(d => (d.rain ?? 0) > 0).length
  const topRain      = rainHier[0]
  const totalTaluks  = rainHier.reduce((s, d) => s + (d.taluks?.length || 0), 0)
  const totalHoblis  = rainHier.reduce((s, d) => s + d.taluks?.reduce((ts, t) => ts + (t.hoblis?.length || 0), 0), 0)

  const avgMaxTemp   = weatherHier.length ? weatherHier.reduce((s, d) => s + d.avgMaxTemp, 0) / weatherHier.length : 0
  const avgMaxRH     = weatherHier.length ? weatherHier.reduce((s, d) => s + d.avgMaxRH,  0) / weatherHier.length : 0
  const avgMaxWS     = weatherHier.length ? weatherHier.reduce((s, d) => s + d.avgMaxWS,  0) / weatherHier.length : 0

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cyan-500/20 rounded-xl flex items-center justify-center text-lg">🌦️</div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-none">Karnataka Weather Analytics</h1>
              <p className="text-xs text-slate-500 mt-0.5">District · Taluk · Hobli hierarchy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-500">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading…' : 'Fetch'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                tab === t.id
                  ? 'text-cyan-400 border-cyan-400'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {error && <ErrorBox msg={error} onRetry={load} />}

        {!error && loading && <Spinner />}

        {!error && !loading && (
          <>

            {/* ── MAP TAB ─────────────────────────────────────────────────── */}
            {tab === 'map' && (
              <div className="space-y-5">

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <StatCard icon="💧" label="Total Rain"    value={totalRain.toFixed(0)}  unit="mm"             color="cyan"   />
                  <StatCard icon="📍" label="Top District"  value={topRain?.rain.toFixed(0) ?? 0} unit="mm" sub={topRain?.name} color="blue" />
                  <StatCard icon="🌧️" label="Rainy Dists."  value={rainyDists}             unit={`/${rainHier.length}`} color="cyan" />
                  <StatCard icon="🏘️" label="Taluks"        value={totalTaluks}                                  color="purple" />
                  <StatCard icon="🌡️" label="Avg Max Temp"  value={avgMaxTemp.toFixed(1)}  unit="°C"             color="orange" />
                  <StatCard icon="💨" label="Avg Humidity"  value={avgMaxRH.toFixed(0)}    unit="%"              color="purple" />
                  <StatCard icon="🌬️" label="Avg Wind"      value={avgMaxWS.toFixed(1)}    unit="km/h"           color="green"  />
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Overlay:</span>
                  {[
                    { id: 'rainfall', label: '🌧️ Rainfall' },
                    { id: 'weather',  label: '🌡️ Temperature' },
                  ].map(m => (
                    <button key={m.id} onClick={() => setMapMode(m.id)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        mapMode === m.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}>
                      {m.label}
                    </button>
                  ))}

                  {!GOOGLE_MAPS_API_KEY && (
                    <span className="ml-auto text-xs text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Add VITE_GOOGLE_MAPS_API_KEY to .env for full map
                    </span>
                  )}
                </div>

                {/* Map + Hierarchy side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
                  <div>
                    <WeatherGoogleMap
                      rainfallData={rainHier}
                      weatherData={weatherHier}
                      mode={mapMode}
                      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                    />
                  </div>
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-200">
                        {mapMode === 'rainfall' ? '🌧️ Rainfall Hierarchy' : '🌡️ Weather Hierarchy'}
                      </h3>
                      <span className="text-xs text-slate-500">District → Taluk → Hobli</span>
                    </div>
                    <HierarchyPanel
                      rainfallData={rainHier}
                      weatherData={weatherHier}
                      mode={mapMode}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── RAINFALL TAB ─────────────────────────────────────────────── */}
            {tab === 'rainfall' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon="💧" label="Total Rainfall"  value={totalRain.toFixed(0)} unit="mm" color="cyan" />
                  <StatCard icon="🌧️" label="Rainy Districts" value={rainyDists} color="blue" />
                  <StatCard icon="📍" label="Top District"    value={topRain?.rain.toFixed(1) ?? 0} unit="mm" sub={topRain?.name} color="cyan" />
                  <StatCard icon="🏘️" label="Total Taluks"    value={totalTaluks} color="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">Rainfall by District</h2>
                    <RainfallChart data={rainHier} />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">District → Taluk Hierarchy</h2>
                    <HierarchyPanel rainfallData={rainHier} weatherData={weatherHier} mode="rainfall" />
                  </div>
                </div>
              </div>
            )}

            {/* ── WEATHER TAB ──────────────────────────────────────────────── */}
            {tab === 'weather' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard icon="🌡️" label="Avg Max Temp"  value={avgMaxTemp.toFixed(1)} unit="°C" color="orange" />
                  <StatCard icon="🌬️" label="Avg Max Wind"  value={avgMaxWS.toFixed(1)}   unit="km/h" color="green" />
                  <StatCard icon="💧" label="Avg Max RH"    value={avgMaxRH.toFixed(0)}   unit="%" color="purple" />
                  <StatCard icon="📍" label="Districts"     value={weatherHier.length} color="cyan" />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'temp',     label: '🌡️ Temperature' },
                    { id: 'humidity', label: '💧 Humidity'    },
                    { id: 'wind',     label: '🌬️ Wind'        },
                  ].map(m => (
                    <button key={m.id} onClick={() => setWMetric(m.id)}
                      className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${
                        wMetric === m.id ? 'bg-cyan-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">Weather Analytics</h2>
                    <WeatherChart data={weatherHier} metric={wMetric} />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4">District → Taluk Hierarchy</h2>
                    <HierarchyPanel rainfallData={rainHier} weatherData={weatherHier} mode="weather" />
                  </div>
                </div>
              </div>
            )}

            {/* ── HIERARCHY DATA TAB ───────────────────────────────────────── */}
            {tab === 'data' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">District → Taluk → Hobli</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {rainHier.length} districts · {totalTaluks} taluks · {totalHoblis} hoblis
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {['rainfall','weather'].map(m => (
                      <button key={m} onClick={() => setMapMode(m)}
                        className={`px-4 py-2 text-xs font-medium rounded-lg capitalize transition-all ${
                          mapMode === m ? 'bg-cyan-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}>
                        {m === 'rainfall' ? '🌧️ Rainfall' : '🌡️ Weather'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">
                      {mapMode === 'rainfall' ? 'Rainfall hierarchy' : 'Weather hierarchy'}
                    </h3>
                    <HierarchyPanel
                      rainfallData={rainHier}
                      weatherData={weatherHier}
                      mode={mapMode}
                    />
                  </div>

                  {/* Raw data table */}
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">
                      Raw station data ({mapMode === 'rainfall' ? rawRain.length : rawWeather.length} records)
                    </h3>
                    <div className="overflow-auto rounded-xl border border-slate-700/50" style={{ maxHeight: 480 }}>
                      <table className="w-full text-xs" style={{ minWidth: 500 }}>
                        <thead className="sticky top-0 bg-slate-800">
                          <tr>
                            {mapMode === 'rainfall'
                              ? ['District','Taluk','Hobli','Rain (mm)'].map(h => (
                                  <th key={h} className="text-left px-3 py-2.5 text-slate-400 font-semibold uppercase tracking-wide border-b border-slate-700">{h}</th>
                                ))
                              : ['District','Taluk','Hobli','Min°C','Max°C','Max RH%','Max WS'].map(h => (
                                  <th key={h} className="text-left px-3 py-2.5 text-slate-400 font-semibold uppercase tracking-wide border-b border-slate-700">{h}</th>
                                ))
                            }
                          </tr>
                        </thead>
                        <tbody>
                          {(mapMode === 'rainfall' ? rawRain : rawWeather).slice(0, 200).map((r, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                              {mapMode === 'rainfall' ? (
                                <>
                                  <td className="px-3 py-2 text-slate-300 font-medium">{r.DISTRICT}</td>
                                  <td className="px-3 py-2 text-slate-400">{r.TALUK}</td>
                                  <td className="px-3 py-2 text-slate-500">{r.HOBLI}</td>
                                  <td className="px-3 py-2">
                                    <span className={`font-bold ${parseFloat(r.RAIN) > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>
                                      {r.RAIN}
                                    </span>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3 py-2 text-slate-300 font-medium">{r.DISTRICT}</td>
                                  <td className="px-3 py-2 text-slate-400">{r.TALUK}</td>
                                  <td className="px-3 py-2 text-slate-500">{r.HOBLI}</td>
                                  <td className="px-3 py-2 text-blue-400 font-semibold">{parseFloat(r.MIN_TEMP).toFixed(1)}</td>
                                  <td className="px-3 py-2 text-orange-400 font-semibold">{parseFloat(r.MAX_TEMP).toFixed(1)}</td>
                                  <td className="px-3 py-2 text-purple-400">{parseFloat(r.MAX_RH).toFixed(0)}</td>
                                  <td className="px-3 py-2 text-green-400">{parseFloat(r.MAX_WS).toFixed(1)}</td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {(mapMode === 'rainfall' ? rawRain : rawWeather).length > 200 && (
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        Showing first 200 of {(mapMode === 'rainfall' ? rawRain : rawWeather).length} records
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

          </>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-6 border-t border-slate-800 mt-8 text-xs text-slate-600 flex justify-between flex-wrap gap-2">
        <span></span>
        <span>API: 203.201.62.116:8091 · Date: {date}</span>
      </footer>
    </div>
  )
}
