import { motion } from 'framer-motion'

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='750' viewBox='0 0 500 750'%3E%3Crect width='500' height='750' fill='%230f1629'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23ffffff30' font-size='48' font-family='sans-serif'%3E🎬%3C/text%3E%3C/svg%3E"

export function MovieCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="skeleton w-full aspect-[2/3]" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-5/6 rounded" />
        <div className="flex gap-2 mt-3">
          <div className="skeleton h-8 flex-1 rounded-lg" />
          <div className="skeleton h-8 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function MovieCard({ movie, index = 0, badge = null }) {
  const {
    title, year, genres, language, rating, overview,
    moodReason, poster, searchUrl, trailerUrl, type,
  } = movie

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group"
    >
      {/* Poster */}
      <div className="relative overflow-hidden aspect-[2/3] bg-dark-700 flex-shrink-0">
        <img
          src={poster || PLACEHOLDER_IMG}
          alt={`${title} poster`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={e => { e.target.src = PLACEHOLDER_IMG }}
          loading="lazy"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />

        {/* Rating badge */}
        <div className="absolute top-3 right-3">
          <span className="rating-badge">
            ⭐ {rating}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
            type === 'tv'
              ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30'
              : 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30'
          }`}>
            {type === 'tv' ? 'Series' : 'Movie'}
          </span>
        </div>

        {/* Special badge */}
        {badge && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-gradient-to-r from-brand-pink to-brand-purple px-2 py-0.5 rounded-full text-xs font-bold text-white">
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-syne font-bold text-white text-sm md:text-base leading-tight line-clamp-2 group-hover:gradient-text transition-all">
          {title}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white/40 text-xs">{year}</span>
          {language && (
            <>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white/40 text-xs uppercase">{language}</span>
            </>
          )}
          {genres && (
            <>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white/40 text-xs truncate max-w-[120px]">{genres}</span>
            </>
          )}
        </div>

        {/* Overview */}
        <p className="text-white/55 text-xs leading-relaxed line-clamp-3 flex-1">
          {overview}
        </p>

        {/* Mood reason */}
        {moodReason && (
          <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-lg px-3 py-2">
            <p className="text-brand-purple text-xs leading-snug">
              {moodReason}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-200 border border-white/10 text-white/70 hover:text-white hover:border-brand-purple/50 hover:bg-brand-purple/10"
            id={`search-${title?.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`}
          >
            🔍 Watch Online
          </a>
          <a
            href={trailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold py-2 px-3 rounded-lg transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #7c5cfc22, #fc5c9c22)', border: '1px solid rgba(252,92,156,0.3)', color: '#fc5c9c' }}
            id={`trailer-${title?.replace(/\s+/g, '-').toLowerCase().slice(0, 20)}`}
          >
            ▶ Trailer
          </a>
        </div>
      </div>
    </motion.div>
  )
}
