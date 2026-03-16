import { useState } from 'react'

// ── Historic seed data (from your 10-year PDFs) ───────────────
const SEED_DATA = [
  { seed: 1,        label: '#1 Seeds',     avg: 197, roi:  21, lastYear: 256, note: 'Strongest value per dollar' },
  { seed: 2,        label: '#2 Seeds',     avg: 118, roi: -10, lastYear: 144, note: 'Slight underperformer'       },
  { seed: 3,        label: '#3 Seeds',     avg:  80, roi:  -5, lastYear:  89, note: 'Roughly break-even'          },
  { seed: 4,        label: '#4 Seeds',     avg:  62, roi:  21, lastYear:  83, note: 'Tied for best ROI'           },
  { seed: 5,        label: '#5 Seeds',     avg:  53, roi:   3, lastYear:  70, note: 'Slight positive'             },
  { seed: 6,        label: '#6 Seeds',     avg:  41, roi: -31, lastYear:  58, note: 'Most overpriced tier'        },
  { seed: 7,        label: '#7 Seeds',     avg:  35, roi: -19, lastYear:  60, note: 'Consistent underperformer'   },
  { seed: 8,        label: '#8 Seeds',     avg:  35, roi: -24, lastYear:  60, note: 'Avoid at current prices'     },
  { seed: 9,        label: '#9 Seeds',     avg:  29, roi:   4, lastYear:  41, note: 'Underpriced, slight positive' },
  { seed: 10,       label: '#10 Seeds',    avg:  27, roi: -22, lastYear:  41, note: 'Higher variance'             },
  { seed: 11,       label: '#11 Seeds',    avg:  31, roi:  33, lastYear:  54, note: 'Best ROI outside top 5'      },
  { seed: 'block',  label: '12–14 Block',  avg: 150, roi: -37, lastYear: 155, note: 'Worst value in the pool'     },
  { seed: 15,       label: '#15 Seeds',    avg:  18, roi: -30, lastYear:  20, note: 'Usually overpriced for risk' },
  { seed: 16,       label: '#16 Seeds',    avg:  21, roi:  12, lastYear:  21, note: 'Cheap enough to beat odds'   },
]

// ── Historic owner data (from your 10-year PDFs) ──────────────
const OWNER_HISTORY = [
  { owner: 'ARNEY',     teams:  49, bids: 1899, gross: 1705, net:  -194, roi: -10 },
  { owner: 'BEARS',     teams:  75, bids: 2939, gross: 3431, net:   492, roi:  17 },
  { owner: 'HOSLEY',    teams:  22, bids: 1324, gross:  928, net:  -396, roi: -30 },
  { owner: 'HOUTCHENS', teams:  96, bids: 4806, gross: 5078, net:   272, roi:   6 },
  { owner: 'LEONE',     teams: 123, bids: 5071, gross: 5211, net:   140, roi:   3 },
  { owner: 'RITER',     teams:  16, bids:  426, gross:  230, net:  -196, roi: -46 },
  { owner: 'RITSICK',   teams:  61, bids: 3056, gross: 3229, net:   173, roi:   6 },
  { owner: 'SIKMA',     teams:  26, bids:  931, gross: 1442, net:   511, roi:  55 },
  { owner: 'VARELA',    teams:  51, bids: 3133, gross: 2843, net:  -290, roi:  -9 },
  { owner: 'WALLACE',   teams:  57, bids: 4651, gross: 4140, net:  -511, roi: -11 },
].sort((a, b) => b.roi - a.roi)

// ── Year-by-year pots ─────────────────────────────────────────
const YEAR_POTS = [
  { year: 2016, pot: 2514 },
  { year: 2017, pot: 2435 },
  { year: 2018, pot: 2564 },
  { year: 2019, pot: 2486 },
  { year: 2021, pot: 2773 },
  { year: 2022, pot: 3835 },
  { year: 2023, pot: 3590 },
  { year: 2024, pot: 3899 },
  { year: 2025, pot: 4140 },
]

// ── Seed tab ──────────────────────────────────────────────────
function SeedTab() {
  const [sortBy, setSortBy] = useState('seed')

  const sorted = [...SEED_DATA].sort((a, b) => {
    if (sortBy === 'roi')  return b.roi  - a.roi
    if (sortBy === 'avg')  return b.avg  - a.avg
    return 0   // seed = natural order
  })

  return (
    <>
      {/* Sort controls */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
        {[['seed','Order'],['roi','ROI'],['avg','Avg bid']].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setSortBy(val)}
            style={{
              padding: '5px 12px', borderRadius: 20,
              border: `1.5px solid ${sortBy === val ? 'var(--accent)' : 'var(--border)'}`,
              background: sortBy === val ? 'rgba(245,166,35,.12)' : 'transparent',
              color: sortBy === val ? 'var(--accent)' : 'var(--text2)',
              fontFamily: 'var(--font-mono)', fontSize: 12,
              letterSpacing: '.06em', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {lbl}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>10-year avg</div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', padding: '6px 16px', gap: 8 }}>
        <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Seed</div>
        <div style={{ width: 52, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'right' }}>Avg bid</div>
        <div style={{ width: 52, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'right' }}>2025</div>
        <div style={{ width: 52, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: 'right' }}>ROI</div>
      </div>

      {sorted.map(s => (
        <div key={s.seed} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid rgba(42,47,61,.45)', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{s.note}</div>
          </div>
          <div style={{ width: 52, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text2)', textAlign: 'right' }}>
            ${s.avg}
          </div>
          <div style={{ width: 52, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text3)', textAlign: 'right' }}>
            ${s.lastYear}
          </div>
          <div style={{
            width: 52, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, textAlign: 'right',
            color: s.roi > 5 ? 'var(--green)' : s.roi < -10 ? 'var(--red)' : 'var(--text2)',
          }}>
            {s.roi > 0 ? '+' : ''}{s.roi}%
          </div>
        </div>
      ))}
      <div style={{ height: 16 }} />
    </>
  )
}

// ── Owner tab ─────────────────────────────────────────────────
function OwnerTab() {
  const [sortBy, setSortBy] = useState('roi')

  const sorted = [...OWNER_HISTORY].sort((a, b) => {
    if (sortBy === 'net')   return b.net   - a.net
    if (sortBy === 'bids')  return b.bids  - a.bids
    if (sortBy === 'teams') return b.teams - a.teams
    return b.roi - a.roi
  })

  // Totals row
  const totals = OWNER_HISTORY.reduce((acc, o) => ({
    teams: acc.teams + o.teams,
    bids:  acc.bids  + o.bids,
    gross: acc.gross + o.gross,
    net:   acc.net   + o.net,
  }), { teams: 0, bids: 0, gross: 0, net: 0 })

  return (
    <>
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
        {[['roi','ROI'],['net','Net $'],['bids','Total bid'],['teams','Teams']].map(([val,lbl]) => (
          <button
            key={val}
            onClick={() => setSortBy(val)}
            style={{
              padding: '5px 10px', borderRadius: 20,
              border: `1.5px solid ${sortBy === val ? 'var(--accent)' : 'var(--border)'}`,
              background: sortBy === val ? 'rgba(245,166,35,.12)' : 'transparent',
              color: sortBy === val ? 'var(--accent)' : 'var(--text2)',
              fontFamily: 'var(--font-mono)', fontSize: 12,
              letterSpacing: '.06em', cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* 10-year pot summary */}
      <div style={{ margin: '10px 16px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
          10-year totals (2016–2025, no 2020)
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {[
            { val: `$${(totals.bids/1000).toFixed(1)}k`,  lbl: 'Total wagered' },
            { val: `$${(totals.gross/1000).toFixed(1)}k`, lbl: 'Total paid out' },
            { val: YEAR_POTS.length + ' yrs',             lbl: 'Seasons played' },
            { val: `$${Math.round(totals.bids/YEAR_POTS.length).toLocaleString()}`, lbl: 'Avg pot' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none', padding: '0 4px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--accent)' }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pot by year mini chart */}
      <div style={{ margin: '0 16px 10px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', padding: '12px 14px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>
          Pot size by year
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
          {YEAR_POTS.map(y => {
            const pct = (y.pot / 4140) * 100
            return (
              <div key={y.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: 'var(--accent)', borderRadius: '2px 2px 0 0', opacity: .7 + (pct / 500), height: `${pct}%` }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>{String(y.year).slice(2)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Owner rows */}
      {sorted.map((o, i) => (
        <div key={o.owner} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(42,47,61,.45)', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: i < 3 ? 'var(--accent)' : 'var(--text3)', width: 16, flexShrink: 0 }}>
            {i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, letterSpacing: '.03em' }} className={`owner-${o.owner}`}>
              {o.owner}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
              {o.teams} teams · ${o.bids.toLocaleString()} wagered
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: o.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {o.net >= 0 ? '+' : '−'}${Math.abs(o.net).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, marginTop: 2, color: o.roi >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {o.roi >= 0 ? '+' : ''}{o.roi}% ROI
            </div>
          </div>
        </div>
      ))}
      <div style={{ height: 16 }} />
    </>
  )
}

// ── This Year tab ─────────────────────────────────────────────
function ThisYearTab({ items, teams, standings, pot }) {
  if (standings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <div className="empty-text">Stats will populate as bids are entered and games are played</div>
      </div>
    )
  }

  // Auction stats
  const soldItems  = items.filter(i => i.bid_amount)
  const avgBid     = soldItems.length ? Math.round(pot / soldItems.length) : 0
  const highBid    = soldItems.reduce((best, i) => i.bid_amount > (best?.bid_amount || 0) ? i : best, null)
  const lowBid     = soldItems.filter(i => !items.find(j => j.id === i.id)?.is_block)
                       .reduce((low, i) => i.bid_amount < (low?.bid_amount || 9999) ? i : low, null)

  // Team stats
  const eliminatedTeams = teams.filter(t => t.eliminated)
  const biggestLoser    = [...eliminatedTeams].sort((a,b) => b.loss_margin - a.loss_margin)[0]
  const mostWins        = [...teams].sort((a,b) => b.wins - a.wins)[0]

  // Owner who owns the most teams
  const mostTeams = [...standings].sort((a,b) => b.items.length - a.items.length)[0]
  const mostSpent = [...standings].sort((a,b) => b.totalBid - a.totalBid)[0]

  const StatCard = ({ label, value, sub, color }) => (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: color || 'var(--text)', letterSpacing: '.02em', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
    </div>
  )

  return (
    <>
      <div className="sec-head"><span>Auction</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px 8px' }}>
        <StatCard label="Total pot"   value={`$${pot.toLocaleString()}`}         sub={`${soldItems.length} of ${items.length} sold`} color="var(--accent)" />
        <StatCard label="Average bid" value={`$${avgBid}`}                        sub="per team" />
        <StatCard label="Highest bid" value={highBid ? `$${highBid.bid_amount}` : '—'} sub={highBid?.display_name} color="var(--accent)" />
        <StatCard label="Lowest bid"  value={lowBid  ? `$${lowBid.bid_amount}`  : '—'} sub={lowBid?.display_name} />
        <StatCard label="Most teams"  value={mostTeams?.owner || '—'}             sub={`${mostTeams?.items.length || 0} teams`} />
        <StatCard label="Most spent"  value={mostSpent?.owner || '—'}             sub={`$${(mostSpent?.totalBid || 0).toLocaleString()}`} />
      </div>

      <div className="sec-head"><span>Tournament</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px 8px' }}>
        <StatCard label="Most wins"    value={mostWins ? `${mostWins.wins}W` : '—'}           sub={mostWins?.name} color="var(--green)" />
        <StatCard label="Biggest loss" value={biggestLoser ? `−${biggestLoser.loss_margin}` : '—'} sub={biggestLoser?.name} color="var(--red)" />
        <StatCard label="Still alive"  value={teams.filter(t => !t.eliminated).length}         sub="teams remaining" color="var(--green)" />
        <StatCard label="Eliminated"   value={eliminatedTeams.length}                           sub="teams out" />
      </div>

      {/* Per-owner this year */}
      <div className="sec-head"><span>This year by owner</span></div>
      {[...standings].sort((a,b) => b.net - a.net).map((s, i) => (
        <div key={s.owner} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: '1px solid rgba(42,47,61,.45)', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', width: 16, flexShrink: 0 }}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, letterSpacing: '.03em', color: 'var(--text)' }}>{s.owner}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
              {s.items.length} teams · ${s.totalBid.toLocaleString()} bid · {s.alive} alive
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: s.gross > 0 ? 'var(--accent)' : 'var(--text3)' }}>
              ${s.gross.toLocaleString()} gross
            </div>
            <div style={{ fontSize: 12, marginTop: 2, color: s.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {s.net >= 0 ? '+' : '−'}${Math.abs(s.net).toLocaleString()} net
            </div>
          </div>
        </div>
      ))}
      <div style={{ height: 16 }} />
    </>
  )
}

// ── Stats shell ───────────────────────────────────────────────
export default function Stats({ items, teams, standings, pot }) {
  const [tab, setTab] = useState('thisyear')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="app-header">
        <h1>STATS</h1>
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${tab === 'thisyear' ? 'active' : ''}`} onClick={() => setTab('thisyear')}>2026</button>
        <button className={`tab-btn ${tab === 'owners'   ? 'active' : ''}`} onClick={() => setTab('owners')}>By Owner</button>
        <button className={`tab-btn ${tab === 'seeds'    ? 'active' : ''}`} onClick={() => setTab('seeds')}>By Seed</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'thisyear' && <ThisYearTab items={items} teams={teams} standings={standings} pot={pot} />}
        {tab === 'owners'   && <OwnerTab />}
        {tab === 'seeds'    && <SeedTab />}
      </div>
    </div>
  )
}
