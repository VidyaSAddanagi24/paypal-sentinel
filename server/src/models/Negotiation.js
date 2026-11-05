import mongoose from 'mongoose'

const negotiationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        instructions: { type: String, required: true, maxlength: 2000 }, // original buyer text
        rules: {
            product: String,
            quantity: Number,
            maxBudget: Number,
            currency: String,
            maxDeliveryDays: Number,
            requiresApproval: { type: Boolean, default: true },
        },
        sellerProfile: {
            sellerId: String,
            name: String,
            product: String,
            listPrice: Number,
            minPrice: Number, // seller's private floor; never shown to the buyer agent
            deliveryDays: Number,
            currency: String,
            simulated: { type: Boolean, default: true },
        },
        status: {
            type: String,
            enum: ['DRAFT', 'NEGOTIATING', 'AGREED', 'NEGOTIATION_FAILED', 'POLICY_BLOCKED',
                'AWAITING_APPROVAL', 'APPROVED', 'PAYPAL_ORDER_CREATED', 'CAPTURED',
                'BLOCKED_DRIFT', 'EXPIRED'],
            default: 'DRAFT',
            index: true,
        },
        maxRounds: { type: Number, default: 6 },
        roundsUsed: { type: Number, default: 0 },
        agreementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement' },
    },
    { timestamps: true }
)

export default mongoose.model('Negotiation', negotiationSchema)