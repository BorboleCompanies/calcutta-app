import { payoutForWins } from '../App'

const PAYOUT_ROWS = [
  { label: 'National Champion', wins: 6, pct: '20%', note: '6 wins' },
  { label: 'Runner-Up',         wins: 5, pct: '12%', note: '5 wins' },
  { label: 'Final Four (×2)',   wins: 4, pct:  '8%', note: '4 wins' },
  { label: 'Elite Eight (×4)',  wins: 3, pct:  '4%', note: '3 wins' },
  { label: 'Sweet 16 (×8)',     wins: 2, pct:  '2%', note: '2 wins' },
  { label: 'Round of 32 (×16)', wins: 1, pct:  '1%', note: '1 win'  },
]

const SEED_HISTORY = [
  { label: '#1 seed',    avg: 197, roi:  21, note: 'Best value by $ spent' },
  { label: '#4 seed',    avg:  62, roi:  21, note: 'Tied for best ROI' },
  { label: '#9 seed',    avg:  29, roi:   4, note: 'Slight positive' },
  { label: '#16 seed',   avg:  21, roi:  12, note: 'UMBC effect' },
  { label: '#11 seed',   avg:  31, roi:  33, note: 'Historically underpriced' },
  { label: '#6 seed',    avg:  41, roi: -31, note: 'Most consistently overpriced' },
  { label: '#12-14 blk', avg: 150, roi: -37, note: 'Worst value in pool' },
  { label: '#15 seed',   avg:  18, roi: -30, note: 'Usually too expensive' },
]

export default function Payouts({ items, teams, standings, pot }) {
  // Find largest loss margin winner
  const biggestLoser = [...teams]
    .filter(t => t.loss_margin > 0)
    .sort((a, b) => b.loss_margin - a.loss_margin)[0]

  const lossOwnerStanding = biggestLoser
    ? standings.find(s => s.teams.some(t => t.id === biggestLoser.id))
    : null

  return (
    <>
      <div className="app-header">
        <div className="eyebrow">Prize breakdown</div>
        <h1>PAYOUTS</h1>
        <div className="subtitle">Based on ${pot.toLocaleString()} pot</div>
      </div>

      {/* Champion hero */}
      <div style={{
        margin: '14px 16px 6px',
        borderRadius: 14,
        background: 'linear-gradient(135deg,rgba(245,166,35,.13),rgba(232,84,26,.06))',
        border: '1px solid rgba(245,166,35,.28)',
        padding: '18px 20px',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.12em' }}>
          Champion payout
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 46, fontWeight: 800, color: 'var(--text)', lineHeight: 1, marginTop: 4 }}>
          ${Math.round(pot * .20).toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>
          20% of pot · Requires 6 wins · Winner TBD
        </div>
      </div>

      {/* Payout ladder */}
      <div className="sec-head"><span>Round payouts</span></div>

      {PAYOUT_ROWS.map(row => {
        const amount = payoutForWins(row.wins, pot)
        // Who has teams with this many wins?
        const winners = standings.filter(s => s.teams.some(t => t.wins === row.wins && t.eliminated))
        const confirmed = winners.length > 0
        return (
          <div key={row.wins} style={{ display: 'flex', alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid rgba(42,47,61,.45)', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{row.label}</div>
              <div style={{ fontSize: 11, color: confirmed ? 'var(--text2)' : 'var(--text3)', marginTop: 1 }}>
                {confirmed
                  ? winners.map(w => w.owner).join(', ')
                  : row.note + ' · TBD'}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', width: 32 }}>{row.pct}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: confirmed ? 'var(--green)' : 'var(--accent)', minWidth: 52, textAlign: 'right' }}>
              ${amount.toLocaleString()}{confirmed ? ' ✓' : ''}
            </div>
          </div>
        )
      })}

      {/* Largest loss margin */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 20px', borderBottom: '1px solid rgba(42,47,61,.45)', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Largest loss margin</div>
          <div style={{ fontSize: 11, color: lossOwnerStanding ? 'var(--text2)' : 'var(--text3)', marginTop: 1 }}>
            {biggestLoser
              ? `${lossOwnerStanding?.owner} · ${biggestLoser.name} −${biggestLoser.loss_margin}`
              : '4% bonus · TBD'}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', width: 32 }}>4%</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: lossOwnerStanding ? 'var(--green)' : 'var(--accent)', minWidth: 52, textAlign: 'right' }}>
          ${Math.round(pot * .04).toLocaleString()}{lossOwnerStanding ? ' ✓' : ''}
        </div>
      </div>

      {/* Historic seed ROI */}
      <div className="sec-head"><span>10-year seed ROI (use during auction)</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border)', margin: '0 16px 16px', borderRadius: 12, overflow: 'hidden' }}>
        {SEED_HISTORY.map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', padding: '10px 14px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>${s.avg} avg</div>
            <div style={{ fontSize: 11, marginTop: 1, color: s.roi >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {s.roi >= 0 ? '+' : ''}{s.roi}% ROI
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{s.note}</div>
          </div>
        ))}
      </div>
    </>
  )
}
