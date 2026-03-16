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

// ── Bracket constants ────────────────────────────────────────
const POD_A = [1,16,8,9], POD_B = [5,12,4,13]
const POD_C = [6,11,3,14], POD_D = [7,10,2,15]
const TOP_HALF   = [...POD_A,...POD_B], BOT_HALF = [...POD_C,...POD_D]
const R64_PAIRS  = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]]
const REGIONS    = ['Midwest','West','South','East']
const FF_PAIRS   = [['South','Midwest'],['East','West']]
const ROUND_LABELS = ['Round of 64','Round of 32','Sweet 16','Elite 8','Final Four','Championship']

function getActiveMatchups(teams) {
  const alive = teams.filter(t => !t.eliminated)
  const matchups = []
  for (const region of REGIONS) {
    const rt = alive.filter(t => t.region === region)
    for (const [s1,s2] of R64_PAIRS) {
      const a = rt.find(t => t.seed===s1 && t.wins===0)
      const b = rt.find(t => t.seed===s2 && t.wins===0)
      if (a && b) matchups.push({ round:0, label:'Round of 64', region, a, b })
    }
    for (const pod of [POD_A,POD_B,POD_C,POD_D]) {
      const pair = rt.filter(t => pod.includes(t.seed) && t.wins===1)
      if (pair.length===2) matchups.push({ round:1, label:'Round of 32', region, a:pair[0], b:pair[1] })
    }
    const top2 = rt.filter(t => TOP_HALF.includes(t.seed) && t.wins===2)
    if (top2.length===2) matchups.push({ round:2, label:'Sweet 16', region, a:top2[0], b:top2[1] })
    const bot2 = rt.filter(t => BOT_HALF.includes(t.seed) && t.wins===2)
    if (bot2.length===2) matchups.push({ round:2, label:'Sweet 16', region, a:bot2[0], b:bot2[1] })
    const e8 = rt.filter(t => t.wins===3)
    if (e8.length===2) matchups.push({ round:3, label:'Elite 8', region, a:e8[0], b:e8[1] })
  }
  for (const [r1,r2] of FF_PAIRS) {
    const a = alive.find(t => t.region===r1 && t.wins===4)
    const b = alive.find(t => t.region===r2 && t.wins===4)
    if (a && b) matchups.push({ round:4, label:'Final Four', region:`${r1} / ${r2}`, a, b })
  }
  const fin = alive.filter(t => t.wins===5)
  if (fin.length===2) matchups.push({ round:5, label:'Championship', region:'National Championship', a:fin[0], b:fin[1] })
  return matchups
}

// ── Results tab — bracket score entry ────────────────────────
function ResultsTab({ teams, items, toast }) {
  const [scores,     setScores]     = useState({})
  const [submitting, setSubmitting] = useState(null)

  const ownerOf = (team) => items.find(i => i.id === team.auction_item_id)?.owner
  const matchups = getActiveMatchups(teams)
  const byRound  = {}
  for (const m of matchups) { (byRound[m.label] ??= []).push(m) }

  const setScore = (id, val) => setScores(prev => ({ ...prev, [id]: val }))

  const submitGame = async (m) => {
    const sa = parseInt(scores[m.a.id]), sb = parseInt(scores[m.b.id])
    if (isNaN(sa)||isNaN(sb)||sa<0||sb<0) return
    if (sa===sb) { toast('Scores must differ'); return }
    const winner = sa>sb ? m.a : m.b
    const loser  = sa>sb ? m.b : m.a
    const margin = Math.abs(sa-sb)
    const key    = `${m.a.id}-${m.b.id}`
    setSubmitting(key)
    const [r1,r2] = await Promise.all([
      supabase.from('tournament_teams').update({ wins: winner.wins+1 }).eq('id', winner.id),
      supabase.from('tournament_teams').update({ eliminated:true, loss_margin:margin }).eq('id', loser.id),
    ])
    setSubmitting(null)
    if (r1.error||r2.error) { toast('Error saving result'); return }
    toast(`${winner.name} advances!`)
    setScores(prev => { const n={...prev}; delete n[m.a.id]; delete n[m.b.id]; return n })
  }

  const undoElim = async (team) => {
    const { error } = await supabase
      .from('tournament_teams').update({ eliminated:false, loss_margin:0 }).eq('id', team.id)
    if (error) toast('Error')
    else toast(`${team.name} restored`)
  }

  const eliminated = [...teams].filter(t => t.eliminated)
    .sort((a,b) => b.wins-a.wins || a.name.localeCompare(b.name))

  return (
    <div style={{ overflowY:'auto', flex:1 }}>
      {matchups.length===0 && eliminated.length===0 && (
        <div className="empty-state">
          <div className="empty-icon">🏀</div>
          <div className="empty-text">Games appear here once the tournament starts</div>
        </div>
      )}

      {ROUND_LABELS.map(label => {
        const games = byRound[label]
        if (!games?.length) return null
        return (
          <div key={label}>
            <div className="sec-head"><span>{label}</span><span>{games.length} game{games.length!==1?'s':''}</span></div>
            {games.map(m => {
              const key = `${m.a.id}-${m.b.id}`
              const sa = scores[m.a.id]??'', sb = scores[m.b.id]??''
              const saNum=parseInt(sa), sbNum=parseInt(sb)
              const valid = !isNaN(saNum)&&!isNaN(sbNum)&&saNum>=0&&sbNum>=0&&saNum!==sbNum
              const winnerName = valid ? (saNum>sbNum ? m.a.name : m.b.name) : null
              const isSub = submitting===key
              return (
                <div key={key} style={{ margin:'6px 16px', borderRadius:12, background:'var(--bg2)', border:'1px solid var(--border)', padding:'14px 14px 12px' }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>
                    {m.region}
                  </div>
                  <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                    {[m.a,m.b].map((team,idx) => {
                      const owner = idx===0 ? ownerOf(m.a) : ownerOf(m.b)
                      return (
                        <div key={team.id} style={{ flex:1, textAlign:'center' }}>
                          <div style={{ fontFamily:'var(--font-head)', fontSize:16, fontWeight:700, color:'var(--text)', letterSpacing:'.02em', lineHeight:1.2 }}>{team.name}</div>
                          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>#{team.seed}</div>
                          {owner && <div style={{ fontFamily:'var(--font-head)', fontSize:13, fontWeight:700, letterSpacing:'.04em', marginTop:2 }} className={`owner-${owner}`}>{owner}</div>}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    {[m.a,m.b].map((team,idx) => {
                      const val = idx===0 ? sa : sb
                      const hasVal = val!==''&&!isNaN(parseInt(val))
                      return (
                        <input key={team.id} type="number" inputMode="numeric" placeholder="—" value={val}
                          onChange={e => setScore(team.id, e.target.value)}
                          style={{ flex:1, textAlign:'center', padding:'10px 6px', borderRadius:8,
                            border:`1.5px solid ${hasVal?'var(--accent)':'var(--border)'}`,
                            background:'var(--bg3)', color:'var(--text)',
                            fontFamily:'var(--font-mono)', fontSize:24, fontWeight:500, outline:'none' }}
                        />
                      )
                    })}
                  </div>
                  <button className="btn-primary" disabled={!valid||isSub} onClick={() => submitGame(m)} style={{ fontSize:15 }}>
                    {isSub ? 'SAVING...' : valid ? `${winnerName} WINS` : 'ENTER SCORES'}
                  </button>
                </div>
              )
            })}
          </div>
        )
      })}

      {eliminated.length > 0 && (
        <>
          <div className="sec-head"><span>Completed · tap to undo</span></div>
          {eliminated.map(team => {
            const owner = ownerOf(team)
            const sc = team.seed<=11 ? `seed-badge seed-${team.seed}` : 'seed-badge seed-16'
            return (
              <div key={team.id} style={{ display:'flex', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid rgba(42,47,61,.4)', gap:10, opacity:.5, cursor:'pointer' }}
                onClick={() => undoElim(team)}>
                <div className={sc}>{team.seed}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, color:'var(--text)', letterSpacing:'.02em' }}>{team.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginTop:1 }}>
                    {team.wins}W · {team.region}{team.loss_margin>0?` · lost by ${team.loss_margin}`:''}
                    {owner && <span> · <span className={`owner-${owner}`}>{owner}</span></span>}
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--font-mono)' }}>undo</div>
              </div>
            )
          })}
        </>
      )}
      <div style={{ height:16 }} />
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
        <div className="app-header"><h1>ADMIN</h1></div>
        <PasswordGate onAuth={setAdminAuthed} />
      </>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
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

      <div className="tab-row" style={{ overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none', flexShrink: 0 }}>
        <button className={`tab-btn ${tab === 'bids'    ? 'active' : ''}`} onClick={() => setTab('bids')}    style={{ whiteSpace: 'nowrap' }}>Enter Bids</button>
        <button className={`tab-btn ${tab === 'results' ? 'active' : ''}`} onClick={() => setTab('results')} style={{ whiteSpace: 'nowrap' }}>Results</button>
        <button className={`tab-btn ${tab === 'log'     ? 'active' : ''}`} onClick={() => setTab('log')}     style={{ whiteSpace: 'nowrap' }}>Bid Log</button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {tab === 'bids'    && <BidsTab    items={items} teams={teams} toast={toast} />}
        {tab === 'results' && <ResultsTab items={items} teams={teams} toast={toast} />}
        {tab === 'log'     && <BidLogTab  items={items} teams={teams} toast={toast} />}
      </div>
    </div>
  )
}
