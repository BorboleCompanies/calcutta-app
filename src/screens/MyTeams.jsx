import { useState, useEffect } from 'react'

const OWNERS = ['ARNEY','BEARS','HOSLEY','HOUTCHENS','LEONE','RITER','RITSICK','SIKMA','VARELA','WALLACE']
const ROUNDS = ['R64','R32','S16','E8','F4','CHM']

function RoundDots({ wins, eliminated }) {
  return (
    <div style={{ gap: 3, paddingLeft: 46, paddingTop: 6, paddingBottom: 10, display: 'flex' }}>
      {ROUNDS.map((r, i) => {
        let cls = 'rdot'
        if (i < wins) cls += ' win'
        else if (i === wins && eliminated) cls += ' loss'
        else if (i === wins && !eliminated) cls += ' live'
        return <div key={r} className={cls} title={r} />
      })}
    </div>
  )
}

export default function MyTeams({ items, teams, standings, selectedOwner, setSelectedOwner }) {
  const defaultOwner = selectedOwner || standings[0]?.owner || OWNERS[0]
  const [selected, setSelected] = useState(defaultOwner)

  // Sync when navigated here from Leaderboard
  useEffect(() => {
    if (selectedOwner) {
      setSelected(selectedOwner)
      setSelectedOwner(null)   // clear so future tab taps don't re-override
    }
  }, [selectedOwner, setSelectedOwner])

  const standing   = standings.find(s => s.owner === selected)
  const ownerTeams = standing?.teams || []
  const ownerItems = standing?.items || []
  const totalBid   = standing?.totalBid || 0

  const alive = ownerTeams.filter(t => !t.eliminated)
  const out   = ownerTeams.filter(t =>  t.eliminated)

  const activeOwners = [...new Set(items.filter(i => i.owner).map(i => i.owner))].sort()
  const pillOwners   = activeOwners.length > 0 ? activeOwners : OWNERS

  return (
    <>
      <div className="app-header">
        <div className="eyebrow">Owner view</div>
        <h1>MY TEAMS</h1>
      </div>

      {/* Owner picker — improved contrast */}
      <div className="filter-row">
        {pillOwners.map(o => (
          <button
            key={o}
            className={`fpill ${selected === o ? 'owner-active' : ''}`}
            style={selected === o
              ? { color: '#000' }
              : { color: 'var(--text2)', borderColor: 'var(--bg4)', background: 'var(--bg3)' }
            }
            onClick={() => setSelected(o)}
          >
            {o}
          </button>
        ))}
      </div>

      {/* Summary strip */}
      <div className="stats-strip">
        <div className="stat-item">
          <div className="stat-val">{ownerItems.length}</div>
          <div className="stat-lbl">Teams</div>
        </div>
        <div className="stat-item">
          <div className="stat-val">{alive.length}</div>
          <div className="stat-lbl">Alive</div>
        </div>
        <div className="stat-item">
          <div className="stat-val">${totalBid.toLocaleString()}</div>
          <div className="stat-lbl">Bid</div>
        </div>
        <div className="stat-item">
          <div className="stat-val" style={{ color: standing ? (standing.net >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--accent)' }}>
            {standing ? `${standing.net >= 0 ? '+' : '−'}$${Math.abs(standing.net)}` : '—'}
          </div>
          <div className="stat-lbl">Net</div>
        </div>
      </div>

      {ownerTeams.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏀</div>
          <div className="empty-text">{selected} hasn't won any bids yet</div>
        </div>
      )}

      {alive.length > 0 && (
        <div className="sec-head"><span>Still alive ({alive.length})</span></div>
      )}
      {alive.map(team => <TeamCard key={team.id} team={team} items={items} />)}

      {out.length > 0 && (
        <div className="sec-head"><span>Eliminated ({out.length})</span></div>
      )}
      {out.map(team => <TeamCard key={team.id} team={team} items={items} dimmed />)}

      <div style={{ height: 16 }} />
    </>
  )
}

function TeamCard({ team, items, dimmed = false }) {
  const item   = items.find(i => i.id === team.auction_item_id)
  const bidAmt = item?.bid_amount ?? 0
  const sc     = team.seed <= 11 ? `seed-badge seed-${team.seed}` : 'seed-badge seed-16'

  return (
    <div style={{ margin: '6px 16px', borderRadius: 12, background: 'var(--bg2)', border: '1px solid var(--border)', overflow: 'hidden', opacity: dimmed ? .5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', gap: 10 }}>
        <div className={sc}>{team.seed}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
            {team.region} · {team.wins} win{team.wins !== 1 ? 's' : ''} · {team.eliminated ? 'Out' : 'Active'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text2)' }}>${bidAmt}</div>
          {team.eliminated && team.loss_margin > 0 && (
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>lost by {team.loss_margin}</div>
          )}
        </div>
      </div>
      <RoundDots wins={team.wins} eliminated={team.eliminated} />
    </div>
  )
}
