import { useEffect, useState } from 'react'

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('theme')
    return savedTheme === 'night' ? 'night' : 'nord'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'nord' ? 'night' : 'nord'))
  }

  return (
    <main className="min-h-screen bg-base-200 p-6 flex items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center gap-4">
          <h1 className="card-title text-3xl">Theme Toggle Test</h1>
          <p>
            Current theme:{' '}
            <span className="badge badge-primary badge-lg">{theme}</span>
          </p>

          <button type="button" className="btn btn-primary" onClick={toggleTheme}>
            Switch to {theme === 'nord' ? 'night' : 'nord'}
          </button>

          <div className="divider">DaisyUI Preview</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" className="btn btn-secondary btn-sm">
              Secondary
            </button>
            <button type="button" className="btn btn-accent btn-sm">
              Accent
            </button>
            <span className="badge badge-outline">Badge</span>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
