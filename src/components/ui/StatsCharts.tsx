'use client';

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Profile } from '@/store/useAppStore';
import { Trophy, TrendingUp, Target, Activity } from 'lucide-react';

interface StatChartsProps {
  profile: Profile;
}

// Themed colour resolver — reads CSS vars at render time (client only)
const cssVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
};

const CustomTooltipStyle: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.6rem 1rem',
  fontSize: '0.82rem',
  color: 'var(--text-primary)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

function WinLossTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CustomTooltipStyle}>
      <strong style={{ color: payload[0].payload.fill }}>{payload[0].name}</strong>
      <div>{payload[0].value} matches</div>
    </div>
  );
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CustomTooltipStyle}>
      <strong>{label}</strong>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.fill }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

// Custom legend for Win/Loss donut
function WinLossLegend({ wins, losses, total }: { wins: number; losses: number; total: number }) {
  const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Wins</span>
        <strong style={{ color: 'var(--accent-cyan)' }}>{wins}</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-red)', display: 'inline-block' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Losses</span>
        <strong style={{ color: 'var(--accent-red)' }}>{losses}</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Win Rate</span>
        <strong style={{ color: 'var(--accent-gold)' }}>{winPct}%</strong>
      </div>
    </div>
  );
}

// Center label for donut
function DonutCenterLabel({ viewBox, wins, total }: any) {
  const { cx, cy } = viewBox;
  const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: '1.8rem', fontWeight: 900, fill: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
        {pct}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: '0.65rem', fill: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Win Rate
      </text>
    </>
  );
}

export default function StatsCharts({ profile }: StatChartsProps) {
  const wins    = profile.stats?.wins ?? 0;
  const losses  = profile.stats?.losses ?? 0;
  const mvps    = profile.stats?.mvps ?? 0;
  const kda     = parseFloat(profile.stats?.kda ?? '0') || 0;
  const points  = profile.stats?.points ?? 1000;
  const total   = profile.stats?.totalTournaments ?? (wins + losses);

  // ── Win/Loss Donut data ──
  const donutData = [
    { name: 'Wins', value: wins || 0 },
    { name: 'Losses', value: losses || 0 },
  ];
  const hasDonutData = wins > 0 || losses > 0;

  // ── Radar chart data ── normalise each axis 0-100
  const maxPoints = Math.max(points, 1);
  const radarData = [
    { axis: 'Points',      value: Math.min(Math.round((points / Math.max(maxPoints, 5000)) * 100), 100) },
    { axis: 'Wins',        value: Math.min(wins * 10, 100) },
    { axis: 'MVPs',        value: Math.min(mvps * 20, 100) },
    { axis: 'KDA',         value: Math.min(Math.round(kda * 20), 100) },
    { axis: 'Tournaments', value: Math.min(total * 10, 100) },
  ];

  // ── Bar chart data ── monthly-style breakdown (use current stats as a single snapshot)
  const barData = [
    { label: 'Wins',   Wins: wins,   Losses: 0 },
    { label: 'Losses', Wins: 0,      Losses: losses },
    { label: 'MVPs',   MVPs: mvps },
    { label: 'Tournaments', Tournaments: total },
  ];

  // More readable bar chart — per-category
  const barDataFlat = [
    { name: 'Wins',         value: wins,   color: 'var(--accent-cyan)' },
    { name: 'Losses',       value: losses, color: 'var(--accent-red)'  },
    { name: 'MVPs',         value: mvps,   color: 'var(--accent-gold)' },
    { name: 'Tournaments',  value: total,  color: 'var(--accent-violet)' },
    { name: 'XP / 100',    value: Math.floor(points / 100), color: '#00FF88' },
  ];

  const CARD_STYLE: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '1.75rem',
    backdropFilter: 'blur(12px)',
  };

  const SECTION_TITLE: React.CSSProperties = {
    fontSize: '0.72rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--accent-cyan)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Quick Stat Pills ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'XP Points', value: points.toLocaleString(), color: 'var(--accent-cyan)',   icon: <Activity size={18} /> },
          { label: 'Total Wins', value: wins,                   color: 'var(--accent-green)',  icon: <Trophy size={18} /> },
          { label: 'MVPs',       value: mvps,                   color: 'var(--accent-gold)',   icon: <Target size={18} /> },
          { label: 'KDA',        value: kda.toFixed(1),         color: 'var(--accent-violet)', icon: <TrendingUp size={18} /> },
        ].map(stat => (
          <div key={stat.label} style={{
            ...CARD_STYLE,
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            borderColor: stat.color.includes('cyan') ? 'rgba(var(--accent-cyan-rgb),0.25)' : 'var(--border-color)',
          }}>
            <div style={{ color: stat.color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {stat.icon}
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {stat.label}
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--text-primary)', lineHeight: 1 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Row: Donut + Radar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

        {/* Win / Loss Donut */}
        <div style={CARD_STYLE}>
          <p style={SECTION_TITLE}><Trophy size={14} /> Win / Loss Ratio</p>
          {!hasDonutData ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No match data yet — start competing!
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell key="wins"   fill="var(--accent-cyan)" />
                    <Cell key="losses" fill="var(--accent-red)"  />
                    <DonutCenterLabel viewBox={{ cx: '50%', cy: 110 }} wins={wins} total={wins + losses} />
                  </Pie>
                  <Tooltip content={<WinLossTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <WinLossLegend wins={wins} losses={losses} total={wins + losses} />
            </>
          )}
        </div>

        {/* Radar Performance Chart */}
        <div style={CARD_STYLE}>
          <p style={SECTION_TITLE}><Activity size={14} /> Performance Radar</p>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={false}
                axisLine={false}
              />
              <Radar
                name="Stats"
                dataKey="value"
                stroke="var(--accent-cyan)"
                fill="var(--accent-cyan)"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ r: 3, fill: 'var(--accent-cyan)', strokeWidth: 0 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Stats Bar Chart ── */}
      <div style={CARD_STYLE}>
        <p style={SECTION_TITLE}><TrendingUp size={14} /> Career Stats Breakdown</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barDataFlat} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={CustomTooltipStyle}>
                    <strong>{label}</strong>
                    <div style={{ color: payload[0]?.payload?.color ?? 'var(--accent-cyan)' }}>
                      {payload[0]?.value}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {barDataFlat.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
