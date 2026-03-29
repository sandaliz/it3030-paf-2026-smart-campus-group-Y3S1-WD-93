import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { resourceService } from './services/resourceService'
import ResourceDetailPage from './pages/resources/ResourceDetailPage'
import ResourceManagementPage from './pages/resources/ResourceManagementPage'
import { CardSkeleton, PageLoader } from './components/ui/LoadingSkeleton'

// Temporary Resource List Page
const ResourceListPage = () => {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const data = await resourceService.getAllResources()
        setResources(data)
        setError(null)
      } catch (err) {
        setError('Failed to load resources')
        console.error('Error fetching resources:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [])

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Campus Resources</h1>
      
      {error && (
        <div className="alert alert-error mb-6">
          <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.length === 0 && loading ? (
          // Show 6 skeleton cards while loading
          Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))
        ) : (
          resources.map((resource) => (
            <div key={resource.id} className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">{resource.name}</h2>
                <p className="text-base-content/70 capitalize">{resource.type.replace('_', ' ').toLowerCase()}</p>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{resource.location}</span>
                </div>
                <div className="card-actions justify-end">
                  <Link to={`/resources/${resource.id}`} className="btn btn-primary btn-sm">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

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
  )
}

export default App
