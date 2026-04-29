import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { streamChatMessage } from '../lib/gemini'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 max-w-[80%]">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
        style={{ background: 'linear-gradient(135deg,#7c5cfc,#fc5c9c)' }}>
        🤖
      </div>
      <div className="chat-bubble-ai px-4 py-3 flex items-center gap-1.5">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  )
}

function ChatBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} max-w-[90%] ${isUser ? 'self-end' : 'self-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
          style={{ background: 'linear-gradient(135deg,#7c5cfc,#fc5c9c)' }}>
          🤖
        </div>
      )}
      <div
        className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${isUser ? 'chat-bubble-user text-white max-w-[240px]' : 'chat-bubble-ai text-white/85 max-w-[320px]'}`}
        style={{ maxWidth: 'min(320px, 85vw)' }}
      >
        {msg.content}
      </div>
    </motion.div>
  )
}

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hey there! 👋 I'm MoodFlix AI — your personal entertainment bestie!\n\nTell me how you're feeling right now, or just describe the kind of vibe you're in the mood for, and I'll find the perfect movie or series for you! 🎬✨\n\nWhat's your mood today?"
}

export default function Chatbot({ currentMood }) {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  // Pre-fill mood context when mood changes
  useEffect(() => {
    if (currentMood && open) {
      const moodMsg = `I'm feeling ${currentMood} right now!`
      setInput(moodMsg)
      // Small delay to ensure the drawer is rendered
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [currentMood, open])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setError(null)
    setInput('')

    const userMsg = { role: 'user', content: text }
    const updatedHistory = [...messages, userMsg]
    // Add empty assistant bubble immediately to prevent TypingIndicator flicker
    setMessages([...updatedHistory, { role: 'assistant', content: '', streaming: true }])
    setLoading(true)

    // Build history for API (exclude welcome message)
    const apiHistory = updatedHistory
      .filter(m => m !== WELCOME_MESSAGE)
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

    try {
      let streamedText = ''
      await streamChatMessage(apiHistory, (_chunk, full) => {
        streamedText = full
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: full, streaming: true }
          return copy
        })
      })

      // Finalize (remove streaming flag)
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { role: 'assistant', content: streamedText }
        return copy
      })
    } catch (err) {
      console.error('Chat error:', err)
      setError('Oops! Could not get a response. Check your GROQ API key in .env')
      // Remove the empty streaming bubble
      setMessages(prev => prev.filter(m => !m.streaming))
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE])
    setError(null)
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            id="chatbot-open-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #7c5cfc, #fc5c9c)',
              boxShadow: '0 8px 32px rgba(124,92,252,0.5)',
              animation: 'pulse-glow 2.5s ease-in-out infinite',
            }}
            aria-label="Open AI Chatbot"
          >
            🤖
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop (mobile) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              id="chatbot-drawer"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="fixed bottom-6 right-6 z-50 flex flex-col rounded-3xl overflow-hidden"
              style={{
                width: 'min(400px, calc(100vw - 24px))',
                height: 'min(580px, calc(100vh - 100px))',
                background: 'rgba(10,15,30,0.95)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(124,92,252,0.25)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(124,92,252,0.08)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'linear-gradient(135deg,#7c5cfc,#fc5c9c)' }}
                  >
                    🤖
                  </div>
                  <div>
                    <p className="font-syne font-bold text-white text-sm">MoodFlix AI</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-green-400 text-xs">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClear}
                    title="Clear chat"
                    className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    id="chatbot-close-btn"
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <ChatBubble key={i} msg={msg} />
                ))}
                {loading && !messages[messages.length - 1]?.streaming && <TypingIndicator />}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick suggestions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2 flex gap-2 flex-wrap flex-shrink-0">
                  {['Recommend me something 🎬', 'Feeling sad 😢', 'Hidden gems?'].map(s => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-brand-purple/40 hover:bg-brand-purple/10 transition-all duration-150"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div
                className="px-3 py-3 flex-shrink-0 flex items-end gap-2"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                <textarea
                  ref={inputRef}
                  id="chat-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about movies…"
                  rows={1}
                  disabled={loading}
                  className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-all duration-200 max-h-28 overflow-y-auto"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    scrollbarWidth: 'none',
                  }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
                  }}
                  onFocus={e => e.target.style.borderColor = '#7c5cfc'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  id="chat-send-btn"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#7c5cfc,#fc5c9c)' }}
                  aria-label="Send message"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
