import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
    const [scheme, token] = (req.headers.authorization || '').split(' ')
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Authentication required' })
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findById(payload.sub)
        if (!user) return res.status(401).json({ error: 'Invalid token' })
        req.user = user
        next()
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' })
    }
}