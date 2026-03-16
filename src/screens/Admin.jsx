import { useState, useRef } from 'react'
import { supabase } from '../supabase'

const OWNERS = ['ARNEY','BEARS','HOSLEY','HOUTCHENS','LEONE','RITER','RITSICK','SIKMA','VARELA','WALLACE']
const SEED_AVG  = { 1:197, 2:118, 3:80, 4:62, 5:53, 6:41, 7:35, 8:35, 9:29, 10:27, 11:31, 12:150, 13:150, 14:150, 15:18, 16:21 }
const SEED_ROI  = { 1:21, 2:-10, 3:-5, 4:21, 5:3, 6:-31, 7:-19, 8:-24, 9:4, 10:-22, 11:33, 12:-37, 13:-37, 14:-37, 15:-30, 16:12 }
const SEED_LAST = { 1:256, 2:144, 3:89, 4:83, 5:70, 6:58, 7:60, 8:60, 9:41, 10:41, 11:54, 12:155, 13:155, 14:155, 15:20, 16:21 }

// ── Password gate ─────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [pw, setPw]     = useState('')
  const [err, setErr]   = useState(false)
  const submit = () => {
    if (pw === import.meta.env.VITE_ADMIN_PASSWORD) {
      onAuth(true)
    } else {
      setErr(true)
      setTimeout(() => setErr(false), 1500)
    }
  }
  return (
    <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '.04em' }}>
        ADMIN ACCESS
      </div>
      <div style={{ fontSize: 15, color: 'var(--text3)', textAlign: 'center' }}>
        Enter the commissioner password to manage bids and results.
      </div>
      <input
        className="text-input"
        type="password"
        placeholder="Password"
        value={pw}
        onChange={e => setPw(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        style={{ borderColor: err ? 'var(--red)' : undefined, textAlign: 'center', fontSize: 18 }}
        autoFocus
      />
      {err && <div style={{ fontSize: 14, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>Wrong password</div>}
      <button className="btn-primary" onClick={submit} style={{ maxWidth: 240 }}>
        ENTER
      </button>
    </div>
  )
}

// ── Enter Bids tab ────────────────────────────────────────────
function BidsTab({ items, teams, toast }) {
  const [owner, setOwner]   = useState(null)
  const [amount, setAmount] = useState(100)
  const [saving, setSaving] = useState(false)

  // Next unsold item
  const nextItem = items.find(i => !i.owner)
  const soldItems = items.filter(i => i.owner && i.bid_amount)

  // Get seed for current item
  const seedForItem = (item) => {
    if (!item) return null
    if (item.is_block) return null
    return teams.find(t => t.auction_item_id === item.id)?.seed ?? null
  }

  const curSeed = nextItem ? seedForItem(nextItem) : null
  const avg  = curSeed ? (SEED_AVG[curSeed]  ?? 30)  : 150
  const roi  = curSeed ? (SEED_ROI[curSeed]  ?? -20) : -37
  const last = curSeed ? (SEED_LAST[curSeed] ?? 30)  : 155

  // Keep amount near historic avg when team changes
  const prevItemId = useRef(null)
  if (nextItem && nextItem.id !== prevItemId.current) {
    prevItemId.current = nextItem.id
    // Don't reset mid-edit, only on mount or new team
  }

  const adjustBid = (delta) => setAmount(v => Math.max(10, v + delta))
  const setBid    = (v)     => setAmount(v)

  const canSubmit = owner && amount >= 10 && nextItem && !saving

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    const { error } = await supabase
      .from('auction_items')
      .update({ owner, bid_amount: amount })
      .eq('id', nextItem.id)
    setSaving(false)
    if (error) {
      toast('Error saving bid')
      console.error(error)
    } else {
      toast(`${nextItem.display_name} → ${owner} $${amount}`)
      setOwner(null)
      setAmount(avg || 100)
    }
  }

  if (!nextItem) {
    return (
      <div className="empty-state">
        <div className="empty-icon">✅</div>
        <div className="empty-text">All {items.length} items have been sold!<br />Total pot: ${items.reduce((s,i) => s+(i.bid_amount||0),0).toLocaleString()}</div>
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {/* Pot strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>Running pot</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, color: 'var(--accent)' }}>
          ${soldItems.reduce((s,i) => s+i.bid_amount,0).toLocaleString()}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{soldItems.length} of {items.length} sold</span>
      </div>

      {/* Current team card */}
      <div style={{ margin: '12px 16px 6px', borderRadius: 14, background: 'linear-gradient(135deg,rgba(245,166,35,.12),rgba(232,84,26,.06))', border: '1px solid rgba(245,166,35,.28)', padding: '16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>
          Up for auction
        </div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '.02em', lineHeight: 1.1 }}>
          {nextItem.display_name}
          {curSeed && <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text2)', marginLeft: 8 }}>Seed {curSeed}</span>}
        </div>
        {curSeed && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[
              { val: `$${avg}`,  lbl: '10yr avg' },
              { val: `${roi >= 0 ? '+' : ''}${roi}%`, lbl: '10yr ROI', color: roi >= 0 ? 'var(--green)' : 'var(--red)' },
              { val: `$${last}`, lbl: '2025 avg' },
            ].map(s => (
              <div key={s.lbl} style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: s.color || 'var(--accent)' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bid form */}
      <div className="card">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
          Auction winner
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
          {OWNERS.map(o => (
            <button
              key={o}
              onClick={() => setOwner(o === owner ? null : o)}
              style={{
                padding: '8px 6px',
                borderRadius: 8,
                border: `1.5px solid ${owner === o ? 'var(--blue)' : 'var(--border)'}`,
                background: owner === o ? 'var(--blue)' : 'transparent',
                color: owner === o ? '#fff' : 'var(--text2)',
                fontFamily: 'var(--font-head)',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '.03em',
              }}
            >
              {o}
            </button>
          ))}
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
          Winning bid
        </div>

        {/* Amount controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button
            onClick={() => adjustBid(amount > 100 ? -10 : -5)}
            style={{ width: 40, height: 40, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', flexShrink: 0 }}
          >−</button>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--text2)' }}>$</span>
            <input
              type="number"
              className="text-input"
              value={amount}
              min={10}
              onChange={e => setBid(Math.max(10, parseInt(e.target.value) || 10))}
              style={{ paddingLeft: 28, fontSize: 22, textAlign: 'center' }}
            />
          </div>
          <button
            onClick={() => adjustBid(amount >= 100 ? 10 : 5)}
            style={{ width: 40, height: 40, borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', flexShrink: 0 }}
          >+</button>
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[50,75,100,150,200,250].map(v => (
            <button
              key={v}
              onClick={() => setBid(v)}
              style={{ flex: 1, padding: '6px 2px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer' }}
            >
              ${v}
            </button>
          ))}
        </div>

        <button
          className="btn-primary"
          disabled={!canSubmit}
          onClick={submit}
        >
          {saving ? 'SAVING...' : owner ? `CONFIRM — ${owner} · $${amount}` : 'SELECT OWNER TO CONFIRM'}
        </button>
      </div>
      <div style={{ height: 16 }} />
    </div>
  )
}

// ── Update Results tab ────────────────────────────────────────
function ResultsTab({ teams, items, toast }) {
  const [expanded, setExpanded]     = useState(null)
  const [lossMargin, setLossMargin] = useState('')
  const [saving, setSaving]         = useState(false)

  const alive = teams.filter(t => !t.eliminated).sort((a,b) => a.seed - b.seed || a.name.localeCompare(b.name))
  const out   = teams.filter(t =>  t.eliminated).sort((a,b) => b.wins - a.wins || a.name.localeCompare(b.name))

  // Get owner for a team
  const ownerOf = (team) => items.find(i => i.id === team.auction_item_id)?.owner ?? '—'

  const recordWin = async (team) => {
    setSaving(true)
    const { error } = await supabase
      .from('tournament_teams')
      .update({ wins: team.wins + 1 })
      .eq('id', team.id)
    setSaving(false)
    if (error) toast('Error saving')
    else { toast(`${team.name} +1 win`); setExpanded(null) }
  }

  const recordLoss = async (team) => {
    const margin = parseInt(lossMargin) || 0
    setSaving(true)
    const { error } = await supabase
      .from('tournament_teams')
      .update({ eliminated: true, loss_margin: margin })
      .eq('id', team.id)
    setSaving(false)
    if (error) toast('Error saving')
    else { toast(`${team.name} eliminated`); setExpanded(null); setLossMargin('') }
  }

  const undoElim = async (team) => {
    setSaving(true)
    const { error } = await supabase
      .from('tournament_teams')
      .update({ eliminated: false, wins: Math.max(0, team.wins - 0), loss_margin: 0 })
      .eq('id', team.id)
    setSaving(false)
    if (error) toast('Error')
    else toast(`${team.name} restored`)
  }

  const TeamRow = ({ team, isOut }) => {
    const isOpen = expanded === team.id
    const owner  = ownerOf(team)
    const sc     = team.seed <= 11 ? `seed-badge seed-${team.seed}` : 'seed-badge seed-16'

    return (
      <div style={{ margin: '4px 16px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--border)', overflow: 'hidden', opacity: isOut ? .55 : 1 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10, cursor: 'pointer' }}
          onClick={() => setExpanded(isOpen ? null : team.id)}
        >
          <div className={sc}>{team.seed}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em' }}>
              {team.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 1 }}>
              <span className={`owner-${owner}`}>{owner}</span>
              {' · '}
              {team.wins} win{team.wins !== 1 ? 's' : ''}
              {isOut && team.loss_margin > 0 && ` · lost by ${team.loss_margin}`}
            </div>
          </div>
          <div style={{ color: 'var(--text3)', fontSize: 14 }}>{isOpen ? '▲' : '▼'}</div>
        </div>

        {/* Expanded controls */}
        {isOpen && !isOut && (
          <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button
                className="btn-outline"
                style={{ flex: 1, background: 'transparent', borderColor: 'var(--green)', color: 'var(--green)', padding: '10px', borderRadius: 8, fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em' }}
                onClick={() => recordWin(team)}
                disabled={saving}
              >
                + WIN
              </button>
              <button
                className="btn-outline"
                style={{ flex: 1, background: 'transparent', borderColor: 'var(--red)', color: 'var(--red)', padding: '10px', borderRadius: 8, fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em' }}
                onClick={() => recordLoss(team)}
                disabled={saving}
              >
                ELIMINATED
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="text-input"
                type="number"
                placeholder="Loss margin (optional)"
                value={lossMargin}
                onChange={e => setLossMargin(e.target.value)}
                style={{ flex: 1, fontSize: 14 }}
                min={1}
              />
              <div style={{ fontSize: 13, color: 'var(--text3)', flexShrink: 0 }}>for loss prize</div>
            </div>
          </div>
        )}

        {/* Undo for eliminated */}
        {isOpen && isOut && (
          <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <button
              style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em' }}
              onClick={() => undoElim(team)}
              disabled={saving}
            >
              UNDO ELIMINATION
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <div className="sec-head"><span>Alive ({alive.length})</span><span style={{ color: 'var(--text3)', fontSize: 10 }}>Tap to update</span></div>
      {alive.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏀</div>
          <div className="empty-text">Tournament hasn't started yet, or all teams are eliminated</div>
        </div>
      )}
      {alive.map(t => <TeamRow key={t.id} team={t} isOut={false} />)}

      {out.length > 0 && (
        <>
          <div className="sec-head"><span>Eliminated ({out.length})</span></div>
          {out.map(t => <TeamRow key={t.id} team={t} isOut={true} />)}
        </>
      )}
      <div style={{ height: 16 }} />
    </div>
  )
}

// ── Bid Log tab ───────────────────────────────────────────────
function BidLogTab({ items, teams, toast }) {
  const [saving, setSaving] = useState(null)

  const soldItems = [...items]
    .filter(i => i.owner && i.bid_amount)
    .sort((a, b) => b.auction_order - a.auction_order) // most recent first

  const seedOf = (item) => item.is_block ? 'BLK'
    : (teams.find(t => t.auction_item_id === item.id)?.seed ?? '?')

  const deleteBid = async (item) => {
    if (!confirm(`Remove bid for ${item.display_name}?`)) return
    setSaving(item.id)
    const { error } = await supabase
      .from('auction_items')
      .update({ owner: null, bid_amount: null })
      .eq('id', item.id)
    setSaving(null)
    if (error) toast('Error removing bid')
    else toast(`${item.display_name} bid removed`)
  }

  const pot = items.reduce((s, i) => s + (i.bid_amount || 0), 0)

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>Total entered</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 17, color: 'var(--accent)' }}>${pot.toLocaleString()}</span>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{soldItems.length} teams</span>
      </div>

      {soldItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">No bids entered yet</div>
        </div>
      )}

      {soldItems.map(item => {
        const seed = seedOf(item)
        const sc   = item.is_block ? 'seed-badge seed-block'
          : `seed-badge seed-${seed}`
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(42,47,61,.45)', gap: 10 }}>
            <div className={sc}>{seed}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.display_name}
              </div>
              <div style={{ fontSize: 13, marginTop: 1 }}>
                <span className={`owner-${item.owner}`}>{item.owner}</span>
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: 'var(--accent)', flexShrink: 0 }}>
              ${item.bid_amount}
            </div>
            <button
              onClick={() => deleteBid(item)}
              disabled={saving === item.id}
              style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        )
      })}
      <div style={{ height: 16 }} />
    </div>
  )
}

// ── Admin shell ───────────────────────────────────────────────
export default function Admin({ items, teams, adminAuthed, setAdminAuthed, toast }) {
  const [tab, setTab] = useState('bids')

  if (!adminAuthed) {
    return (
      <>
        <div className="app-header">
          <h1>ADMIN</h1>
        </div>
        <PasswordGate onAuth={setAdminAuthed} />
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="app-header">
        <h1>ADMIN</h1>
        <div className="subtitle">
          <span style={{ color: 'var(--green)', marginRight: 8 }}>● Logged in</span>
          <button onClick={() => setAdminAuthed(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
            log out
          </button>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab-btn ${tab === 'bids'    ? 'active' : ''}`} onClick={() => setTab('bids')}>Enter Bids</button>
        <button className={`tab-btn ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')}>Results</button>
        <button className={`tab-btn ${tab === 'log'     ? 'active' : ''}`} onClick={() => setTab('log')}>Bid Log</button>
      </div>

      {tab === 'bids'    && <BidsTab    items={items} teams={teams} toast={toast} />}
      {tab === 'results' && <ResultsTab items={items} teams={teams} toast={toast} />}
      {tab === 'log'     && <BidLogTab  items={items} teams={teams} toast={toast} />}
    </div>
  )
}
