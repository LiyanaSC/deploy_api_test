const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
        const userId = decodedToken.userId;
        console.log(decodedToken.exp)

        if (req.body.userId && req.body.userId !== userId) {
            return res.status(400).json({ error: 'Invalid user ID' });
            //throw 'Invalid user ID';

        } else {
            next();
        }
    } catch {
        return res.status(400).json({ error: 'Invalid Token' });

    }
};