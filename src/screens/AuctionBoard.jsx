import { useState, useRef, useEffect } from 'react'
import { potTotal } from '../App'
import AppHeader from '../components/AppHeader'

const SEED_AVG = {
  1:197, 2:118, 3:80, 4:62, 5:53, 6:41, 7:35, 8:35,
  9:29, 10:27, 11:31, 12:150, 13:150, 14:150, 15:18, 16:21,
}

function seedClass(seed, isBlock) {
  if (isBlock) return 'seed-badge seed-block'
  const n = Number(seed)
  if (n <= 11) return `seed-badge seed-${n}`
  return 'seed-badge seed-16'
}

// Build display rows from auction_items (each item = one row)
function buildRows(items) {
  return items.map(item => ({
    item,
    seedLabel: item.is_block ? 'BLK' : '',
    sold: !!(item.owner && item.bid_amount),
  }))
}

export default function AuctionBoard({ items, teams, goToAdmin, adminAuthed }) {
  const [filter, setFilter]   = useState('all')
  const prevFlash = useRef(null)
  const [flashId, setFlashId] = useState(null)

  // Flash newest bid
  const soldItems  = items.filter(i => i.owner)
  const lastSoldId = soldItems.length > 0 ? soldItems[soldItems.length - 1]?.id : null
  useEffect(() => {
    if (lastSoldId && lastSoldId !== prevFlash.current) {
      prevFlash.current = lastSoldId
      setFlashId(lastSoldId)
      setTimeout(() => setFlashId(null), 900)
    }
  }, [lastSoldId])

  const pot      = potTotal(items)
  const sold     = items.filter(i => i.bid_amount).length
  const remain   = items.length - sold
  const avg      = sold > 0 ? Math.round(pot / sold) : 0

  // Current "on block" = first unsold item in auction order
  const onBlockItem = items.find(i => !i.owner)

  // Unique owners from sold items (for filter pills)
  const owners = [...new Set(items.filter(i => i.owner).map(i => i.owner))].sort()

  // Filter items
  let displayed = items
  if (filter === 'sold')   displayed = items.filter(i => i.owner)
  if (filter === 'unsold') displayed = items.filter(i => !i.owner)
  if (owners.includes(filter)) displayed = items.filter(i => i.owner === filter)

  // Group into sections for headers
  const sections = [
    { label: 'Seeds 2–11',  rows: displayed.filter(i => i.auction_order <= 40) },
    { label: '12–14 Block', rows: displayed.filter(i => i.auction_order === 41) },
    { label: 'Seeds 15–16', rows: displayed.filter(i => i.auction_order >= 42 && i.auction_order <= 49) },
    { label: '1-Seeds',     rows: displayed.filter(i => i.auction_order >= 50) },
  ]

  return (
    <>
      {/* Header */}
      <AppHeader
        title="AUCTION BOARD"
        subtitle={`${sold} of ${items.length} teams sold · $${pot.toLocaleString()} in pot`}
        liveIndicator
        goToAdmin={goToAdmin}
        adminAuthed={adminAuthed}
      />

      {/* Stats */}
      <div className="stats-strip">
        <div className="stat-item"><div className="stat-val">${pot.toLocaleString()}</div><div className="stat-lbl">Pot</div></div>
        <div className="stat-item"><div className="stat-val">{sold}</div><div className="stat-lbl">Sold</div></div>
        <div className="stat-item"><div className="stat-val">{remain}</div><div className="stat-lbl">Left</div></div>
        <div className="stat-item"><div className="stat-val">${avg}</div><div className="stat-lbl">Avg bid</div></div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <button className={`fpill ${filter === 'all'    ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`fpill ${filter === 'sold'   ? 'active' : ''}`} onClick={() => setFilter('sold')}>Sold</button>
        <button className={`fpill ${filter === 'unsold' ? 'active' : ''}`} onClick={() => setFilter('unsold')}>Unsold</button>
        {owners.map(o => (
          <button
            key={o}
            className={`fpill ${filter === o ? 'owner-active' : ''}`}
            style={{ color: filter === o ? '#000' : undefined }}
            onClick={() => setFilter(o)}
          >
            {o}
          </button>
        ))}
      </div>

      {/* List */}
      {sections.map(sec => {
        if (sec.rows.length === 0) return null
        const secSold  = sec.rows.filter(i => i.owner).length
        return (
          <div key={sec.label}>
            <div className="sec-head">
              <span>{sec.label}</span>
              <span>{secSold}/{sec.rows.length}</span>
            </div>
            {sec.rows.map(item => {
              const isOnBlock = item.id === onBlockItem?.id
              const isSold    = !!(item.owner && item.bid_amount)
              const rowClass  = isOnBlock ? 'list-row row-on-block'
                              : isSold    ? `list-row ${flashId === item.id ? 'row-flash' : ''}`
                              : 'list-row row-pending'

              // Seed label
              const seedLabel = item.is_block ? 'BLK'
                : teams.find(t => t.auction_item_id === item.id)?.seed ?? '?'

              // Seed class
              const sc = item.is_block ? 'seed-badge seed-block'
                : `seed-badge seed-${seedLabel}`

              // Region from first matching team
              const region = item.is_block ? 'All regions'
                : teams.find(t => t.auction_item_id === item.id)?.region ?? ''

              return (
                <div key={item.id} className={rowClass}>
                  <div className={sc}>{seedLabel}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.display_name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 1 }}>{region}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {isOnBlock && <div className="on-block-badge">On block</div>}
                    {!isOnBlock && isSold && (
                      <>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 500, color: 'var(--text)' }}>
                          ${item.bid_amount}
                        </div>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, letterSpacing: '.04em' }} className={`owner-${item.owner}`}>
                          {item.owner}
                        </div>
                      </>
                    )}
                    {!isOnBlock && !isSold && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text3)' }}>
                        avg ${SEED_AVG[seedLabel] ?? 30}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {displayed.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-text">No teams match this filter</div>
        </div>
      )}

      <div style={{ height: 16 }} />
    </>
  )
}
