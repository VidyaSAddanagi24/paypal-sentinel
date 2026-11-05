import mongoose from 'mongoose'

const auditSchema = new mongoose.Schema(
    {
        negotiationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Negotiation', index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
        type: { type: String, required: true }, // e.g. NEGOTIATION_STARTED, POLICY_BLOCKED, DRIFT_BLOCKED
        details: mongoose.Schema.Types.Mixed,
    },
    { timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.model('AuditEvent', auditSchema)