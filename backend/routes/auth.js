import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/**
 * GET /api/auth/user
 * Verify the JWT from Authorization header and return user info.
 */
router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    res.json({
      id:    user.id,
      email: user.email,
      name:  user.user_metadata?.full_name,
    })
  } catch (err) {
    console.error('/api/auth/user error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/auth/logout
 * Invalidate server-side session (if using SSR sessions).
 * Client should also call supabase.auth.signOut().
 */
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      await supabase.auth.admin.signOut(token)
    }
    res.json({ message: 'Logged out successfully' })
  } catch (err) {
    console.error('/api/auth/logout error:', err)
    res.status(500).json({ error: 'Logout failed' })
  }
})

export default router
