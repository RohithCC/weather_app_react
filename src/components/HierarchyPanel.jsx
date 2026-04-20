// src/components/HierarchyPanel.jsx
// Collapsible tree: District → Taluk → Hobli with rainfall / weather data

import { useState } from 'react'
import { ChevronRight, ChevronDown, MapPin, Droplets, Thermometer, Wind } from 'lucide-react'
import { rainColor, tempColor } from '../utils/api'

function RainBadge({ mm }) {
  const color = rainColor(mm)
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: color + '33', color, border: `1px solid ${color}66` }}
    >
      {mm.toFixed(1)} mm
    </span>
  )
}

function TempBadge({ temp }) {
  const color = tempColor(temp)
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: color + '33', color, border: `1px solid ${color}66` }}
    >
      {temp.toFixed(1)}°C
    </span>
  )
}

// Hobli row
function HobliRow({ hobli, mode }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/60 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-slate-300 truncate">{hobli.name}</p>
          {mode === 'rainfall' && hobli.date && (
            <p className="text-[10px] text-slate-600">{hobli.date}</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 ml-2">
        {mode === 'rainfall'
          ? <RainBadge mm={hobli.rain ?? 0} />
          : <TempBadge temp={hobli.avgMaxTemp ?? 0} />
        }
      </div>
    </div>
  )
}

// Taluk row (collapsible)
function TalukRow({ taluk, mode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown size={13} className="text-slate-500 flex-shrink-0" />
                : <ChevronRight size={13} className="text-slate-500 flex-shrink-0" />}
          <div className="min-w-0 text-left">
            <p className="text-xs font-medium text-slate-200 truncate">{taluk.name}</p>
            <p className="text-[10px] text-slate-500">
              {mode === 'rainfall'
                ? `${taluk.hoblis?.length || 0} hoblis`
                : `${taluk.hoblis?.length || 0} hoblis`
              }
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-2">
          {mode === 'rainfall'
            ? <RainBadge mm={taluk.rain ?? 0} />
            : <TempBadge temp={taluk.avgMaxTemp ?? 0} />
          }
        </div>
      </button>
      {open && taluk.hoblis?.length > 0 && (
        <div className="ml-4 border-l border-slate-800 pl-2 mt-1 mb-1 space-y-0.5">
          {taluk.hoblis.map((h, i) => (
            <HobliRow key={i} hobli={h} mode={mode} />
          ))}
        </div>
      )}
    </div>
  )
}

// District row (collapsible)
function DistrictRow({ district, mode, index }) {
  const [open, setOpen] = useState(index < 3)

  const value = mode === 'rainfall' ? district.rain : district.avgMaxTemp
  const color = mode === 'rainfall' ? rainColor(district.rain ?? 0) : tempColor(district.avgMaxTemp ?? 0)
  const maxVal = mode === 'rainfall' ? 100 : 45

  return (
    <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {open ? <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />
                : <ChevronRight size={15} className="text-slate-400 flex-shrink-0" />}
          <MapPin size={13} className="text-slate-500 flex-shrink-0" />
          <div className="min-w-0 text-left flex-1">
            <p className="text-sm font-semibold text-slate-100 truncate">{district.name}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-slate-500">{district.taluks?.length || 0} taluks</span>
              <span className="text-[10px] text-slate-500">{district.count} stations</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {mode === 'rainfall'
            ? <RainBadge mm={district.rain ?? 0} />
            : <TempBadge temp={district.avgMaxTemp ?? 0} />
          }
          {/* mini bar */}
          <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (value / maxVal) * 100)}%`,
                background: color,
              }}
            />
          </div>
        </div>
      </button>

      {open && district.taluks?.length > 0 && (
        <div className="px-3 pb-3 space-y-0.5">
          {district.taluks.map((t, i) => (
            <TalukRow key={i} taluk={t} mode={mode} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function HierarchyPanel({ rainfallData, weatherData, mode }) {
  const [search, setSearch] = useState('')
  const data = mode === 'rainfall' ? rainfallData : weatherData

  const filtered = data.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.taluks?.some(t => t.name?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search district or taluk..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>
      <div className="text-xs text-slate-500 mb-3">
        {filtered.length} districts · {filtered.reduce((s, d) => s + (d.taluks?.length || 0), 0)} taluks
      </div>
      <div className="overflow-y-auto flex-1" style={{ maxHeight: 520 }}>
        {filtered.map((district, i) => (
          <DistrictRow key={i} district={district} mode={mode} index={i} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 py-8 text-sm">No results found</p>
        )}
      </div>
    </div>
  )
}
