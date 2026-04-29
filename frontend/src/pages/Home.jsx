import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { fetchRecommendations } from '../lib/tmdb'
import Navbar from '../components/Navbar'
import MoodSelector from '../components/MoodSelector'
import MovieCard, { MovieCardSkeleton } from '../components/MovieCard'
import Chatbot from '../components/Chatbot'

// ── Section heading component ──
function SectionHeading({ emoji, title, subtitle, count }) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-3 mb-6 flex-wrap">
      <div>
        <h2 className="font-syne text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          {emoji} {title}
        </h2>
        {subtitle && <p className="text-white/40 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {count !== undefined && (
        <span className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(124,92,252,0.15)', color: '#7c5cfc', border: '1px solid rgba(124,92,252,0.25)' }}>
          {count} picks
        </span>
      )}
    </div>
  )
}

// ── Skeleton grid ──
function SkeletonGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Error card ──
function ErrorCard({ message, onRetry }) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <div className="text-4xl mb-3">😕</div>
      <p className="text-white/60 text-sm mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary text-sm px-6 py-2">
          Try Again
        </button>
      )}
    </div>
  )
}

// ── Welcome Hero ──
function HeroWelcome({ userName }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-12 md:py-16"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-6xl mb-6"
      >
        🎬
      </motion.div>
      <h1 className="font-syne text-3xl md:text-5xl font-bold mb-3">
        <span className="gradient-text">Hey {userName}!</span>
      </h1>
      <p className="text-white/50 text-base md:text-lg max-w-md mx-auto font-inter">
        What's your mood today? Let us find your perfect watch. 🍿
      </p>
      {/* Decorative animated orbs */}
      <div className="relative mt-8 h-1">
        <div className="absolute left-1/2 -translate-x-1/2 w-48 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #7c5cfc, #fc5c9c, transparent)' }} />
      </div>
    </motion.div>
  )
}

// ── Mood result banner ──
function MoodBanner({ mood, preferences, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl mb-8 flex-wrap"
      style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)' }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-syne font-bold gradient-text text-lg">Feeling {mood}</span>
        <div className="flex items-center gap-2 flex-wrap">
          {preferences.industry && preferences.industry !== 'Any' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
              🎬 {preferences.industry}
            </span>
          )}
          {preferences.platform !== 'Any' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
              📺 {preferences.platform}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
            🎞 {preferences.format}
          </span>
        </div>
      </div>
      <button
        onClick={onReset}
        id="change-mood-btn"
        className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Change mood
      </button>
    </motion.div>
  )
}

export default function Home() {
  const [user, setUser]               = useState(null)
  const [currentMood, setCurrentMood] = useState(null)
  const [preferences, setPreferences] = useState({})
  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  // Get user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const handleMoodSelect = async (mood, prefs) => {
    setCurrentMood(mood)
    setPreferences(prefs)
    setData(null)
    setError(null)
    setLoading(true)

    // Smooth scroll to results
    setTimeout(() => {
      const el = document.getElementById('recommendations')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 400)

    try {
      const result = await fetchRecommendations(mood, prefs)
      setData(result)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Could not load recommendations. Check your TMDB API key or internet connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentMood(null)
    setPreferences({})
    setData(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] || 'there'

  return (
    <div className="min-h-screen bg-dark-900 relative">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c5cfc, transparent)' }} />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fc5c9c, transparent)' }} />
      </div>

      <Navbar user={user} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pb-24">
        {/* Hero */}
        {!currentMood && <HeroWelcome userName={displayName} />}

        {/* ── SECTION A: Mood Selector ── */}
        <section id="mood-section">
          <MoodSelector onMoodSelect={handleMoodSelect} />
        </section>

        {/* ── SECTION B: Recommendations ── */}
        <AnimatePresence mode="wait">
          {(currentMood || loading || error) && (
            <motion.section
              id="recommendations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-4"
            >
              {/* Mood banner */}
              {currentMood && (
                <MoodBanner mood={currentMood} preferences={preferences} onReset={handleReset} />
              )}

              {/* Error state */}
              {error && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <ErrorCard
                    message={error}
                    onRetry={() => handleMoodSelect(currentMood, preferences)}
                  />
                </motion.div>
              )}

              {/* ── Movies ── */}
              {(loading || data?.movies?.length > 0) && (
                (preferences.format === 'Both' || preferences.format === 'Movies' || !preferences.format) && (
                  <div className="mb-12">
                    <SectionHeading
                      emoji="🎬"
                      title="Movies For You"
                      subtitle={`Hand-picked for your ${currentMood?.toLowerCase()} mood`}
                      count={data?.movies?.length}
                    />
                    {loading
                      ? <SkeletonGrid count={4} />
                      : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {data.movies.map((movie, i) => (
                            <MovieCard key={`movie-${movie.id}-${i}`} movie={movie} index={i} />
                          ))}
                        </div>
                      )
                    }
                  </div>
                )
              )}

              {/* ── Series ── */}
              {(loading || data?.series?.length > 0) && (
                (preferences.format === 'Both' || preferences.format === 'Series' || !preferences.format) && (
                  <div className="mb-12">
                    <SectionHeading
                      emoji="📺"
                      title="Web Series For You"
                      subtitle="Binge-worthy picks for your vibe"
                      count={data?.series?.length}
                    />
                    {loading
                      ? <SkeletonGrid count={4} />
                      : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {data.series.map((show, i) => (
                            <MovieCard key={`series-${show.id}-${i}`} movie={show} index={i} />
                          ))}
                        </div>
                      )
                    }
                  </div>
                )
              )}

              {/* ── Hidden Gems ── */}
              {(loading || data?.hiddenGems?.length > 0) && (
                <div className="mb-12">
                  <SectionHeading
                    emoji="💎"
                    title="Hidden Gems"
                    subtitle="Underrated picks most people sleep on"
                    count={data?.hiddenGems?.length}
                  />
                  {loading
                    ? <SkeletonGrid count={3} />
                    : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                        {data.hiddenGems.map((item, i) => (
                          <MovieCard key={`gem-${item.id}-${i}`} movie={item} index={i} badge="💎 Hidden Gem" />
                        ))}
                      </div>
                    )
                  }
                </div>
              )}

              {/* ── Wild Cards ── */}
              {(loading || data?.wildCards?.length > 0) && (
                <div className="mb-12">
                  <SectionHeading
                    emoji="🎲"
                    title="Bonus Wild Cards"
                    subtitle="Surprise picks — step outside your comfort zone"
                    count={data?.wildCards?.length}
                  />
                  {loading
                    ? <SkeletonGrid count={3} />
                    : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
                        {data.wildCards.map((item, i) => (
                          <MovieCard key={`wc-${item.id}`} movie={item} index={i} badge="🎲 Wild Card" />
                        ))}
                      </div>
                    )
                  }
                </div>
              )}

              {/* No results */}
              {!loading && data && !error &&
                data.movies.length === 0 &&
                data.series.length === 0 && (
                  <ErrorCard
                    message="No results found for this combination. Try a different language or format."
                    onRetry={handleReset}
                  />
                )
              }
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ── SECTION C: AI Chatbot ── */}
      <Chatbot currentMood={currentMood} />
    </div>
  )
}
