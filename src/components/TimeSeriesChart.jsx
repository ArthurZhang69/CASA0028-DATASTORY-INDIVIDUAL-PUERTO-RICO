import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart
} from 'recharts'

const METRIC_COLORS = {
  customerHours: '#ff2233',
  eventCount:    '#00c8ff',
  peakAffected:  '#ff9500',
}

function formatTick(val) {
  if (val >= 1_000_000) return `${(val/1_000_000).toFixed(1)}M`
  if (val >= 1_000)     return `${(val/1_000).toFixed(0)}K`
  return val
}

export default function TimeSeriesChart({ chartData, metric, metricConfig }) {
  const color = METRIC_COLORS[metric]

  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <div className="ct-label">{label}</div>
        <div className="ct-value" style={{ color }}>
          {formatTick(payload[0].value)} <span>{metricConfig.unit}</span>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={170}>
      <ComposedChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`ag-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="1 3" stroke="rgba(0,200,255,0.07)" horizontal={true} vertical={false} />
        <XAxis
          dataKey="monthLabel"
          tick={{ fill: 'rgba(184,212,232,0.3)', fontSize: 11, fontFamily: 'VT323, monospace' }}
          axisLine={{ stroke: 'rgba(0,200,255,0.15)' }}
          tickLine={false}
          interval={5}
        />
        <YAxis
          tickFormatter={formatTick}
          tick={{ fill: 'rgba(184,212,232,0.3)', fontSize: 11, fontFamily: 'VT323, monospace' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={customTooltip} />
        <ReferenceLine
          x="Sep '22"
          stroke="rgba(255,149,0,0.55)"
          strokeDasharray="3 2"
          label={{ value: '⚡ FIONA', position: 'insideTopLeft', fill: '#ff9500', fontSize: 9, fontFamily: 'Share Tech Mono' }}
        />
        <Area type="monotone" dataKey="value" stroke="none" fill={`url(#ag-${metric})`} />
        <Line
          type="stepAfter"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: color, stroke: '#000', strokeWidth: 1 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
