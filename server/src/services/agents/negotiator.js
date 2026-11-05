import { buyerRespond } from './buyerAgent.js'
import { sellerRespond } from './sellerAgent.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi)
const money = (n) => Math.round(Number(n) * 100) / 100
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

// MVP seller: a simulated merchant whose prices scale from the buyer's budget.
export function defaultSellerProfile(rules) {
    return {
        sellerId: 'sim-seller-001',
        name: 'Simulated Seller Co.',
        product: rules.product,
        listPrice: Math.round(rules.maxBudget * 1.05),
        minPrice: Math.round(rules.maxBudget * 0.9375),
        deliveryDays: 5,
        currency: rules.currency,
        simulated: true,
    }
}

export async function runNegotiation({
    rules, sellerProfile, maxRounds = 6, agents = {}, pauseMs = 1500, onMessage = async () => { },
}) {
    const buyer = agents.buyerRespond ?? buyerRespond
    const seller = agents.sellerRespond ?? sellerRespond
    const transcript = []
    let roundsUsed = 0

    const record = async (entry) => { transcript.push(entry); await onMessage(entry) }
    // Agents only ever see structured offers from earlier rounds, not earlier free text.
    const view = () => transcript.map(({ round, role, action, amount, deliveryDays }) => ({ round, role, action, amount, deliveryDays }))
    const fail = (reason) => ({ status: 'NEGOTIATION_FAILED', reason, roundsUsed, transcript, terms: null })
    const agree = (amount, deliveryDays) => ({
        status: 'AGREED', reason: null, roundsUsed, transcript,
        terms: {
            product: sellerProfile.product, quantity: rules.quantity,
            sellerId: sellerProfile.sellerId, sellerName: sellerProfile.name,
            amount: money(amount), currency: sellerProfile.currency, deliveryDays,
        },
    })

    let buyerOffer = null
    let sellerOffer = null

    for (let round = 1; round <= maxRounds; round++) {
        roundsUsed = round

        // ---- Seller turn: code enforces the seller's own floor, so even the seller AI can't break it
        if (pauseMs) await sleep(pauseMs)
        const s = await seller({ profile: sellerProfile, quantity: rules.quantity, history: view(), buyerOffer, buyerText: buyerOffer?.text, round, maxRounds })

        if (s.action === 'reject') {
            await record({ round, role: 'seller', action: 'reject', amount: null, deliveryDays: null, text: s.message })
            return fail('Seller ended the negotiation.')
        }
        if (s.action === 'accept' && buyerOffer && buyerOffer.amount >= sellerProfile.minPrice) {
            await record({ round, role: 'seller', action: 'accept', amount: buyerOffer.amount, deliveryDays: sellerProfile.deliveryDays, text: s.message })
            return agree(buyerOffer.amount, sellerProfile.deliveryDays)
        }
        // An offer, or an accept below the floor (treated as an offer). Seller prices can only go down.
        const prev = sellerOffer?.amount ?? sellerProfile.listPrice
        const asked = s.action === 'offer' ? s.amount : prev
        const sAmount = money(clamp(asked, sellerProfile.minPrice, Math.min(prev, sellerProfile.listPrice)))
        const sDays = Math.max(sellerProfile.deliveryDays, Math.round(num(s.deliveryDays) ?? sellerProfile.deliveryDays))
        sellerOffer = { amount: sAmount, deliveryDays: sDays }
        await record({ round, role: 'seller', action: 'offer', amount: sAmount, deliveryDays: sDays, text: s.message })

        // ---- Buyer turn: code caps offers at the human's budget
        if (pauseMs) await sleep(pauseMs)
        const b = await buyer({ rules, history: view(), sellerOffer, sellerText: s.message, round, maxRounds })

        if (b.action === 'reject') {
            await record({ round, role: 'buyer', action: 'reject', amount: null, deliveryDays: null, text: b.message })
            return fail('Buyer walked away.')
        }
        const bAmount = b.action === 'offer'
            ? money(clamp(b.amount, Math.max(buyerOffer?.amount ?? 0, 0.01), rules.maxBudget))
            : null
        if (b.action === 'accept' || bAmount >= sellerOffer.amount) {
            await record({ round, role: 'buyer', action: 'accept', amount: sellerOffer.amount, deliveryDays: sellerOffer.deliveryDays, text: b.message })
            return agree(sellerOffer.amount, sellerOffer.deliveryDays)
        }
        buyerOffer = { amount: bAmount, text: b.message }
        await record({ round, role: 'buyer', action: 'offer', amount: bAmount, deliveryDays: Math.round(num(b.deliveryDays) ?? rules.maxDeliveryDays), text: b.message })
    }

    return fail('Round limit reached without agreement.')
}