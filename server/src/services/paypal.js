// PayPal Orders v2 client. There is no fallback: if PayPal fails, this throws.
const base = () => process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com'

export class PayPalError extends Error {
    constructor(message, status, details) {
        super(message)
        this.name = 'PayPalError'
        this.status = status
        this.details = details
    }
}

let cached = { token: null, expiresAt: 0 }

async function getAccessToken() {
    if (cached.token && Date.now() < cached.expiresAt - 60000) return cached.token
    const id = process.env.PAYPAL_CLIENT_ID
    const secret = process.env.PAYPAL_CLIENT_SECRET
    if (!id || !secret) throw new PayPalError('PayPal credentials are not configured', 500)
    const res = await fetch(`${base()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new PayPalError('PayPal authentication failed', res.status, data)
    cached = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
    return cached.token
}

async function request(path, { method = 'GET', body, requestId } = {}) {
    const token = await getAccessToken()
    const res = await fetch(base() + path, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        throw new PayPalError(data?.details?.[0]?.issue || data?.message || 'PayPal request failed', res.status, data)
    }
    return data
}

const toValue = (n) => (Math.round(Number(n) * 100) / 100).toFixed(2)

// Builds the order from the buyer-approved terms only. Currency and amount are never altered.
export async function createPayPalOrder({ agreementId, terms, returnUrl, cancelUrl, requestId }) {
    const order = await request('/v2/checkout/orders', {
        method: 'POST',
        requestId,
        body: {
            intent: 'CAPTURE',
            purchase_units: [{
                reference_id: terms.sellerId,
                custom_id: String(agreementId),
                description: `${terms.quantity} x ${terms.product} from ${terms.sellerName}`.slice(0, 127),
                amount: { currency_code: terms.currency, value: toValue(terms.amount) },
            }],
            payment_source: {
                paypal: {
                    experience_context: {
                        user_action: 'PAY_NOW',
                        shipping_preference: 'NO_SHIPPING',
                        return_url: returnUrl,
                        cancel_url: cancelUrl,
                    },
                },
            },
        },
    })
    const link = order.links?.find((l) => l.rel === 'payer-action') || order.links?.find((l) => l.rel === 'approve')
    return { id: order.id, status: order.status, approveUrl: link?.href || null }
}

export async function getPayPalOrder(orderId) {
    return request(`/v2/checkout/orders/${encodeURIComponent(orderId)}`)
}

export async function capturePayPalOrder(orderId, requestId) {
    const data = await request(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: 'POST', requestId })
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
    return { id: data.id, status: data.status, captureId: capture?.id || null, captureStatus: capture?.status || null }
}