import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { resourceService } from './services/resourceService'
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import ResourceManagementPage from './pages/resources/ResourceManagementPage'
import ResourceListPage from './pages/resources/ResourceListPage'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Home Page
const HomePage = () => {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Smart Campus</h1>
          <p className="py-6">
            Manage campus facilities, bookings, and maintenance requests in one platform.
          </p>
          <div className="flex gap-2 justify-center">
            <Link to="/resources" className="btn btn-primary">
              Browse Resources
            </Link>
            <Link to="/admin/resources" className="btn btn-outline">
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

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
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-base-200">
          {/* Navigation */}
          <div className="navbar bg-base-100 shadow-lg">
            <div className="container mx-auto">
              <div className="flex-1">
                <Link to="/" className="btn btn-ghost text-xl font-bold">
                  🏫 Smart Campus
                </Link>
              </div>
              <div className="flex-none gap-2">
                <Link to="/resources" className="btn btn-ghost">
                  Resources
                </Link>
                <Link to="/admin/resources" className="btn btn-ghost">
                  Admin
                </Link>
                <button className="btn btn-ghost btn-circle" onClick={toggleTheme}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {theme === 'nord' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Routes */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/resources" element={<ResourceListPage />} />
            <Route path="/resources/:id" element={<ResourceDetailPage />} />
            <Route path="/admin/resources" element={<ResourceManagementPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
