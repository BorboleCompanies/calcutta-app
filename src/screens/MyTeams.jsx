import { useState, useEffect } from 'react'
import AppHeader from '../components/AppHeader'

const OWNERS = ['ARNEY','BEARS','HOSLEY','HOUTCHENS','LEONE','RITER','RITSICK','SIKMA','VARELA','WALLACE']
const ROUNDS  = ['R64','R32','S16','E8','F4','CHM']
const ROUND_NAMES = ['Round of 64','Round of 32','Sweet 16','Elite 8','Final Four','Championship']

// ── Bracket structure ─────────────────────────────────────────
// Pod A:  1 vs 16  →  winner vs winner of  8 vs 9
// Pod B:  5 vs 12  →  winner vs winner of  4 vs 13
// Pod C:  6 vs 11  →  winner vs winner of  3 vs 14
// Pod D:  7 vs 10  →  winner vs winner of  2 vs 15
// Sweet 16: Pod A winner vs Pod B winner (top half)
//           Pod C winner vs Pod D winner (bottom half)
// Elite 8:  top-half winner vs bottom-half winner
// Final Four: cross-region (South/Midwest vs East/West by convention)

const R64_OPP = {
  1:16, 16:1, 8:9, 9:8,
  5:12, 12:5, 4:13, 13:4,
  6:11, 11:6, 3:14, 14:3,
  7:10, 10:7, 2:15, 15:2,
}

const R32_OPP_SEEDS = {
  1:[8,9],   16:[8,9],   8:[1,16],  9:[1,16],
  5:[4,13],  12:[4,13],  4:[5,12],  13:[5,12],
  6:[3,14],  11:[3,14],  3:[6,11],  14:[6,11],
  7:[2,15],  10:[2,15],  2:[7,10],  15:[7,10],
}

const S16_OPP_SEEDS = {
  1:[5,12,4,13], 16:[5,12,4,13], 8:[5,12,4,13],  9:[5,12,4,13],
  5:[1,16,8,9],  12:[1,16,8,9],  4:[1,16,8,9],   13:[1,16,8,9],
  6:[7,10,2,15], 11:[7,10,2,15], 3:[7,10,2,15],  14:[7,10,2,15],
  7:[6,11,3,14], 10:[6,11,3,14], 2:[6,11,3,14],  15:[6,11,3,14],
}

const E8_OPP_SEEDS = {
  1:[6,11,3,14,7,10,2,15],  16:[6,11,3,14,7,10,2,15],
  8:[6,11,3,14,7,10,2,15],   9:[6,11,3,14,7,10,2,15],
  5:[6,11,3,14,7,10,2,15],  12:[6,11,3,14,7,10,2,15],
  4:[6,11,3,14,7,10,2,15],  13:[6,11,3,14,7,10,2,15],
  6:[1,16,8,9,5,12,4,13],   11:[1,16,8,9,5,12,4,13],
  3:[1,16,8,9,5,12,4,13],   14:[1,16,8,9,5,12,4,13],
  7:[1,16,8,9,5,12,4,13],   10:[1,16,8,9,5,12,4,13],
  2:[1,16,8,9,5,12,4,13],   15:[1,16,8,9,5,12,4,13],
}

// Adjust these pairings if the bracket changes year to year
const FF_REGION_OPP = {
  South: 'Midwest', Midwest: 'South',
  East:  'West',    West:    'East',
}

function getNextOpponents(team, allTeams) {
  if (team.eliminated || !allTeams) return []
  const { seed, region, wins } = team
  const regionTeams = allTeams.filter(t => t.region === region && t.id !== team.id)

  if (wins === 0) {
    const oppSeed = R64_OPP[seed]
    if (!oppSeed) return []
    const opp = regionTeams.find(t => t.seed === oppSeed && !t.eliminated)
    return opp ? [opp] : []
  }

  if (wins === 1) {
    const seeds = R32_OPP_SEEDS[seed]
    if (!seeds) return []
    const pool = regionTeams.filter(t => seeds.includes(t.seed))
    const confirmed = pool.find(t => t.wins === 1 && !t.eliminated)
    if (confirmed) return [confirmed]
    return pool.filter(t => !t.eliminated)
  }

  if (wins === 2) {
    const seeds = S16_OPP_SEEDS[seed]
    if (!seeds) return []
    const pool = regionTeams.filter(t => seeds.includes(t.seed))
    const confirmed = pool.find(t => t.wins === 2 && !t.eliminated)
    if (confirmed) return [confirmed]
    return pool.filter(t => !t.eliminated && t.wins >= 1)
  }

  if (wins === 3) {
    const seeds = E8_OPP_SEEDS[seed]
    if (!seeds) return []
    const pool = regionTeams.filter(t => seeds.includes(t.seed))
    const confirmed = pool.find(t => t.wins === 3 && !t.eliminated)
    if (confirmed) return [confirmed]
    return pool.filter(t => !t.eliminated && t.wins >= 2)
  }

  if (wins === 4) {
    const oppRegion = FF_REGION_OPP[region]
    if (!oppRegion) return []
    const pool = allTeams.filter(t => t.region === oppRegion && !t.eliminated)
    const confirmed = pool.find(t => t.wins === 4)
    if (confirmed) return [confirmed]
    return pool.filter(t => t.wins >= 3).slice(0, 2)
  }

  return []
}

function RoundDots({ wins, eliminated }) {
  return (
    <div style={{ gap: 3, paddingLeft: 46, paddingTop: 6, paddingBottom: 6, display: 'flex' }}>
      {ROUNDS.map((r, i) => {
        let cls = 'rdot'
        if (i < wins)                       cls += ' win'
        else if (i === wins && eliminated)  cls += ' loss'
        else if (i === wins && !eliminated) cls += ' live'
        return <div key={r} className={cls} title={r} />
      })}
    </div>
  )
}

function MatchupStrip({ team, items, allTeams }) {
  const thisItem  = items.find(i => i.id === team.auction_item_id)
  const myOwner   = thisItem?.owner
  const opponents = getNextOpponents(team, allTeams)

  if (team.eliminated || team.wins >= 6) return null

  const roundLabel = ROUND_NAMES[team.wins] ?? 'Next game'

  if (opponents.length === 0) {
    return (
      <div style={{ borderTop: '1px solid var(--border)', padding: '9px 14px' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          {roundLabel} · opponent TBD
        </span>
      </div>
    )
  }

  const ownedByMe = opponents.some(o => {
    const oi = items.find(i => i.id === o.auction_item_id)
    return oi?.owner === myOwner
  })

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: '9px 14px',
      background: ownedByMe ? 'rgba(231,76,60,.07)' : 'rgba(255,255,255,.02)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>
        {roundLabel}
      </div>

      {opponents.slice(0, 2).map((opp, idx) => {
        const oi     = items.find(i => i.id === opp.auction_item_id)
        const oOwner = oi?.owner
        const clash  = oOwner === myOwner
        return (
          <div key={opp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: idx === 0 ? 0 : 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text3)', flexShrink: 0, width: 18, fontFamily: 'var(--font-mono)' }}>
              {idx === 0 ? 'vs' : 'or'}
            </span>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              ({opp.seed}) {opp.name}
            </span>
            {oOwner
              ? <span className={`owner-${oOwner}`} style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, letterSpacing: '.04em', flexShrink: 0 }}>
                  {clash ? '⚠ ' : ''}{oOwner}
                </span>
              : <span style={{ fontSize: 13, color: 'var(--text3)', flexShrink: 0 }}>Unowned</span>
            }
          </div>
        )
      })}
    </div>
  )
}

function TeamCard({ team, items, allTeams, dimmed = false }) {
  const item   = items.find(i => i.id === team.auction_item_id)
  const bidAmt = item?.bid_amount ?? 0
  const sc     = team.seed <= 11 ? `seed-badge seed-${team.seed}` : 'seed-badge seed-16'

  return (
    <div style={{ margin: '6px 16px', borderRadius: 12, background: 'var(--bg2)', border: '1px solid var(--border)', overflow: 'hidden', opacity: dimmed ? .5 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', gap: 10 }}>
        <div className={sc}>{team.seed}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team.name}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 1 }}>
            {team.region} · {team.wins} win{team.wins !== 1 ? 's' : ''} · {team.eliminated ? 'Out' : 'Active'}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text2)' }}>${bidAmt}</div>
          {team.eliminated && team.loss_margin > 0 && (
            <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 2 }}>lost by {team.loss_margin}</div>
          )}
        </div>
      </div>
      <RoundDots wins={team.wins} eliminated={team.eliminated} />
      <MatchupStrip team={team} items={items} allTeams={allTeams} />
    </div>
  )
}

export default function MyTeams({ items, teams, standings, selectedOwner, setSelectedOwner, goToAdmin, adminAuthed }) {
  const defaultOwner = selectedOwner || standings[0]?.owner || OWNERS[0]
  const [selected, setSelected] = useState(defaultOwner)

  useEffect(() => {
    if (selectedOwner) {
      setSelected(selectedOwner)
      setSelectedOwner(null)
    }
  }, [selectedOwner, setSelectedOwner])

  const standing   = standings.find(s => s.owner === selected)
  const ownerTeams = standing?.teams || []
  const ownerItems = standing?.items || []
  const totalBid   = standing?.totalBid || 0
  const alive      = ownerTeams.filter(t => !t.eliminated)
  const out        = ownerTeams.filter(t =>  t.eliminated)

  const activeOwners = [...new Set(items.filter(i => i.owner).map(i => i.owner))].sort()
  const pillOwners   = activeOwners.length > 0 ? activeOwners : OWNERS

  return (
    <>
      <AppHeader title="MY TEAMS" goToAdmin={goToAdmin} adminAuthed={adminAuthed} />

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

      <div className="stats-strip">
        <div className="stat-item"><div className="stat-val">{ownerItems.length}</div><div className="stat-lbl">Teams</div></div>
        <div className="stat-item"><div className="stat-val">{alive.length}</div><div className="stat-lbl">Alive</div></div>
        <div className="stat-item"><div className="stat-val">${totalBid.toLocaleString()}</div><div className="stat-lbl">Bid</div></div>
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

      {alive.length > 0 && <div className="sec-head"><span>Still alive ({alive.length})</span></div>}
      {alive.map(t => <TeamCard key={t.id} team={t} items={items} allTeams={teams} />)}

      {out.length > 0 && <div className="sec-head"><span>Eliminated ({out.length})</span></div>}
      {out.map(t => <TeamCard key={t.id} team={t} items={items} allTeams={teams} dimmed />)}

      <div style={{ height: 16 }} />
    </>
  )
}
