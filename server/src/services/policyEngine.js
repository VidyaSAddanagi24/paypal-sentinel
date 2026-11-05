// Deterministic financial policy engine. No AI, no network, no database.
// Input: the buyer's rules (set by the human) and the agreement (produced by the agents).
// Output: a pass/fail result with a per-rule explanation.

const toMinor = (n) => Math.round(Number(n) * 100) // compare money as integer cents
const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/s$/, '')

function check(rule, passed, expected, actual, okMsg, failMsg) {
    return { rule, passed, expected, actual, message: passed ? okMsg : failMsg }
}

export function evaluateAgreement(rules, agreement) {
    const checks = []

    // Sanity checks first: malformed AI output must never pass.
    const amountValid = Number.isFinite(Number(agreement.amount)) && Number(agreement.amount) > 0
    const daysValid = Number.isInteger(agreement.deliveryDays) && agreement.deliveryDays >= 0
    const qtyValid = Number.isInteger(agreement.quantity) && agreement.quantity > 0

    checks.push(check('amount_valid', amountValid, 'positive number', agreement.amount,
        'Amount is a valid positive number.', 'Amount is missing or invalid.'))
    checks.push(check('delivery_valid', daysValid, 'whole number of days >= 0', agreement.deliveryDays,
        'Delivery time is valid.', 'Delivery time is missing or invalid.'))
    checks.push(check('quantity_valid', qtyValid, 'positive integer', agreement.quantity,
        'Quantity is valid.', 'Quantity is missing or invalid.'))
    checks.push(check('seller_present', Boolean(agreement.sellerId), 'seller identity', agreement.sellerId,
        'Seller identity is present.', 'Seller identity is missing.'))

    // Business rules.
    checks.push(check('budget', amountValid && toMinor(agreement.amount) <= toMinor(rules.maxBudget),
        `<= ${rules.maxBudget}`, agreement.amount,
        `Amount ${agreement.amount} is within the budget of ${rules.maxBudget}.`,
        `Amount ${agreement.amount} exceeds the budget of ${rules.maxBudget}.`))

    checks.push(check('currency', agreement.currency === rules.currency,
        rules.currency, agreement.currency,
        `Currency matches (${rules.currency}).`,
        `Currency ${agreement.currency} does not match required ${rules.currency}.`))

    checks.push(check('delivery', daysValid && agreement.deliveryDays <= rules.maxDeliveryDays,
        `<= ${rules.maxDeliveryDays} days`, agreement.deliveryDays,
        `Delivery in ${agreement.deliveryDays} days meets the ${rules.maxDeliveryDays}-day limit.`,
        `Delivery in ${agreement.deliveryDays} days exceeds the ${rules.maxDeliveryDays}-day limit.`))

    checks.push(check('product', norm(agreement.product) === norm(rules.product),
        rules.product, agreement.product,
        'Product matches the request.', `Product "${agreement.product}" does not match "${rules.product}".`))

    checks.push(check('quantity', agreement.quantity === rules.quantity,
        rules.quantity, agreement.quantity,
        'Quantity matches the request.', `Quantity ${agreement.quantity} does not match requested ${rules.quantity}.`))

    const failed = checks.filter((c) => !c.passed)
    return {
        allowed: failed.length === 0,
        checks,
        reasons: failed.map((c) => c.message),
    }
}