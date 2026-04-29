import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import ThreeBackground from '../components/ThreeBackground'

const formVariants = {
  hidden:  { opacity: 0, y: 40, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const fieldVariants = {
  hidden:  { opacity: 0, x: -20 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: 0.2 + i * 0.09, duration: 0.4 } }),
}

function getPasswordStrength(password) {
  if (!password) return { label: '', color: '', width: 0 }
  let score = 0
  if (password.length >= 8)   score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { label: 'Weak',   color: '#ef4444', width: 25 }
  if (score === 2) return { label: 'Fair',   color: '#f97316', width: 50 }
  if (score === 3) return { label: 'Good',   color: '#eab308', width: 75 }
  return               { label: 'Strong', color: '#22c55e', width: 100 }
}

export default function Register() {
  const navigate = useNavigate()
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [error, setError]             = useState(null)
  const [success, setSuccess]         = useState(null)
  const [loading, setLoading]         = useState(false)

  const strength = getPasswordStrength(password)

  const validate = () => {
    if (!name.trim())    return 'Please enter your name.'
    if (!email.trim())   return 'Please enter your email.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirmPass) return 'Passwords do not match.'
    return null
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError(null)
    setLoading(true)

    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    })

    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setSuccess('Account created! Check your email to confirm, then log in. 🎉')
    }
  }

  const handleGoogleRegister = async () => {
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (err) setError(err.message)
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-dark-900 py-8">
      <ThreeBackground />

      {/* Gradient blobs */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #5cf0fc, transparent)' }} />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle, #7c5cfc, transparent)' }} />

      {/* Card */}
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div
          className="rounded-3xl p-8 md:p-10"
          style={{
            background: 'rgba(10,15,30,0.7)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(92,240,252,0.15)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #5cf0fc, #7c5cfc)', boxShadow: '0 8px 24px rgba(92,240,252,0.3)' }}
            >
              M
            </div>
            <h1 className="font-syne text-3xl font-bold gradient-text">Join MoodFlix</h1>
            <p className="text-white/40 text-sm mt-1 font-inter">Create your account and start watching</p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/20 bg-red-500/10"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 px-4 py-3 rounded-xl text-sm text-green-300 border border-green-500/20 bg-green-500/10"
            >
              ✅ {success}
              <div className="mt-2">
                <Link to="/login" className="underline text-brand-purple">Go to Login →</Link>
              </div>
            </motion.div>
          )}

          {!success && (
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {/* Name */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                <label htmlFor="reg-name" className="block text-white/60 text-xs font-semibold uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="input-glow"
                />
              </motion.div>

              {/* Email */}
              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                <label htmlFor="reg-email" className="block text-white/60 text-xs font-semibold uppercase tracking-widest mb-1.5">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-glow"
                />
              </motion.div>

              {/* Password */}
              <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                <label htmlFor="reg-password" className="block text-white/60 text-xs font-semibold uppercase tracking-widest mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input-glow pr-12"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
                {/* Strength bar */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: strength.color }}
                        animate={{ width: `${strength.width}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                <label htmlFor="reg-confirm-password" className="block text-white/60 text-xs font-semibold uppercase tracking-widest mb-1.5">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repeat password"
                  className={`input-glow ${confirmPass && confirmPass !== password ? 'border-red-500/50' : ''}`}
                />
                {confirmPass && confirmPass !== password && (
                  <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                )}
              </motion.div>

              {/* Submit */}
              <motion.button
                custom={4}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                type="submit"
                id="register-submit-btn"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : 'Create Account →'}
              </motion.button>
            </form>
          )}

          {/* Divider */}
          {!success && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google */}
              <motion.button
                custom={5} variants={fieldVariants} initial="hidden" animate="visible"
                id="google-register-btn"
                onClick={handleGoogleRegister}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-secondary w-full flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </motion.button>
            </>
          )}

          {/* Login link */}
          <motion.p
            custom={6} variants={fieldVariants} initial="hidden" animate="visible"
            className="text-center text-white/40 text-sm mt-6"
          >
            Already have an account?{' '}
            <Link to="/login" className="text-brand-purple hover:text-brand-pink transition-colors font-medium">
              Login
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}
