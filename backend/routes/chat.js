import { Router } from 'express'
import Groq from 'groq-sdk'

const router = Router()

const SYSTEM_PROMPT = `You are MoodFlix AI — the ultimate AI-powered entertainment companion.
You are friendly, warm, conversational — like a best friend who has watched everything.
Always respond in the same language the user writes in (Hindi/English/Hinglish).

Your job:
- Suggest movies and series based on mood
- Give spoiler-free summaries on request
- Answer "is this worth watching?"
- Give cast, director, similar movie details
- Handle mood changes and give fresh suggestions
- Give content warnings on request
- Suggest hidden gems and underrated picks

For every movie/series you suggest, always include:
- Name + Year + Genre + IMDb Rating
- 2-3 line spoiler-free summary (make it curiosity-inducing, never reveal ending)
- Why it matches their mood
- Platform to watch
- Google search link: https://www.google.com/search?q=MOVIE+NAME+watch+online
- YouTube trailer link: https://www.youtube.com/results?search_query=MOVIE+NAME+trailer

Summary rules:
- Never spoil endings or major twists
- Create atmosphere and curiosity
- End with a hook that makes them want to watch
- Be warm, use emojis, keep it fun

Always end your response with a follow-up question to keep conversation going.`

let groqClient = null
function getGroq() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set in .env')
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

/**
 * POST /api/chat
 * Body: { messages: [{role, content}, ...] }
 */
router.post('/', async (req, res) => {
  try {
    const { messages } = req.body
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '`messages` array is required' })
    }

    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.85,
      max_tokens: 1024,
      top_p: 1,
    })

    const reply = completion.choices[0]?.message?.content ?? 'I could not generate a response. Please try again.'
    res.json({ reply })
  } catch (err) {
    console.error('/api/chat error:', err)
    res.status(err.status || 500).json({ error: err.message || 'Chat error' })
  }
})

/**
 * POST /api/chat/stream
 * Streams response as Server-Sent Events
 */
router.post('/stream', async (req, res) => {
  try {
    const { messages } = req.body
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '`messages` array is required' })
    }

    const groq = getGroq()

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const stream = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.85,
      max_tokens: 1024,
      stream: true,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || ''
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('/api/chat/stream error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message })
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
      res.end()
    }
  }
})

export default router
