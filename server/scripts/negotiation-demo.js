import 'dotenv/config'
import { parseInstructions } from '../src/services/agents/buyerAgent.js'
import { runNegotiation, defaultSellerProfile } from '../src/services/agents/negotiator.js'
import { rulesSchema } from '../src/services/agents/schemas.js'
import { evaluateAgreement } from '../src/services/policyEngine.js'

const text = process.argv[2] ||
    'I want to purchase 10 laptops. My maximum budget is Rs 4,00,000. Delivery must happen within 7 days. Do not make any payment without my approval.'

const draft = await parseInstructions(text)
console.log('Parsed rules:', draft)
const rules = rulesSchema.parse({ ...draft, requiresApproval: true })
const sellerProfile = defaultSellerProfile(rules)

const result = await runNegotiation({
    rules,
    sellerProfile,
    onMessage: async (m) =>
        console.log(`[R${m.round}] ${m.role.toUpperCase()} ${m.action}${m.amount ? ' ' + m.amount : ''}: ${m.text}`),
})

console.log('\nStatus:', result.status, result.reason || '')
if (result.terms) {
    console.log('Terms:', result.terms)
    const v = evaluateAgreement(rules, result.terms)
    console.log('Policy engine:', v.allowed ? 'ALLOWED' : 'BLOCKED', v.reasons)
}