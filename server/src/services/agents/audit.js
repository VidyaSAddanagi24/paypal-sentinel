import AuditEvent from '../models/AuditEvent.js'

// Append-only: there is no update or delete function on purpose.
export async function logEvent({ negotiationId, userId, type, details = {} }) {
    return AuditEvent.create({ negotiationId, userId, type, details })
}