import Groq from 'groq-sdk'

// Singleton Groq client
let groqClient: Groq | null = null

export function getGroq(): Groq {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables')
    }
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return groqClient
}

// Available Groq models (free tier)
export const GROQ_MODEL = 'llama-3.3-70b-versatile' // Best free model — fast + smart
