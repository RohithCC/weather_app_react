export default function StatCard({ icon, label, value, unit, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cyan:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    green:  'bg-green-500/10 text-green-400 border-green-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red:    'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-medium opacity-70 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm opacity-60">{unit}</span>}
      </div>
      {sub && <span className="text-xs opacity-50 truncate">{sub}</span>}
    </div>
  )
}
