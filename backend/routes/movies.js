import { Router } from 'express'

const router = Router()

const TMDB_BASE = 'https://api.themoviedb.org/3'

// Helper to forward TMDB calls server-side (keeps API key off the client in prod)
async function tmdb(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`)
  url.searchParams.set('api_key', process.env.TMDB_API_KEY)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined) url.searchParams.set(k, String(v))
  })

  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text()
    throw Object.assign(new Error(`TMDB ${res.status}: ${body}`), { status: res.status })
  }
  return res.json()
}

const MOOD_GENRES = {
  Happy:        [35, 10402, 16],
  Sad:          [18, 10749],
  Angry:        [28, 53, 80],
  Anxious:      [53, 9648, 27],
  Bored:        [12, 14, 878],
  Romantic:     [10749, 35, 18],
  Thriller:     [53, 80, 9648],
  Intellectual: [99, 18, 36],
  Comedy:       [35, 10751],
  Horror:       [27, 53, 9648],
  Action:       [28, 12, 10752],
  'Mind-bending': [878, 9648, 53],
}

const LANG_CODES = {
  English: 'en', Hindi: 'hi', Korean: 'ko',
  Spanish: 'es', French: 'fr',  Japanese: 'ja',
  Tamil: 'ta',   Telugu: 'te',
}

/**
 * GET /api/movies/recommendations?mood=Happy&language=English&format=Both
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { mood = 'Happy', language = 'Any', format = 'Both' } = req.query
    const genreIds  = (MOOD_GENRES[mood] || MOOD_GENRES['Happy']).join(',')
    const langCode  = LANG_CODES[language] || null
    const baseParams = {
      sort_by: 'popularity.desc',
      with_genres: genreIds,
      'vote_count.gte': 200,
      ...(langCode && { with_original_language: langCode }),
    }

    const requests = []

    if (format !== 'Series') {
      requests.push(tmdb('/discover/movie', baseParams))
    } else {
      requests.push(Promise.resolve({ results: [] }))
    }

    if (format !== 'Movies') {
      requests.push(tmdb('/discover/tv', { ...baseParams, 'vote_count.gte': 100 }))
    } else {
      requests.push(Promise.resolve({ results: [] }))
    }

    // Hidden gems — high rating, low popularity
    requests.push(tmdb('/discover/movie', {
      ...baseParams,
      'vote_count.gte': 50,
      'vote_average.gte': 7.5,
      'popularity.lte': 50,
      sort_by: 'vote_average.desc',
    }))

    // Wild cards — random top rated
    requests.push(tmdb('/movie/top_rated', { page: Math.floor(Math.random() * 5) + 1 }))

    const [movieRes, tvRes, gemRes, wildRes] = await Promise.all(requests)

    res.json({
      movies:     (movieRes.results || []).slice(0, 8),
      series:     (tvRes.results    || []).slice(0, 8),
      hiddenGems: (gemRes.results   || []).slice(0, 3),
      wildCards:  (wildRes.results  || []).sort(() => Math.random() - 0.5).slice(0, 3),
    })
  } catch (err) {
    console.error('/api/movies/recommendations error:', err)
    res.status(err.status || 500).json({ error: err.message })
  }
})

/**
 * GET /api/movies/search?query=inception
 */
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query
    if (!query) return res.status(400).json({ error: 'query param is required' })

    const [movies, tv] = await Promise.all([
      tmdb('/search/movie', { query, page: 1 }),
      tmdb('/search/tv',    { query, page: 1 }),
    ])

    res.json({
      movies: (movies.results || []).slice(0, 5),
      series: (tv.results    || []).slice(0, 5),
    })
  } catch (err) {
    console.error('/api/movies/search error:', err)
    res.status(err.status || 500).json({ error: err.message })
  }
})

/**
 * GET /api/movies/:type/:id  — type: movie | tv
 */
router.get('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'type must be movie or tv' })
    }

    const data = await tmdb(`/${type}/${id}`, { append_to_response: 'credits,videos' })
    res.json(data)
  } catch (err) {
    console.error('/api/movies/:type/:id error:', err)
    res.status(err.status || 500).json({ error: err.message })
  }
})

export default router
