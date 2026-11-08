import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'

let _ai = null
function getAi() {
    if (!_ai) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is missing in .env')
        }
        _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    }
    return _ai
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Primary model first, then any fallbacks (comma-separated in GEMINI_FALLBACK_MODELS).
const modelList = () =>
    [process.env.GEMINI_MODEL, ...(process.env.GEMINI_FALLBACK_MODELS || '').split(',')]
        .map((s) => (s || '').trim())
        .filter(Boolean)

const statusOf = (err) => Number(err?.status) || 0
const isBusy = (err) =>
    [429, 500, 503].includes(statusOf(err)) ||
    /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded/i.test(String(err?.message))

// Calls Gemini and returns parsed JSON validated by a zod schema.
// Busy or missing model -> wait and switch to the next model. Bad output -> retry the same model.
export async function askJson({ system, prompt, schema, temperature = 0.7, attempts = 6 }) {
    const ai = getAi()
    const models = modelList()
    let m = 0
    let lastErr
    for (let i = 1; i <= attempts; i++) {
        const model = models[m % models.length]
        try {
            const res = await ai.models.generateContent({
                model,
                contents: prompt,
                config: { systemInstruction: system, temperature, responseMimeType: 'application/json' },
            })
            const result = schema.safeParse(JSON.parse(res.text))
            if (result.success) return result.data
            lastErr = new Error('AI output failed validation: ' + (result.error.issues[0]?.message || 'unknown'))
            console.error(`[gemini] ${model} attempt ${i}/${attempts}: ${lastErr.message}`)
        } catch (err) {
            lastErr = err
            console.error(`[gemini] ${model} attempt ${i}/${attempts}: ${statusOf(err) || ''} ${String(err?.message).slice(0, 120)}`)
            const busy = isBusy(err)
            if (busy || statusOf(err) === 404) m++ // try the next model, if there is one
            if (busy && i < attempts) {
                const wait = (statusOf(err) === 429 ? 15000 : 4000) * Math.min(i, 3)
                console.error(`[gemini] waiting ${wait / 1000}s`)
                await sleep(wait)
            }
        }
    }
    throw new Error('Gemini call failed: ' + (lastErr?.message || 'unknown error'))
}
