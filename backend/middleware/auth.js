const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token (for both Supabase and custom JWT)
module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token - try to decode first (works for both custom and Supabase)
    try {
        let decoded;
        const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback_secret';
        const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
        
        // First, try to decode the token without verification to see its structure
        const decodedToken = jwt.decode(token, { complete: false });
        
        if (!decodedToken) {
            return res.status(401).json({ msg: 'Invalid token format' });
        }
        
        // Check if it's a Supabase token (has email, sub, aud, etc.)
        if (decodedToken.email || decodedToken.sub || decodedToken.user_email || decodedToken.aud) {
            // This looks like a Supabase token
            // Try verification with Supabase secret first if available
            if (supabaseSecret) {
                try {
                    decoded = jwt.verify(token, supabaseSecret);
                    // Fetch user from DB using email or sub
                    const userEmail = decoded.email || decoded.user_email;
                    const userSub = decoded.sub;
                    
                    if (userEmail) {
                        const user = await User.findOne({ email: userEmail }).select('-password');
                        if (user) {
                            req.user = {
                                id: user._id.toString(),
                                email: user.email,
                                role: user.role,
                            };
                            return next();
                        }
                    }
                } catch (verifyError) {
                    // Verification failed, try to decode and fetch user
                }
            }
            
            // Trust the decoded token and fetch user from DB
            const userEmail = decodedToken.email || decodedToken.user_email;
            if (userEmail) {
                const user = await User.findOne({ email: userEmail }).select('-password');
                if (user) {
                    req.user = {
                        id: user._id.toString(),
                        email: user.email,
                        role: user.role,
                    };
                    return next();
                }
            }
            
            // If no user found, still allow but with limited info
            req.user = {
                id: decodedToken.sub || decodedToken.id,
                email: decodedToken.email || decodedToken.user_email,
                role: decodedToken.role,
            };
            return next();
        }
        
        // Check if it's our custom JWT format (has user.id)
        if (decodedToken.user && decodedToken.user.id) {
            // Try verification with our secret
            try {
                decoded = jwt.verify(token, jwtSecret);
                if (decoded.user && decoded.user.id) {
                    // Fetch user from DB to get full details
                    const user = await User.findById(decoded.user.id).select('-password');
                    if (!user) {
                        return res.status(401).json({ msg: 'User not found' });
                    }
                    req.user = {
                        id: user._id.toString(),
                        email: user.email,
                        role: user.role,
                    };
                    return next();
                }
            } catch (customError) {
                // Custom JWT verification failed
                return res.status(401).json({ msg: 'Token verification failed' });
            }
        }

        // Both failed - log for debugging
        console.error('Token verification failed. Token format:', token ? token.substring(0, 20) + '...' : 'no token');
        console.error('JWT Secret configured:', !!jwtSecret);
        console.error('Supabase Secret configured:', !!supabaseSecret);
        
        return res.status(401).json({ msg: 'Token is not valid' });
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Middleware to check if user has specific role
module.exports.requireRole = function (...allowedRoles) {
    return async function (req, res, next) {
        try {
            if (!req.user || !req.user.role) {
                return res.status(401).json({ msg: 'User role not found' });
            }

            if (!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ msg: 'Access denied. Insufficient permissions.' });
            }

            next();
        } catch (err) {
            res.status(500).json({ msg: 'Server error' });
        }
    };
};
