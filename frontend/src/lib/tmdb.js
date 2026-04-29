const TMDB_BASE = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'
export const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

const MOOD_GENRE_MAP = {
  Happy:          { genres: [35, 10402, 16] },
  Sad:            { genres: [18, 10749] },
  Angry:          { genres: [28, 53, 80] },
  Anxious:        { genres: [53, 9648, 27] },
  Bored:          { genres: [12, 14, 878] },
  Romantic:       { genres: [10749, 35, 18] },
  Thriller:       { genres: [53, 80, 9648] },
  Intellectual:   { genres: [99, 18, 36] },
  Comedy:         { genres: [35, 10751] },
  Horror:         { genres: [27, 53, 9648] },
  Action:         { genres: [28, 12, 10752] },
  'Mind-bending': { genres: [878, 9648, 53] },
}

const MOOD_MATCH_REASONS = {
  Happy:          'A feel-good pick guaranteed to lift your spirits ✨',
  Sad:            'The perfect cathartic watch for when you need a good cry 😢',
  Angry:          'Channel that energy — packed with intensity and grit 🔥',
  Anxious:        'Keeps you on the edge of your seat — distraction guaranteed 😰',
  Bored:          'An epic ride that will pull you right in from the first scene 🚀',
  Romantic:       'Warm, swoony, and dreamy — perfect for the heart 💕',
  Thriller:       'Twisted, gripping, and impossible to pause ⚡',
  Intellectual:   'Stimulates the mind and leaves you pondering for days 🧠',
  Comedy:         'Pure comedic gold — prepare to laugh out loud 😂',
  Horror:         'Spine-chilling and atmospheric — watch with the lights on 👻',
  Action:         'Non-stop explosive action from start to finish 💥',
  'Mind-bending': 'Reality is not what it seems — this one will mess with your head 🌀',
}

// Industry → TMDB params
export const INDUSTRIES = {
  Any:       { label: 'Any',       emoji: '🌍', lang: null, genre: null, region: null },
  Bollywood: { label: 'Bollywood', emoji: '🎬', lang: 'hi', genre: null, region: 'IN' },
  Hollywood: { label: 'Hollywood', emoji: '🌟', lang: 'en', genre: null, region: 'US' },
  Tollywood: { label: 'Tollywood', emoji: '🎭', lang: 'te', genre: null, region: 'IN' },
  Kollywood: { label: 'Kollywood', emoji: '🥁', lang: 'ta', genre: null, region: 'IN' },
  Anime:     { label: 'Anime',     emoji: '⛩️', lang: 'ja', genre: 16,   region: null },
  Animated:  { label: 'Animated',  emoji: '🎨', lang: null, genre: 16,   region: null },
  Korean:    { label: 'K-Drama',   emoji: '🇰🇷', lang: 'ko', genre: null, region: 'KR' },
}

export const LANGUAGE_CODES = {
  Any:        null,
  English:    'en',
  Hindi:      'hi',
  Korean:     'ko',
  Spanish:    'es',
  French:     'fr',
  Japanese:   'ja',
  Tamil:      'ta',
  Telugu:     'te',
  Arabic:     'ar',
  Portuguese: 'pt',
  Italian:    'it',
  German:     'de',
  Turkish:    'tr',
}

async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', API_KEY)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined) url.searchParams.set(k, v)
  })
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`TMDB error: ${res.status} ${res.statusText}`)
  return res.json()
}

function buildGenreString(genreIds, genreMap) {
  if (!genreMap) return '--'
  return genreIds.slice(0, 3).map(id => genreMap[id]).filter(Boolean).join(', ') || '--'
}

function enrichMovie(movie, genreMap, mood, type = 'movie') {
  const title = movie.title || movie.name || 'Unknown'
  const year = (movie.release_date || movie.first_air_date || '').slice(0, 4)
  return {
    id: movie.id,
    title,
    year,
    type,
    poster: movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null,
    backdrop: movie.backdrop_path ? `${TMDB_BACKDROP_BASE}${movie.backdrop_path}` : null,
    rating: movie.vote_average?.toFixed(1) ?? 'N/A',
    voteCount: movie.vote_count ?? 0,
    overview: movie.overview || 'No description available.',
    genres: buildGenreString(movie.genre_ids || [], genreMap),
    language: (movie.original_language || '').toUpperCase(),
    popularity: movie.popularity,
    moodReason: mood ? (MOOD_MATCH_REASONS[mood] || 'A great watch for your current mood 🎬') : null,
    searchUrl: `https://www.google.com/search?q=${encodeURIComponent(title + ' watch online')}`,
    trailerUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' official trailer')}`,
  }
}

let _movieGenreMap = null
let _tvGenreMap = null
async function getGenreMaps() {
  if (!_movieGenreMap || !_tvGenreMap) {
    const [mg, tg] = await Promise.all([
      tmdbFetch('/genre/movie/list').catch(() => ({ genres: [] })),
      tmdbFetch('/genre/tv/list').catch(() => ({ genres: [] })),
    ])
    _movieGenreMap = Object.fromEntries((mg.genres || []).map(g => [g.id, g.name]))
    _tvGenreMap    = Object.fromEntries((tg.genres || []).map(g => [g.id, g.name]))
  }
  return { movieGenreMap: _movieGenreMap, tvGenreMap: _tvGenreMap }
}

// Fetch multiple pages in parallel and deduplicate
async function fetchManyPages(endpoint, baseParams, pages = [1, 2, 3, 4, 5]) {
  const results = await Promise.all(
    pages.map(p => tmdbFetch(endpoint, { ...baseParams, page: p }).catch(() => ({ results: [] })))
  )
  const seen = new Set()
  return results.flatMap(r => r.results || []).filter(m => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}

export async function fetchRecommendations(mood, preferences = {}) {
  const { industry = 'Any', format = 'Both' } = preferences
  const moodData = MOOD_GENRE_MAP[mood] || MOOD_GENRE_MAP['Happy']
  const ind = INDUSTRIES[industry] || INDUSTRIES['Any']

  // Low vote threshold for regional industries so we get enough results
  const isRegional = ind.lang && ind.lang !== 'en'
  const voteMin = isRegional ? 10 : 100

  const baseMovieParams = {
    sort_by: 'popularity.desc',
    with_genres: moodData.genres.join(','),
    'vote_count.gte': voteMin,
    ...(ind.lang  && { with_original_language: ind.lang }),
    ...(ind.genre && { with_genres: ind.genre + ',' + moodData.genres.join(',') }),
    ...(ind.region && { region: ind.region }),
  }

  const baseTvParams = {
    sort_by: 'popularity.desc',
    with_genres: moodData.genres.slice(0, 2).join(','),
    'vote_count.gte': voteMin,
    ...(ind.lang  && { with_original_language: ind.lang }),
    ...(ind.region && { region: ind.region }),
  }

  // Parallel fetches: popularity sort + rating sort, multiple pages each
  const fetchMovies = format !== 'Series'
  const fetchSeries = format !== 'Movies'

  const [
    moviesPopular,
    moviesRated,
    seriesPopular,
    seriesRated,
  ] = await Promise.all([
    fetchMovies
      ? fetchManyPages('/discover/movie', { ...baseMovieParams, sort_by: 'popularity.desc' }, [1,2,3,4,5])
      : Promise.resolve([]),
    fetchMovies
      ? fetchManyPages('/discover/movie', { ...baseMovieParams, sort_by: 'vote_average.desc', 'vote_count.gte': Math.max(voteMin, 15) }, [1,2,3])
      : Promise.resolve([]),
    fetchSeries
      ? fetchManyPages('/discover/tv', { ...baseTvParams, sort_by: 'popularity.desc' }, [1,2,3,4,5])
      : Promise.resolve([]),
    fetchSeries
      ? fetchManyPages('/discover/tv', { ...baseTvParams, sort_by: 'vote_average.desc', 'vote_count.gte': Math.max(voteMin, 10) }, [1,2,3])
      : Promise.resolve([]),
  ])

  const { movieGenreMap, tvGenreMap } = await getGenreMaps()

  // Merge popular + rated, deduplicate again
  const mergeAndDedupe = (a, b) => {
    const seen = new Set()
    return [...a, ...b].filter(m => {
      if (seen.has(m.id)) return false
      seen.add(m.id)
      return true
    })
  }

  const allMovies = mergeAndDedupe(moviesPopular, moviesRated)
  const allSeries = mergeAndDedupe(seriesPopular, seriesRated)

  // Main picks — top 20
  const movies = allMovies.slice(0, 20).map(m => enrichMovie(m, movieGenreMap, mood, 'movie'))
  const series = allSeries.slice(0, 20).map(m => enrichMovie(m, tvGenreMap, mood, 'tv'))

  // Hidden gems — lower popularity, high rating (from the rated sort results)
  const gemMovies = moviesRated
    .filter(m => m.popularity < 80 && m.vote_average >= 6.5 && !movies.find(x => x.id === m.id))
    .slice(0, 2)
    .map(m => enrichMovie(m, movieGenreMap, mood, 'movie'))
  const gemSeries = seriesRated
    .filter(m => m.popularity < 50 && m.vote_average >= 7 && !series.find(x => x.id === m.id))
    .slice(0, 1)
    .map(m => enrichMovie(m, tvGenreMap, mood, 'tv'))
  const hiddenGems = [...gemMovies, ...gemSeries].slice(0, 3)

  // Wild cards — from later pages of rated movies, shuffled
  const wildPool = moviesRated.filter(m => !movies.find(x => x.id === m.id) && !hiddenGems.find(x => x.id === m.id))
  const wildCards = wildPool.sort(() => Math.random() - 0.5).slice(0, 3).map(m => enrichMovie(m, movieGenreMap, mood, 'movie'))

  return { movies, series, hiddenGems, wildCards }
}

export async function fetchByIndustry(industryKey, page = 1) {
  const industry = INDUSTRIES[industryKey]
  if (!industry || industryKey === 'Any') throw new Error('Unknown industry')
  const { movieGenreMap, tvGenreMap } = await getGenreMaps()

  const voteMin = ['hi', 'te', 'ta'].includes(industry.lang) ? 10 : 80
  const baseParams = {
    sort_by: 'popularity.desc',
    'vote_count.gte': voteMin,
    page,
    ...(industry.lang  && { with_original_language: industry.lang }),
    ...(industry.genre && { with_genres: industry.genre }),
    ...(industry.region && { region: industry.region }),
  }

  const isAnime = industryKey === 'Anime'
  const [moviesRes, tvRes] = await Promise.all([
    tmdbFetch('/discover/movie', baseParams).catch(() => ({ results: [], total_pages: 1 })),
    isAnime
      ? tmdbFetch('/discover/tv', { ...baseParams, with_genres: 16 }).catch(() => ({ results: [], total_pages: 1 }))
      : Promise.resolve({ results: [], total_pages: 1 }),
  ])

  return {
    movies: (moviesRes.results || []).map(m => enrichMovie(m, movieGenreMap, null, 'movie')),
    shows:  (tvRes.results || []).map(m => enrichMovie(m, tvGenreMap, null, 'tv')),
    totalPages: moviesRes.total_pages || 1,
  }
}

export async function searchContent(query, page = 1) {
  if (!query || query.trim().length < 2) return { movies: [], shows: [], totalPages: 0 }
  const { movieGenreMap, tvGenreMap } = await getGenreMaps()

  const [movieRes, tvRes] = await Promise.all([
    tmdbFetch('/search/movie', { query: query.trim(), page, include_adult: false }).catch(() => ({ results: [], total_pages: 0 })),
    tmdbFetch('/search/tv',    { query: query.trim(), page, include_adult: false }).catch(() => ({ results: [], total_pages: 0 })),
  ])

  return {
    movies: (movieRes.results || []).filter(m => m.poster_path).map(m => enrichMovie(m, movieGenreMap, null, 'movie')),
    shows:  (tvRes.results   || []).filter(m => m.poster_path).map(m => enrichMovie(m, tvGenreMap, null, 'tv')),
    totalPages: Math.max(movieRes.total_pages || 1, tvRes.total_pages || 1),
  }
}

export async function fetchMovieDetails(id, type = 'movie') {
  return tmdbFetch(`/${type}/${id}`, { append_to_response: 'credits,videos' })
}
