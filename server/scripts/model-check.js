import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const models = [process.env.GEMINI_MODEL, ...(process.env.GEMINI_FALLBACK_MODELS || '').split(',')]
    .map((s) => (s || '').trim()).filter(Boolean)

for (const model of models) {
    const t = Date.now()
    try {
        const res = await Promise.race([
            ai.models.generateContent({ model, contents: 'Reply with the word ok' }),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout 30s')), 30000)),
        ])
        console.log(model, 'OK', ((Date.now() - t) / 1000).toFixed(1) + 's', JSON.stringify(res.text).slice(0, 30))
    } catch (e) {
        console.log(model, 'FAIL', ((Date.now() - t) / 1000).toFixed(1) + 's', String(e.message).slice(0, 90))
    }
}