import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './pages/admin/AdminDashboard'
import LecturerDashboard from './pages/LecturerDashboard'
import StudentDashboard from './pages/StudentDashboard'
import StaffDashboard from './pages/StaffDashboard'

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme === 'night' ? 'night' : 'nord';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'nord' ? 'night' : 'nord'))
  }

  return (
    <Router>
      <Routes>
        {/* Main Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/lecturer" element={<LecturerDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/staff" element={<StaffDashboard />} />
        
        {/* Navigation Landing Page */}
        <Route path="/" element={
          <main className="min-h-screen bg-base-200 p-6 flex flex-col items-center justify-center gap-8">
            <div className="card w-full max-w-md bg-base-100 shadow-2xl overflow-hidden border border-base-300">
               <div className="h-2 bg-gradient-to-r from-primary via-secondary via-accent to-warning"></div>
              <div className="card-body items-center text-center gap-6 p-8">
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-warning bg-clip-text text-transparent mb-2">
                    UniOps Hub
                  </h1>
                  <p className="text-sm font-bold opacity-60 uppercase tracking-widest">Smart Campus Operations</p>
                </div>

                <div className="divider text-xs font-black opacity-30">PORTAL SELECTION</div>
                
                <div className="grid grid-cols-1 gap-3 w-full">
                  <a href="/admin" className="btn btn-primary shadow-lg shadow-primary/20 group justify-between items-center px-6 btn-md">
                    <span className="flex items-center gap-3">🛡️ <span className="tracking-tight italic font-black">Admin</span></span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </a>
                  
                  <a href="/lecturer" className="btn btn-secondary shadow-lg shadow-secondary/20 group justify-between items-center px-6 btn-md">
                    <span className="flex items-center gap-3">👨‍🏫 <span className="tracking-tight italic font-black">Lecturer</span></span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </a>

                  <a href="/student" className="btn btn-accent shadow-lg shadow-accent/20 group justify-between items-center px-6 btn-md">
                    <span className="flex items-center gap-3">🎓 <span className="tracking-tight italic font-black">Student</span></span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </a>

                  <a href="/staff" className="btn btn-warning shadow-lg shadow-warning/20 group justify-between items-center px-6 btn-md text-white font-black">
                    <span className="flex items-center gap-3">🔧 <span className="tracking-tight italic font-black">Staff</span></span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </a>
                </div>

                <div className="mt-8 pt-6 border-t border-base-200 w-full flex justify-between items-center">
                   <button onClick={toggleTheme} className="btn btn-ghost btn-xs opacity-60 font-bold">
                      MODE: {theme.toUpperCase()}
                   </button>
                   <span className="text-[10px] opacity-30 font-mono">STABLE v1.0.12.F</span>
                </div>
              </div>
            </div>
          </main>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App;
