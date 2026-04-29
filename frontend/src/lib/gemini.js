/**
 * The Chatbot now communicates through the Backend API 
 * instead of calling Groq directly from the browser.
 * This is more secure and avoids browser-specific CORS/SDK issues.
 */

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

/**
 * Send a message to the backend and get a full response.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Promise<string>}
 */
export async function sendChatMessage(messages) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to get chat response')
  }

  const data = await response.json()
  return data.reply
}

/**
 * Stream a message response from the backend using Server-Sent Events (SSE).
 * @param {Array} messages
 * @param {function} onChunk - called with each text chunk (delta, fullText)
 */
export async function streamChatMessage(messages, onChunk) {
  const response = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to start chat stream')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue
      
      const dataStr = line.replace('data: ', '')
      if (dataStr === '[DONE]') break

      try {
        const { delta, error } = JSON.parse(dataStr)
        if (error) throw new Error(error)
        if (delta) {
          fullText += delta
          onChunk(delta, fullText)
        }
      } catch (e) {
        console.error('Error parsing SSE chunk:', e)
      }
    }
  }

  return fullText
}
