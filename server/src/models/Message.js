import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
    {
        negotiationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Negotiation', required: true, index: true },
        round: { type: Number, required: true },
        role: { type: String, enum: ['buyer', 'seller', 'system'], required: true },
        text: { type: String, required: true, maxlength: 2000 },
        offer: {
            amount: Number,
            currency: String,
            quantity: Number,
            deliveryDays: Number,
            accepted: Boolean,
        },
    },
    { timestamps: true }
)

export default mongoose.model('Message', messageSchema)
