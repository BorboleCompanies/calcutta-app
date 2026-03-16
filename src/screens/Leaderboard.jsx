import { potTotal } from '../App'

export default function Leaderboard({ items, standings, pot }) {
  const soldCount  = items.filter(i => i.bid_amount).length
  const aliveCount = standings.reduce((s, o) => s + o.alive, 0)

  return (
    <>
      <div className="app-header">
        <div className="eyebrow">FLOG Calcutta 2026</div>
        <h1>LEADERBOARD</h1>
        <div className="subtitle">{aliveCount} teams still alive · ${pot.toLocaleString()} pot</div>
      </div>

      {/* Pot strip */}
      <div className="stats-strip">
        <div className="stat-item"><div className="stat-val">${pot.toLocaleString()}</div><div className="stat-lbl">Pot</div></div>
        <div className="stat-item"><div className="stat-val">${Math.round(pot * .20).toLocaleString()}</div><div className="stat-lbl">Champ</div></div>
        <div className="stat-item"><div className="stat-val">${Math.round(pot * .12).toLocaleString()}</div><div className="stat-lbl">Runner-up</div></div>
        <div className="stat-item"><div className="stat-val">${Math.round(pot * .08).toLocaleString()}</div><div className="stat-lbl">Final 4</div></div>
      </div>

      {standings.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <div className="empty-text">Standings appear once bids are entered</div>
        </div>
      )}

      {standings.map((s, i) => {
        const isLeader = i === 0 && s.net >= 0
        return (
          <div
            key={s.owner}
            className="list-row"
            style={isLeader ? { background: 'linear-gradient(90deg,rgba(245,166,35,.07),transparent 60%)' } : {}}
          >
            {/* Rank */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: i < 3 ? 'var(--accent)' : 'var(--text3)', width: 20, textAlign: 'center', flexShrink: 0 }}>
              {i + 1}
            </div>

            {/* Owner info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em' }}>
                {s.owner}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                <span style={{ color: s.alive > 0 ? 'var(--green)' : 'var(--text3)' }}>
                  {s.alive} alive
                </span>
                {' · '}
                {s.teams.length - s.alive} out
                {' · '}
                ${s.totalBid.toLocaleString()} bid
              </div>
            </div>

            {/* Financials */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500 }} className={s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : 'muted'}>
                {s.net > 0 ? '+' : ''}{s.net < 0 ? '−' : ''}${Math.abs(s.net).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, marginTop: 2 }} className={s.roi > 0 ? 'pos' : s.roi < 0 ? 'neg' : 'muted'}>
                {s.roi > 0 ? '+' : ''}{s.roi}% ROI
              </div>
            </div>
          </div>
        )
      })}
      <div style={{ height: 16 }} />
    </>
  )
}
