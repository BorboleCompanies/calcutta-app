import { useState, useRef, useCallback } from 'react'
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

// ── Order Tab ─────────────────────────────────────────────────
// Touch-friendly drag-and-drop reorder for the auction sequence.
// Only unsold items can be reordered. Sold items are locked.

function OrderTab({ items, toast }) {
  // Build local ordered list from items, sorted by auction_order
  const unsold = items.filter(i => !i.owner).sort((a, b) => a.auction_order - b.auction_order)
  const sold   = items.filter(i =>  i.owner).sort((a, b) => a.auction_order - b.auction_order)

  const [order,   setOrder]   = useState(() => unsold.map(i => ({ ...i })))
  const [dirty,   setDirty]   = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [dragIdx, setDragIdx] = useState(null)   // index being dragged
  const [overIdx, setOverIdx] = useState(null)   // index being hovered over

  // Pointer-based drag state
  const dragRef    = useRef(null)   // the element being dragged (clone)
  const startY     = useRef(0)
  const startIdx   = useRef(null)
  const listRef    = useRef(null)

  // ── Pointer drag handlers ──────────────────────────────────
  const onPointerDown = useCallback((e, idx) => {
    e.preventDefault()
    startIdx.current = idx
    startY.current   = e.clientY
    setDragIdx(idx)

    // Clone the row as a floating ghost
    const row    = e.currentTarget.closest('.order-row')
    const clone  = row.cloneNode(true)
    const rect   = row.getBoundingClientRect()
    clone.style.cssText = `
      position: fixed; z-index: 9999; pointer-events: none;
      width: ${rect.width}px; left: ${rect.left}px; top: ${rect.top}px;
      opacity: 0.92; border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
      background: var(--bg3); border: 1.5px solid var(--accent);
    `
    document.body.appendChild(clone)
    dragRef.current = clone

    const onMove = (ev) => {
      const y = ev.touches ? ev.touches[0].clientY : ev.clientY
      clone.style.top = (rect.top + (y - startY.current)) + 'px'

      // Find which row we're over
      const list = listRef.current
      if (!list) return
      const rows = list.querySelectorAll('.order-row')
      let over = startIdx.current
      rows.forEach((r, i) => {
        const rb = r.getBoundingClientRect()
        if (y > rb.top + rb.height * 0.3 && y < rb.bottom - rb.height * 0.3) over = i
      })
      setOverIdx(over)
    }

    const onUp = (ev) => {
      const y = ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY
      if (dragRef.current) {
        dragRef.current.remove()
        dragRef.current = null
      }
      // Commit the reorder
      const from = startIdx.current
      setOrder(prev => {
        // Calculate final target index
        const list = listRef.current
        if (!list) return prev
        const rows = list.querySelectorAll('.order-row')
        let to = from
        rows.forEach((r, i) => {
          const rb = r.getBoundingClientRect()
          if (y > rb.top + rb.height * 0.3 && y < rb.bottom - rb.height * 0.3) to = i
        })
        if (to === from) return prev
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        setDirty(true)
        return next
      })
      setDragIdx(null)
      setOverIdx(null)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup',   onUp)
      document.removeEventListener('touchmove',   onMove)
      document.removeEventListener('touchend',    onUp)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerup',   onUp)
    document.addEventListener('touchmove',   onMove, { passive: true })
    document.addEventListener('touchend',    onUp)
  }, [])

  // ── Save to Supabase ───────────────────────────────────────
  const saveOrder = async () => {
    setSaving(true)
    // Reassign auction_order: sold items keep their current numbers,
    // unsold items get renumbered starting from the first unsold slot.
    // Strategy: interleave sold (locked) and unsold (reordered) by
    // preserving the relative position of sold items and filling gaps.

    // Collect all items with their desired final auction_order
    // Sold items are already in place; we just need to number the unsold
    // items in the new sequence, fitting around the sold items.

    // Build full merged order: sold items occupy their original positions,
    // unsold items fill in around them in new sequence order.
    const allSorted  = [...items].sort((a, b) => a.auction_order - b.auction_order)
    const soldOrders = sold.map(i => i.auction_order)  // positions to keep

    // Build new order array: place sold items at their locked positions,
    // fill remaining positions with the reordered unsold items
    const total     = items.length
    const newOrders = new Array(total)
    const soldSet   = new Set(soldOrders)

    // Fill sold positions first
    sold.forEach(i => { newOrders[i.auction_order - 1] = i.id })

    // Fill remaining positions with unsold in new sequence
    let unsoldIdx = 0
    for (let pos = 0; pos < total; pos++) {
      if (!newOrders[pos]) {
        newOrders[pos] = order[unsoldIdx]?.id
        unsoldIdx++
      }
    }

    // Build updates: id → new auction_order (1-based)
    const updates = newOrders
      .map((id, pos) => ({ id, auction_order: pos + 1 }))
      .filter(u => u.id != null)

    // Batch update via upsert
    const { error } = await supabase
      .from('auction_items')
      .upsert(updates, { onConflict: 'id' })

    setSaving(false)
    if (error) {
      toast('Error saving order')
      console.error(error)
    } else {
      toast('Auction order saved!')
      setDirty(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Info bar */}
      <div style={{ padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>
            {order.length} unsold · {sold.length} locked
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            Hold &amp; drag ☰ to reorder
          </div>
        </div>
        {dirty && (
          <button
            className="btn-primary"
            onClick={saveOrder}
            disabled={saving}
            style={{ width: 'auto', padding: '9px 18px', fontSize: 15 }}
          >
            {saving ? 'SAVING...' : 'SAVE ORDER'}
          </button>
        )}
      </div>

      {/* Unsold items — draggable */}
      <div style={{ flex: 1, overflowY: 'auto' }} ref={listRef}>
        {order.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-text">All items sold — nothing to reorder</div>
          </div>
        )}

        {order.map((item, idx) => {
          const isDragging = dragIdx === idx
          const isOver     = overIdx === idx && overIdx !== dragIdx
          return (
            <div
              key={item.id}
              className="order-row"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                borderBottom: '1px solid rgba(42,47,61,.5)',
                background: isOver    ? 'rgba(245,166,35,.08)'
                          : isDragging ? 'rgba(255,255,255,.04)'
                          : 'transparent',
                borderTop: isOver ? '2px solid var(--accent)' : '2px solid transparent',
                opacity: isDragging ? 0.4 : 1,
                transition: 'background .1s, border-color .1s',
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              {/* Position number */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text3)', width: 28, flexShrink: 0, textAlign: 'right' }}>
                {idx + 1}
              </div>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.display_name}
                </div>
                {item.is_block && (
                  <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 1 }}>12–14 block</div>
                )}
              </div>

              {/* Drag handle */}
              <div
                onPointerDown={e => onPointerDown(e, idx)}
                style={{
                  padding: '8px 6px', cursor: 'grab', flexShrink: 0,
                  color: 'var(--text3)', fontSize: 18, lineHeight: 1,
                  touchAction: 'none', userSelect: 'none',
                }}
              >
                ☰
              </div>
            </div>
          )
        })}

        {/* Sold items — locked */}
        {sold.length > 0 && (
          <>
            <div className="sec-head">
              <span>Sold · locked in place ({sold.length})</span>
            </div>
            {sold.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(42,47,61,.4)',
                  opacity: 0.45,
                }}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text3)', width: 28, textAlign: 'right', flexShrink: 0 }}>
                  {item.auction_order}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.display_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                    <span className={`owner-${item.owner}`}>{item.owner}</span> · ${item.bid_amount}
                  </div>
                </div>
                <div style={{ fontSize: 16, color: 'var(--text3)', flexShrink: 0 }}>🔒</div>
              </div>
            ))}
          </>
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}

// ── Admin shell ───────────────────────────────────────────────
export default function Admin({ items, teams, adminAuthed, setAdminAuthed, toast }) {
  const [tab, setTab] = useState('bids')

  if (!adminAuthed) {
    return (
      <>
        <div className="app-header"><h1>ADMIN</h1></div>
        <PasswordGate onAuth={setAdminAuthed} />
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>ADMIN</h1>
          <div className="subtitle">
            <span style={{ color: 'var(--green)', marginRight: 8 }}>● Logged in</span>
          </div>
        </div>
        <button onClick={() => setAdminAuthed(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-mono)', padding: '5px 10px', flexShrink: 0 }}>
          log out
        </button>
      </div>

      <div className="tab-row" style={{ overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
        <button className={`tab-btn ${tab === 'bids'    ? 'active' : ''}`} onClick={() => setTab('bids')}    style={{ whiteSpace: 'nowrap' }}>Enter Bids</button>
        <button className={`tab-btn ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')} style={{ whiteSpace: 'nowrap' }}>Results</button>
        <button className={`tab-btn ${tab === 'log'     ? 'active' : ''}`} onClick={() => setTab('log')}     style={{ whiteSpace: 'nowrap' }}>Bid Log</button>
        <button className={`tab-btn ${tab === 'order'   ? 'active' : ''}`} onClick={() => setTab('order')}   style={{ whiteSpace: 'nowrap' }}>Auction Order</button>
      </div>

      {tab === 'bids'    && <BidsTab    items={items} teams={teams} toast={toast} />}
      {tab === 'results' && <ResultsTab items={items} teams={teams} toast={toast} />}
      {tab === 'log'     && <BidLogTab  items={items} teams={teams} toast={toast} />}
      {tab === 'order'   && <OrderTab   items={items} toast={toast} />}
    </div>
  )
}
