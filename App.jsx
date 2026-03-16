import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import AuctionBoard from './screens/AuctionBoard'
import Leaderboard  from './screens/Leaderboard'
import MyTeams      from './screens/MyTeams'
import Payouts      from './screens/Payouts'
import Admin        from './screens/Admin'

// ── Payout rates by wins ──────────────────────────────────────
const PAYOUT_RATES = [0, 0.01, 0.02, 0.04, 0.08, 0.12, 0.20]
const LARGEST_LOSS_RATE = 0.04

export function potTotal(items) {
  return items.reduce((s, i) => s + (i.bid_amount || 0), 0)
}

export function payoutForWins(wins, pot) {
  return Math.round(pot * (PAYOUT_RATES[Math.min(wins, 6)] || 0))
}

export function calcStandings(items, teams) {
  const pot = potTotal(items)
  if (pot === 0 || items.length === 0) return []

  // Find team with biggest single-game loss margin
  const biggestLoser = teams
    .filter(t => t.loss_margin > 0)
    .sort((a, b) => b.loss_margin - a.loss_margin)[0] || null

  // Build lookup: auction_item_id → owner/bid
  const itemMap = {}
  items.forEach(i => { itemMap[i.id] = i })

  // Group teams by owner
  const ownerData = {}
  items.filter(i => i.owner).forEach(i => {
    if (!ownerData[i.owner]) ownerData[i.owner] = { items: [], teams: [] }
    ownerData[i.owner].items.push(i)
  })
  teams.forEach(t => {
    const item = itemMap[t.auction_item_id]
    if (item?.owner) {
      if (!ownerData[item.owner]) ownerData[item.owner] = { items: [], teams: [] }
      ownerData[item.owner].teams.push(t)
    }
  })

  return Object.entries(ownerData)
    .map(([owner, { items: ownerItems, teams: ownerTeams }]) => {
      const totalBid    = ownerItems.reduce((s, i) => s + (i.bid_amount || 0), 0)
      const winPayout   = ownerTeams.reduce((s, t) => s + payoutForWins(t.wins, pot), 0)
      const lossBonus   = biggestLoser && ownerTeams.some(t => t.id === biggestLoser.id)
                            ? Math.round(pot * LARGEST_LOSS_RATE) : 0
      const gross       = winPayout + lossBonus
      const net         = gross - totalBid
      const roi         = totalBid > 0 ? Math.round((net / totalBid) * 100) : 0
      const alive       = ownerTeams.filter(t => !t.eliminated).length

      return { owner, totalBid, gross, net, roi, alive, items: ownerItems, teams: ownerTeams, lossBonus }
    })
    .sort((a, b) => b.net - a.net)
}

// ── Nav config ───────────────────────────────────────────────
const NAV = [
  { id: 'board',       icon: '📋', label: 'Board'    },
  { id: 'leaderboard', icon: '🏆', label: 'Standings' },
  { id: 'myteams',     icon: '🏀', label: 'My Teams'  },
  { id: 'payouts',     icon: '💰', label: 'Payouts'   },
  { id: 'admin',       icon: '✏️', label: 'Admin'     },
]

const SCREENS = {
  board:       AuctionBoard,
  leaderboard: Leaderboard,
  myteams:     MyTeams,
  payouts:     Payouts,
  admin:       Admin,
}

// ── Toast helper ─────────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState({ msg: '', show: false })
  const timer = useRef(null)
  const fire = (msg) => {
    clearTimeout(timer.current)
    setToast({ msg, show: true })
    timer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2200)
  }
  return [toast, fire]
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [screen,      setScreen]      = useState('board')
  const [items,       setItems]       = useState([])
  const [teams,       setTeams]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [adminAuthed, setAdminAuthed] = useState(false)
  const [toast,       fireToast]      = useToast()

  const loadData = useCallback(async () => {
    const [{ data: its, error: e1 }, { data: tms, error: e2 }] = await Promise.all([
      supabase.from('auction_items').select('*').order('auction_order'),
      supabase.from('tournament_teams').select('*').order('seed').order('name'),
    ])
    if (e1) console.error('auction_items error:', e1)
    if (e2) console.error('tournament_teams error:', e2)
    if (its) setItems(its)
    if (tms) setTeams(tms)
    setLoading(false)
  }, [])

  // Initial load + real-time subscription
  useEffect(() => {
    loadData()
    const channel = supabase
      .channel('all-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_items' },    loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_teams' }, loadData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadData])

  if (loading) return <div className="loading-screen">LOADING...</div>

  const pot       = potTotal(items)
  const standings = calcStandings(items, teams)
  const Screen    = SCREENS[screen] || AuctionBoard

  const sharedProps = {
    items, teams, standings, pot,
    adminAuthed, setAdminAuthed,
    reload: loadData,
    toast: fireToast,
  }

  return (
    <div className="app-shell">
      <div className="screen-body">
        <Screen {...sharedProps} />
      </div>

      <nav className="bottom-nav">
        {NAV.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`nav-btn ${screen === id ? 'active' : ''}`}
            onClick={() => setScreen(id)}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Global toast */}
      <div className={`toast ${toast.show ? 'show' : ''}`}>{toast.msg}</div>
    </div>
  )
}
