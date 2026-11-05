import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import User from '../models/User.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const registerSchema = z.object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(100),
})
const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(100),
})

const sign = (user) => jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email })

router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        const passwordHash = await bcrypt.hash(password, 12)
        const user = await User.create({ name, email, passwordHash })
        res.status(201).json({ token: sign(user), user: publicUser(user) })
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Email already registered' })
        next(err)
    }
})

router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email })
        const ok = user && (await bcrypt.compare(password, user.passwordHash))
        // Same message for unknown email and wrong password, so accounts can't be probed.
        if (!ok) return res.status(401).json({ error: 'Invalid email or password' })
        res.json({ token: sign(user), user: publicUser(user) })
    } catch (err) {
        next(err)
    }
})

router.get('/me', requireAuth, (req, res) => {
    res.json({ user: publicUser(req.user) })
})

export default router