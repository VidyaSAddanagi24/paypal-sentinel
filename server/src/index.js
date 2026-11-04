import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'paypal-sentinel-server' })
})

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server running on port ${port}`))