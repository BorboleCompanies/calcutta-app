// Shared header used by all screens.
// Shows the title + optional subtitle on the left,
// and a ⚙ gear icon on the right that navigates to Admin.

export default function AppHeader({ title, subtitle, liveIndicator, goToAdmin, adminAuthed }) {
  return (
    <div className="app-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {liveIndicator && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            <span className="live-dot" />
            LIVE AUCTION
          </div>
        )}
        <h1>{title}</h1>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>

      {goToAdmin && (
        <button
          onClick={goToAdmin}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '4px 0 4px 16px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
            marginTop: 2,
            WebkitTapHighlightColor: 'transparent',
          }}
          aria-label="Admin"
        >
          <span style={{ fontSize: 22 }}>⚙️</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: adminAuthed ? 'var(--green)' : 'var(--text3)',
            letterSpacing: '.05em',
            textTransform: 'uppercase',
          }}>
            {adminAuthed ? 'Admin ●' : 'Admin'}
          </span>
        </button>
      )}
    </div>
  )
}
