import mongoose from 'mongoose'

const authorizationSchema = new mongoose.Schema(
    {
        agreementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        snapshotHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        consumedAt: { type: Date, default: null },
        paypalOrderId: { type: String, default: null },
        paypalCaptureId: { type: String, default: null },
        status: { type: String, enum: ['ACTIVE', 'CONSUMED', 'EXPIRED', 'REVOKED'], default: 'ACTIVE' },
    },
    { timestamps: true }
)

export default mongoose.model('Authorization', authorizationSchema)