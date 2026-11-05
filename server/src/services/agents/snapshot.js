import crypto from 'node:crypto'

// Fixed field order, so the same terms always produce the same hash.
const FIELDS = ['product', 'quantity', 'sellerId', 'sellerName', 'amount', 'currency', 'deliveryDays']

export function pickTerms(t) {
    return Object.fromEntries(FIELDS.map((k) => [k, t[k] ?? null]))
}

export function hashTerms(terms) {
    const canonical = JSON.stringify(FIELDS.map((k) => [k, terms[k] ?? null]))
    return crypto.createHash('sha256').update(canonical).digest('hex')
}