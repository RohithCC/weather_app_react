// src/utils/api.js
// Dev:  Vite proxy  /api → http://203.201.62.116:8091
// Prod: Express     /api → http://203.201.62.116:8091

const BASE = '/api'

// ── Safe fetch ────────────────────────────────────────────────────────────────
async function safeFetch(url) {
  console.log(`[API] GET ${url}`)
  let res
  try {
    res = await fetch(url)
  } catch (err) {
    throw new Error(`Network error: ${err.message}`)
  }
  const text = await res.text()
  console.log(`[API] ${res.status} — preview: ${text.slice(0, 120)}`)
  if (text.trim().startsWith('<')) {
    throw new Error(`Got HTML instead of JSON at ${url}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from ${url}:\n${text.slice(0, 200)}`)
  }
}

// ── Try multiple endpoint patterns, return first that works ──────────────────
async function tryEndpoints(candidates) {
  const errors = []
  for (const url of candidates) {
    try {
      const json = await safeFetch(url)
      if (Array.isArray(json)) {
        console.log(`[API] ✅ Working endpoint: ${url}  (${json.length} records)`)
        return json
      }
      console.warn(`[API] ⚠️ ${url} returned non-array:`, typeof json)
    } catch (err) {
      console.warn(`[API] ❌ ${url} →`, err.message)
      errors.push(`${url}: ${err.message}`)
    }
  }
  throw new Error(
    `All endpoints failed. Check the API server is running.\n\n` +
    errors.join('\n')
  )
}

// ── Rainfall ──────────────────────────────────────────────────────────────────
export async function fetchRainfall(date) {
  return tryEndpoints([
    `${BASE}/rainfalldata/${date}`,
    `${BASE}/rainfall/${date}`,
    `${BASE}/RainfallData/${date}`,
    `${BASE}/Rainfalldata/${date}`,
    `${BASE}/rainfalldata?date=${date}`,
    `${BASE}/rainfall?date=${date}`,
    `${BASE}/ksndmc/rainfalldata/${date}`,
    `${BASE}/api/rainfalldata/${date}`,
  ])
}

// ── Weather ───────────────────────────────────────────────────────────────────
export async function fetchWeather(date) {
  return tryEndpoints([
    `${BASE}/weatherdata/${date}`,
    `${BASE}/weather/${date}`,
    `${BASE}/WeatherData/${date}`,
    `${BASE}/Weatherdata/${date}`,
    `${BASE}/weatherdata?date=${date}`,
    `${BASE}/weather?date=${date}`,
    `${BASE}/ksndmc/weatherdata/${date}`,
    `${BASE}/api/weatherdata/${date}`,
  ])
}

// ── District centroids (Karnataka) ───────────────────────────────────────────
export const DISTRICT_COORDS = {
  'BENGALURU URBAN':   { lat: 12.9716, lng: 77.5946 },
  'BENGALURU RURAL':   { lat: 13.1700, lng: 77.5100 },
  'MYSURU':            { lat: 12.2958, lng: 76.6394 },
  'MANDYA':            { lat: 12.5244, lng: 76.8962 },
  'HASSAN':            { lat: 13.0068, lng: 76.1004 },
  'DAKSHINA KANNADA':  { lat: 12.9141, lng: 75.4761 },
  'UDUPI':             { lat: 13.3409, lng: 74.7421 },
  'KODAGU':            { lat: 12.3375, lng: 75.8069 },
  'CHIKKAMAGALURU':    { lat: 13.3153, lng: 75.7754 },
  'SHIVAMOGGA':        { lat: 13.9299, lng: 75.5681 },
  'CHITRADURGA':       { lat: 14.2251, lng: 76.3980 },
  'DAVANGERE':         { lat: 14.4644, lng: 75.9218 },
  'TUMAKURU':          { lat: 13.3392, lng: 77.1010 },
  'KOLAR':             { lat: 13.1357, lng: 78.1290 },
  'CHIKKABALLAPURA':   { lat: 13.4355, lng: 77.7315 },
  'RAMANAGARA':        { lat: 12.7157, lng: 77.2789 },
  'CHAMARAJANAGARA':   { lat: 11.9261, lng: 76.9437 },
  'BALLARI':           { lat: 15.1394, lng: 76.9214 },
  'VIJAYANAGARA':      { lat: 15.3350, lng: 76.4600 },
  'KOPPAL':            { lat: 15.3547, lng: 76.1540 },
  'RAICHUR':           { lat: 16.2120, lng: 77.3439 },
  'YADGIR':            { lat: 16.7710, lng: 77.1384 },
  'KALABURAGI':        { lat: 17.3297, lng: 76.8343 },
  'BIDAR':             { lat: 17.9104, lng: 77.5199 },
  'DHARWAD':           { lat: 15.4589, lng: 75.0078 },
  'GADAG':             { lat: 15.4166, lng: 75.6271 },
  'HAVERI':            { lat: 14.7939, lng: 75.3996 },
  'UTTARA KANNADA':    { lat: 14.8600, lng: 74.5800 },
  'BELAGAVI':          { lat: 15.8497, lng: 74.4977 },
  'VIJAYAPURA':        { lat: 16.8302, lng: 75.7100 },
  'BAGALKOTE':         { lat: 16.1826, lng: 75.6960 },
}

// ── Format date YYYY-MM-DD ────────────────────────────────────────────────────
export function formatDate(d) {
  return d.toISOString().split('T')[0]
}

// ── Rainfall hierarchy builder ────────────────────────────────────────────────
export function buildRainfallHierarchy(rows) {
  const districts = {}
  rows.forEach(r => {
    const dist  = (r.DISTRICT || '').trim().toUpperCase()
    const taluk = (r.TALUK    || '').trim()
    const hobli = (r.HOBLI    || '').trim()
    const rain  = parseFloat(r.RAIN) || 0
    const date  = r.RECORDED_DATE || ''

    if (!dist) return
    if (!districts[dist])
      districts[dist] = { name: dist, rain: 0, count: 0, taluks: {} }
    districts[dist].rain  += rain
    districts[dist].count += 1

    if (!taluk) return
    if (!districts[dist].taluks[taluk])
      districts[dist].taluks[taluk] = { name: taluk, rain: 0, count: 0, hoblis: {} }
    districts[dist].taluks[taluk].rain  += rain
    districts[dist].taluks[taluk].count += 1

    if (!hobli) return
    if (!districts[dist].taluks[taluk].hoblis[hobli])
      districts[dist].taluks[taluk].hoblis[hobli] = { name: hobli, rain: 0, count: 0, date }
    districts[dist].taluks[taluk].hoblis[hobli].rain  += rain
    districts[dist].taluks[taluk].hoblis[hobli].count += 1
  })

  return Object.values(districts).map(d => ({
    ...d,
    avg:    d.count ? d.rain / d.count : 0,
    taluks: Object.values(d.taluks).map(t => ({
      ...t,
      avg:    t.count ? t.rain / t.count : 0,
      hoblis: Object.values(t.hoblis),
    })).sort((a, b) => b.rain - a.rain),
  })).sort((a, b) => b.rain - a.rain)
}

// ── Weather hierarchy builder ─────────────────────────────────────────────────
export function buildWeatherHierarchy(rows) {
  const districts = {}
  rows.forEach(r => {
    const dist  = (r.DISTRICT || '').trim().toUpperCase()
    const taluk = (r.TALUK    || '').trim()
    const hobli = (r.HOBLI    || '').trim()

    if (!dist) return
    if (!districts[dist]) districts[dist] = {
      name: dist, count: 0, taluks: {},
      minTemps:[], maxTemps:[], minRHs:[], maxRHs:[], minWSs:[], maxWSs:[],
    }
    const d = districts[dist]; d.count++
    if (r.MIN_TEMP) d.minTemps.push(+r.MIN_TEMP)
    if (r.MAX_TEMP) d.maxTemps.push(+r.MAX_TEMP)
    if (r.MIN_RH)   d.minRHs.push(+r.MIN_RH)
    if (r.MAX_RH)   d.maxRHs.push(+r.MAX_RH)
    if (r.MIN_WS)   d.minWSs.push(+r.MIN_WS)
    if (r.MAX_WS)   d.maxWSs.push(+r.MAX_WS)

    if (!taluk) return
    if (!d.taluks[taluk]) d.taluks[taluk] = {
      name: taluk, count: 0, hoblis: {},
      minTemps:[], maxTemps:[], minRHs:[], maxRHs:[], minWSs:[], maxWSs:[],
    }
    const t = d.taluks[taluk]; t.count++
    if (r.MIN_TEMP) t.minTemps.push(+r.MIN_TEMP)
    if (r.MAX_TEMP) t.maxTemps.push(+r.MAX_TEMP)
    if (r.MIN_RH)   t.minRHs.push(+r.MIN_RH)
    if (r.MAX_RH)   t.maxRHs.push(+r.MAX_RH)
    if (r.MIN_WS)   t.minWSs.push(+r.MIN_WS)
    if (r.MAX_WS)   t.maxWSs.push(+r.MAX_WS)

    if (!hobli) return
    if (!t.hoblis[hobli]) t.hoblis[hobli] = {
      name: hobli, count: 0,
      minTemps:[], maxTemps:[], minRHs:[], maxRHs:[], minWSs:[], maxWSs:[],
    }
    const h = t.hoblis[hobli]; h.count++
    if (r.MIN_TEMP) h.minTemps.push(+r.MIN_TEMP)
    if (r.MAX_TEMP) h.maxTemps.push(+r.MAX_TEMP)
  })

  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0

  return Object.values(districts).map(d => ({
    name: d.name, count: d.count,
    avgMinTemp: avg(d.minTemps), avgMaxTemp: avg(d.maxTemps),
    avgMinRH:   avg(d.minRHs),   avgMaxRH:   avg(d.maxRHs),
    avgMinWS:   avg(d.minWSs),   avgMaxWS:   avg(d.maxWSs),
    taluks: Object.values(d.taluks).map(t => ({
      name: t.name, count: t.count,
      avgMinTemp: avg(t.minTemps), avgMaxTemp: avg(t.maxTemps),
      avgMinRH:   avg(t.minRHs),   avgMaxRH:   avg(t.maxRHs),
      avgMinWS:   avg(t.minWSs),   avgMaxWS:   avg(t.maxWSs),
      hoblis: Object.values(t.hoblis).map(h => ({
        name: h.name, count: h.count,
        avgMinTemp: avg(h.minTemps), avgMaxTemp: avg(h.maxTemps),
      })),
    })).sort((a, b) => b.avgMaxTemp - a.avgMaxTemp),
  })).sort((a, b) => b.avgMaxTemp - a.avgMaxTemp)
}

// ── Color helpers ─────────────────────────────────────────────────────────────
export function rainColor(mm) {
  if (mm === 0) return '#1e3a4a'
  if (mm < 5)   return '#155e75'
  if (mm < 15)  return '#0e7490'
  if (mm < 30)  return '#0891b2'
  if (mm < 60)  return '#06b6d4'
  if (mm < 100) return '#38bdf8'
  return '#7dd3fc'
}

export function tempColor(c) {
  if (c < 20) return '#3b82f6'
  if (c < 25) return '#22d3ee'
  if (c < 30) return '#4ade80'
  if (c < 35) return '#facc15'
  if (c < 40) return '#fb923c'
  return '#ef4444'
}

export function rainLabel(mm) {
  if (mm === 0)  return 'No rain'
  if (mm < 5)    return 'Trace'
  if (mm < 15)   return 'Light'
  if (mm < 30)   return 'Moderate'
  if (mm < 60)   return 'Heavy'
  if (mm < 100)  return 'Very Heavy'
  return 'Extremely Heavy'
}