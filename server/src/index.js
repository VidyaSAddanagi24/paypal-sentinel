import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDB } from './config/db.js'
import Negotiation from './models/Negotiation.js'
import { logEvent } from './services/audit.js'
import authRoutes from './routes/auth.js'
import negotiationRoutes from './routes/negotiations.js'
import paymentRoutes from './routes/payments.js'

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing in .env')
    process.exit(1)
}

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'paypal-sentinel-server' })
})
app.use('/api/auth', authRoutes)
app.use('/api/negotiations', negotiationRoutes)
app.use('/api/payments', paymentRoutes)

app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => {
    console.error(err)
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' })
})

// A negotiation still marked NEGOTIATING at startup was killed by a restart. Mark it, with a reason.
async function recoverInterrupted() {
    const stuck = await Negotiation.find({ status: 'NEGOTIATING' })
    for (const n of stuck) {
        await Negotiation.updateOne({ _id: n._id }, { status: 'NEGOTIATION_FAILED' })
        await logEvent({
            negotiationId: n._id, userId: n.userId, type: 'NEGOTIATION_INTERRUPTED',
            details: { reason: 'The server restarted during the negotiation' },
        })
    }
    if (stuck.length) console.log(`Marked ${stuck.length} interrupted negotiation(s) as failed`)
}

const port = process.env.PORT || 5000
connectDB()
    .then(recoverInterrupted)
    .then(() => app.listen(port, () => console.log(`Server running on port ${port}`)))
    .catch((err) => {
        console.error('Startup failed:', err.message)
        process.exit(1)
    })