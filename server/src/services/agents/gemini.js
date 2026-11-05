import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Calls Gemini and returns parsed JSON validated by a zod schema.
// Retries on rate limits (429) and on malformed or invalid output.
export async function askJson({ system, prompt, schema, temperature = 0.7, attempts = 3 }) {
    let lastErr
    for (let i = 1; i <= attempts; i++) {
        try {
            const res = await ai.models.generateContent({
                model: process.env.GEMINI_MODEL,
                contents: prompt,
                config: {
                    systemInstruction: system,
                    temperature,
                    responseMimeType: 'application/json',
                },
            })
            const parsed = JSON.parse(res.text)
            const result = schema.safeParse(parsed)
            if (result.success) return result.data
            lastErr = new Error('AI output failed validation: ' + result.error.issues[0]?.message)
        } catch (err) {
            lastErr = err
            const rateLimited = err?.status === 429 || /429|RESOURCE_EXHAUSTED/i.test(String(err?.message))
            if (rateLimited) await sleep(15000 * i) // back off, free tiers have low per-minute limits
        }
    }
    throw new Error('Gemini call failed: ' + (lastErr?.message || 'unknown error'))
}