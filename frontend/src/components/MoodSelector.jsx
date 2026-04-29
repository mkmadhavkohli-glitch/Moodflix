import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { INDUSTRIES } from '../lib/tmdb'

const MOODS = [
  { name: 'Happy',        emoji: '😄', gradient: 'from-yellow-400 to-orange-400',    glow: 'rgba(251,191,36,0.4)'  },
  { name: 'Sad',          emoji: '😢', gradient: 'from-blue-400 to-blue-600',        glow: 'rgba(96,165,250,0.4)'  },
  { name: 'Angry',        emoji: '😤', gradient: 'from-red-500 to-orange-600',       glow: 'rgba(239,68,68,0.4)'   },
  { name: 'Anxious',      emoji: '😰', gradient: 'from-purple-500 to-indigo-600',    glow: 'rgba(168,85,247,0.4)'  },
  { name: 'Bored',        emoji: '😑', gradient: 'from-gray-400 to-slate-600',       glow: 'rgba(148,163,184,0.4)' },
  { name: 'Romantic',     emoji: '💕', gradient: 'from-pink-400 to-rose-500',        glow: 'rgba(244,114,182,0.4)' },
  { name: 'Thriller',     emoji: '😱', gradient: 'from-zinc-700 to-red-900',         glow: 'rgba(127,29,29,0.5)'   },
  { name: 'Intellectual', emoji: '🧠', gradient: 'from-teal-400 to-cyan-600',        glow: 'rgba(20,184,166,0.4)'  },
  { name: 'Comedy',       emoji: '😂', gradient: 'from-lime-400 to-green-500',       glow: 'rgba(132,204,22,0.4)'  },
  { name: 'Horror',       emoji: '👻', gradient: 'from-gray-900 to-purple-900',      glow: 'rgba(88,28,135,0.5)'   },
  { name: 'Action',       emoji: '💥', gradient: 'from-orange-500 to-red-600',       glow: 'rgba(249,115,22,0.4)'  },
  { name: 'Mind-bending', emoji: '🌀', gradient: 'from-violet-500 to-fuchsia-600',   glow: 'rgba(124,92,252,0.5)'  },
]

const PLATFORMS = ['Any', 'Netflix', 'Amazon Prime', 'Disney+', 'Apple TV+', 'HBO Max', 'Hulu', 'YouTube']
const FORMATS   = ['Both', 'Movies', 'Series']
const INDUSTRY_KEYS = Object.keys(INDUSTRIES)

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}

const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
}

export default function MoodSelector({ onMoodSelect }) {
  const [selectedMood, setSelectedMood] = useState(null)
  const [showModal, setShowModal]       = useState(false)
  const [industry, setIndustry]         = useState('Any')
  const [platform, setPlatform]         = useState('Any')
  const [format, setFormat]             = useState('Both')

  const handleMoodClick = (mood) => {
    setSelectedMood(mood)
    setIndustry('Any')
    setPlatform('Any')
    setFormat('Both')
    setShowModal(true)
  }

  const handleConfirm = () => {
    setShowModal(false)
    onMoodSelect(selectedMood.name, { industry, platform, format })
  }

  return (
    <section id="mood-selector" className="w-full py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y:  0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h2 className="font-syne text-3xl md:text-4xl font-bold gradient-text mb-3">
          How are you feeling right now?
        </h2>
        <p className="text-white/50 font-inter text-sm md:text-base">
          Pick your mood and we'll find the perfect watch for you ✨
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4"
      >
        {MOODS.map((mood) => (
          <motion.button
            key={mood.name}
            variants={cardVariants}
            whileHover={{ scale: 1.08, y: -6 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleMoodClick(mood)}
            id={`mood-${mood.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            className="mood-card glass-card flex flex-col items-center justify-center gap-2 py-5 px-3 rounded-2xl group"
            style={{ '--glow': mood.glow }}
          >
            <span className="text-3xl md:text-4xl select-none group-hover:scale-110 transition-transform duration-300">
              {mood.emoji}
            </span>
            <span className={`font-syne font-semibold text-xs md:text-sm text-transparent bg-clip-text bg-gradient-to-br ${mood.gradient}`}>
              {mood.name}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Preferences Modal */}
      <AnimatePresence>
        {showModal && selectedMood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(8px)', background: 'rgba(5,8,20,0.7)' }}
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="glass w-full max-w-md p-8 rounded-3xl relative overflow-y-auto"
              style={{
                border: '1px solid rgba(124,92,252,0.3)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                maxHeight: '90vh',
              }}
            >
              {/* Header */}
              <div className="text-center mb-7">
                <span className="text-5xl">{selectedMood.emoji}</span>
                <h3 className="font-syne text-2xl font-bold gradient-text mt-3">
                  {selectedMood.name} Mood
                </h3>
                <p className="text-white/50 text-sm mt-1">Set your preferences to personalize picks</p>
              </div>

              {/* INDUSTRY */}
              <div className="mb-5">
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
                  Industry / Cinema
                </label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_KEYS.map(key => {
                    const ind = INDUSTRIES[key]
                    const isActive = industry === key
                    return (
                      <button
                        key={key}
                        onClick={() => setIndustry(key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-white shadow-[0_0_12px_rgba(124,92,252,0.5)]'
                            : 'glass text-white/60 hover:text-white hover:border-brand-purple/50'
                        }`}
                        style={isActive ? {
                          background: 'linear-gradient(135deg, rgba(124,92,252,0.4), rgba(252,92,156,0.3))',
                          border: '1px solid rgba(124,92,252,0.5)',
                        } : {}}
                      >
                        <span>{ind.emoji}</span>
                        <span>{ind.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* PLATFORM */}
              <div className="mb-5">
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
                  Platform
                </label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        platform === p
                          ? 'bg-brand-pink text-white shadow-[0_0_12px_rgba(252,92,156,0.5)]'
                          : 'glass text-white/60 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORMAT */}
              <div className="mb-7">
                <label className="block text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
                  Format
                </label>
                <div className="flex gap-2">
                  {FORMATS.map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        format === f
                          ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/50 shadow-[0_0_12px_rgba(92,240,252,0.3)]'
                          : 'glass text-white/60 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  id="confirm-mood-btn"
                  onClick={handleConfirm}
                  className="btn-primary flex-1"
                >
                  Find Matches 🎬
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
