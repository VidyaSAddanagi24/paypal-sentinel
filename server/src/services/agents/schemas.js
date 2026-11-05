import { z } from 'zod'

// The buyer's rules. Set by the human (the AI only drafts them), never by the sellers.
export const rulesSchema = z.object({
    product: z.string().trim().min(1).max(80),
    quantity: z.number().int().positive().max(100000),
    maxBudget: z.number().positive().max(1e9),
    currency: z.string().trim().toUpperCase().length(3),
    maxDeliveryDays: z.number().int().positive().max(365),
    requiresApproval: z.boolean().default(true),
})

// What an agent may say each turn. Anything else is rejected and retried.
export const agentTurnSchema = z
    .object({
        action: z.enum(['offer', 'accept', 'reject']),
        amount: z.number().min(0).max(1e9).nullish(),
        deliveryDays: z.number().min(0).max(365).nullish(),
        message: z.string().trim().min(1).max(600),
    })
    .refine((t) => t.action !== 'offer' || (typeof t.amount === 'number' && t.amount > 0), {
        message: 'an offer needs a positive amount',
    })