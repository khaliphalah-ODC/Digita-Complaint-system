export const authKey = (req, res, next) => {
    const apiKey = req.headers['api_key'];
    const validApiKey = process.env.API_KEY;
    if (apiKey !== validApiKey) {
        return res.status(401).json({ error: 'Invalid API Key' });
    }
    next();
};