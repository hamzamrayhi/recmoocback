const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    jwt.verify(token, 'RecMooc4AllSecretKeyAhmedShady', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Attach decoded token data, including role, to the request object
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = verifyToken;
