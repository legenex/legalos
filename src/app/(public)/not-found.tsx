export default function NotFound() {
  return (
    <main style={{ maxWidth: 600, margin: '120px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1>Page not found</h1>
      <p style={{ color: 'var(--site-muted)' }}>The page you are looking for does not exist or has moved.</p>
      <p>
        <a href="/" style={{ color: 'var(--site-primary)' }}>Go back home</a>
      </p>
    </main>
  )
}
