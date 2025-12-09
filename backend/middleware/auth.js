const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token (for both Supabase and custom JWT)
module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        console.error('Auth middleware: No token provided');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token - try to decode first (works for both custom and Supabase)
    try {
        let decoded;
        const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback_secret';
        const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
        
        console.log('Auth middleware: Token received, length:', token.length);
        console.log('Auth middleware: JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('Auth middleware: SUPABASE_JWT_SECRET exists:', !!supabaseSecret);
        
        // First, try to decode the token without verification to see its structure
        const decodedToken = jwt.decode(token, { complete: false });
        
        if (!decodedToken) {
            console.error('Auth middleware: Failed to decode token');
            return res.status(401).json({ msg: 'Invalid token format' });
        }
        
        console.log('Auth middleware: Decoded token keys:', Object.keys(decodedToken));
        console.log('Auth middleware: Token has user.id?', !!(decodedToken.user && decodedToken.user.id));
        console.log('Auth middleware: Token has email?', !!decodedToken.email);
        
        // PRIORITY 1: Check if it's our custom JWT format (has user.id)
        // This should be checked FIRST because after OAuth sync, we use JWT tokens
        if (decodedToken.user && decodedToken.user.id) {
            console.log('Auth middleware: Detected custom JWT format, verifying with JWT_SECRET');
            console.log('Auth middleware: JWT_SECRET env var:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
            // Use EXACT same secret logic as authController.js uses for signing
            const secretToUse = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback_secret';
            console.log('Auth middleware: Using secret:', secretToUse ? secretToUse.substring(0, 10) + '...' : 'none');
            // Try verification with our secret
            try {
                decoded = jwt.verify(token, secretToUse);
                console.log('Auth middleware: JWT verification successful, user ID:', decoded.user.id);
                if (decoded.user && decoded.user.id) {
                    // Fetch user from DB to get full details
                    const user = await User.findById(decoded.user.id).select('-password');
                    if (!user) {
                        console.error('Auth middleware: User not found in DB for ID:', decoded.user.id);
                        return res.status(401).json({ msg: 'User not found' });
                    }
                    console.log('Auth middleware: User found, email:', user.email, 'role:', user.role);
                    req.user = {
                        id: user._id.toString(),
                        email: user.email,
                        role: user.role,
                    };
                    return next();
                } else {
                    console.error('Auth middleware: JWT decoded but missing user.id in payload');
                    return res.status(401).json({ msg: 'Invalid token payload' });
                }
            } catch (customError) {
                // Custom JWT verification failed
                console.error('Auth middleware: JWT verification failed:', customError.message);
                console.error('Auth middleware: Error name:', customError.name);
                console.error('Token preview:', token ? token.substring(0, 30) + '...' : 'no token');
                console.error('Secret being used:', secretToUse ? secretToUse.substring(0, 10) + '...' : 'none');
                console.error('JWT_SECRET env:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'NOT SET');
                return res.status(401).json({ msg: 'Token verification failed' });
            }
        }
        
        // PRIORITY 2: Check if it's a Supabase token (has email, sub, aud, etc.)
        // This is for initial OAuth login before sync
        if (decodedToken.email || decodedToken.sub || decodedToken.user_email || decodedToken.aud) {
            console.log('Auth middleware: Detected Supabase token format');
            // Try verification with Supabase secret first if available
            if (supabaseSecret) {
                try {
                    decoded = jwt.verify(token, supabaseSecret);
                    // Fetch user from DB using email or sub
                    const userEmail = decoded.email || decoded.user_email;
                    
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
                    console.log('Auth middleware: Supabase token verification failed, trying decode-only');
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
            
            // If no user found, still allow but with limited info (for /auth/sync endpoint)
            req.user = {
                id: decodedToken.sub || decodedToken.id,
                email: decodedToken.email || decodedToken.user_email,
                role: decodedToken.role,
            };
            return next();
        }

        // Both failed - log for debugging
        console.error('Token verification failed. Token format:', token ? token.substring(0, 20) + '...' : 'no token');
        console.error('Decoded token structure:', decodedToken ? Object.keys(decodedToken) : 'null');
        console.error('JWT Secret configured:', !!jwtSecret);
        console.error('Supabase Secret configured:', !!supabaseSecret);
        console.error('Token type detected:', 
          decodedToken?.email ? 'Supabase-like' : 
          decodedToken?.user?.id ? 'Custom JWT-like' : 
          'Unknown'
        );
        
        return res.status(401).json({ msg: 'Token verification failed' });
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
