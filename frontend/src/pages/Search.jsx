import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { searchContent, fetchByIndustry, INDUSTRIES } from '../lib/tmdb'
import Navbar from '../components/Navbar'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard'
import { supabase } from '../lib/supabase'

function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => <MovieCardSkeleton key={i} />)}
    </div>
  )
}

export default function Search() {
  const [user, setUser] = useState(null)
  const [query, setQuery] = useState('')
  const [activeIndustry, setActiveIndustry] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    inputRef.current?.focus()
  }, [])

  // Debounced search
  useEffect(() => {
    if (activeIndustry) return // skip search when browsing industry
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults(null); setError(null); return }
    debounceRef.current = setTimeout(() => { runSearch(query, 1) }, 400)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const runSearch = useCallback(async (q, p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchContent(q, p)
      setResults(data)
      setPage(p)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const runIndustry = useCallback(async (key, p = 1) => {
    setLoading(true)
    setError(null)
    setQuery('')
    try {
      const data = await fetchByIndustry(key, p)
      setResults(data)
      setPage(p)
    } catch {
      setError('Failed to load. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleIndustryClick = (key) => {
    if (activeIndustry === key) {
      setActiveIndustry(null)
      setResults(null)
      return
    }
    setActiveIndustry(key)
    runIndustry(key, 1)
  }

  const allItems = results
    ? [...(results.movies || []), ...(results.shows || [])]
    : []

  const totalPages = results?.totalPages || 1

  return (
    <div className="min-h-screen bg-dark-900 relative">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c5cfc, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fc5c9c, transparent)' }} />
      </div>

      <Navbar user={user} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pb-24 pt-6">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-syne text-3xl md:text-4xl font-bold gradient-text mb-1">Search & Browse</h1>
          <p className="text-white/40 text-sm">Search by title or browse by industry</p>
        </motion.div>

        {/* Search bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndustry(null) }}
            placeholder="Search movies, shows, anime…"
            className="w-full pl-12 pr-10 py-4 rounded-2xl text-white text-sm font-inter outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(124,92,252,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults(null); setActiveIndustry(null) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </motion.div>

        {/* Industry tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-8">
          {Object.entries(INDUSTRIES).map(([key, ind]) => (
            <button
              key={key}
              onClick={() => handleIndustryClick(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeIndustry === key
                  ? 'text-white shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              style={activeIndustry === key ? {
                background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(252,92,156,0.3))',
                border: '1px solid rgba(124,92,252,0.4)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span>{ind.emoji}</span>
              <span>{ind.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-8 text-center">
              <div className="text-3xl mb-3">😕</div>
              <p className="text-white/60 text-sm">{error}</p>
            </motion.div>
          )}

          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SkeletonGrid count={10} />
            </motion.div>
          )}

          {!loading && !error && results && allItems.length === 0 && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-white/60 text-sm">No results found. Try a different search.</p>
            </motion.div>
          )}

          {!loading && !error && allItems.length > 0 && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Section label */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-syne text-lg font-bold text-white">
                  {activeIndustry
                    ? `${INDUSTRIES[activeIndustry].emoji} ${INDUSTRIES[activeIndustry].label}`
                    : `Results for "${query}"`}
                </h2>
                <span className="text-white/40 text-xs">{allItems.length} found</span>
              </div>

              {/* Movies section */}
              {results.movies?.length > 0 && (
                <div className="mb-10">
                  {(results.shows?.length > 0) && (
                    <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">🎬 Movies</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {results.movies.map((item, i) => (
                      <MovieCard key={`m-${item.id}-${i}`} movie={item} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Shows/Anime section */}
              {results.shows?.length > 0 && (
                <div className="mb-10">
                  {(results.movies?.length > 0) && (
                    <p className="text-white/50 text-xs uppercase tracking-widest font-semibold mb-3">📺 Shows / Anime</p>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                    {results.shows.map((item, i) => (
                      <MovieCard key={`s-${item.id}-${i}`} movie={item} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {activeIndustry && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    disabled={page <= 1}
                    onClick={() => runIndustry(activeIndustry, page - 1)}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    ← Prev
                  </button>
                  <span className="text-white/40 text-sm">Page {page} of {Math.min(totalPages, 20)}</span>
                  <button
                    disabled={page >= Math.min(totalPages, 20)}
                    onClick={() => runIndustry(activeIndustry, page + 1)}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-all disabled:opacity-30"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {!loading && !error && !results && !query && !activeIndustry && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-white/40 text-sm">Type to search or pick an industry above</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
