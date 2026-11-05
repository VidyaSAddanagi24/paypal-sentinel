import 'dotenv/config'
import { z } from 'zod'
import { GoogleGenAI } from '@google/genai'
import { askJson } from '../src/services/agents/gemini.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
console.log('Models available to your key:')
for await (const m of await ai.models.list()) {
    if (m.name?.includes('flash')) console.log(' ', m.name.replace('models/', ''))
}

console.log('\nTesting GEMINI_MODEL =', process.env.GEMINI_MODEL)
const out = await askJson({
    system: 'You reply only with JSON.',
    prompt: 'Return {"ok": true, "word": "hello"}',
    schema: z.object({ ok: z.boolean(), word: z.string() }),
})
console.log('Result:', out)