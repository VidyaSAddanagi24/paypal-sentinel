// Validates req.body against a zod schema and replaces it with the cleaned data.
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid input',
            details: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        })
    }
    req.body = result.data
    next()
}