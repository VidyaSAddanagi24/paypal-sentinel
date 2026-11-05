import mongoose from 'mongoose'

const termsSchema = new mongoose.Schema(
    {
        product: String,
        quantity: Number,
        sellerId: String,
        sellerName: String,
        amount: Number,
        currency: String,
        deliveryDays: Number,
    },
    { _id: false }
)

const agreementSchema = new mongoose.Schema(
    {
        negotiationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Negotiation', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        terms: termsSchema,
        validation: { allowed: Boolean, checks: [mongoose.Schema.Types.Mixed], reasons: [String] },
        status: { type: String, enum: ['PROPOSED', 'POLICY_BLOCKED', 'APPROVED'], default: 'PROPOSED' },
        // Written once at approval and never modified afterwards.
        snapshot: { terms: termsSchema, hash: String, approvedAt: Date },
    },
    { timestamps: true }
)

export default mongoose.model('Agreement', agreementSchema)