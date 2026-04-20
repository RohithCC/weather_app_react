import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid,
} from 'recharts'
import { rainColor, tempColor } from '../utils/api'

const Tip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-slate-200 mb-2 truncate max-w-32">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(1)}{unit || ''}
        </p>
      ))}
    </div>
  )
}

export function RainfallChart({ data }) {
  const top = data.slice(0, 15)
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Top 15 districts by rainfall</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top} margin={{ top: 4, right: 8, left: 0, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip content={<Tip unit=" mm" />} />
          <Bar dataKey="rain" name="Total Rain" radius={[3,3,0,0]}>
            {top.map((e, i) => (
              <Cell key={i} fill={rainColor(e.rain ?? 0)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function WeatherChart({ data, metric }) {
  const top = data.slice(0, 12)

  if (metric === 'temp') return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Temperature range by district (°C)</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top} margin={{ top: 4, right: 8, left: 0, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit="°" />
          <Tooltip content={<Tip unit="°C" />} />
          <Bar dataKey="avgMinTemp" name="Min" fill="#60a5fa" radius={[2,2,0,0]} />
          <Bar dataKey="avgMaxTemp" name="Max" fill="#fb923c" radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  if (metric === 'humidity') return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Humidity range (%)</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top} margin={{ top: 4, right: 8, left: 0, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
          <Tooltip content={<Tip unit="%" />} />
          <Bar dataKey="avgMinRH" name="Min RH" fill="#a78bfa" radius={[2,2,0,0]} />
          <Bar dataKey="avgMaxRH" name="Max RH" fill="#c084fc" radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Wind speed range (km/h)</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top} margin={{ top: 4, right: 8, left: 0, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
          <Tooltip content={<Tip unit=" km/h" />} />
          <Bar dataKey="avgMinWS" name="Min Wind" fill="#34d399" radius={[2,2,0,0]} />
          <Bar dataKey="avgMaxWS" name="Max Wind" fill="#6ee7b7" radius={[2,2,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
