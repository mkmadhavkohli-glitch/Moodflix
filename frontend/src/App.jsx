import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Search from './pages/Search'
import Landing from './pages/Landing'

function ProtectedRoute({ children, session }) {
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
          <p className="text-white/40 font-inter text-sm">Loading MoodFlix…</p>
        </div>
      </div>
    )
  }
  return session ? children : <Navigate to="/landing" replace />
}

function PublicRoute({ children, session }) {
  if (session === undefined) return null
  return session ? <Navigate to="/" replace /> : children
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <div className="noise-overlay" aria-hidden="true" />
      <Routes>
        {/* ── Public routes (no auth needed) ── */}
        <Route path="/landing" element={<Landing />} />
        <Route path="/login"    element={<PublicRoute session={session}><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute session={session}><Register /></PublicRoute>} />

        {/* ── Protected routes (auth required) ── */}
        <Route path="/"       element={<ProtectedRoute session={session}><Home /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute session={session}><Search /></ProtectedRoute>} />

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  )
}