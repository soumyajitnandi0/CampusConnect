const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Email/Password Signup
exports.signup = async (req, res) => {
    try {
        const { name, email, password, role, rollNo, yearSection } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ msg: 'Please provide name, email, password, and role' });
        }

        if (!['student', 'organizer'].includes(role)) {
            return res.status(400).json({ msg: 'Role must be either "student" or "organizer"' });
        }

        // Additional validation for students
        if (role === 'student' && (!rollNo || !yearSection)) {
            return res.status(400).json({ msg: 'Students must provide rollNo and yearSection' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists with this email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
        };

        if (role === 'student') {
            userData.rollNo = rollNo;
            userData.yearSection = yearSection;
        }

        user = new User(userData);
        await user.save();

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback_secret',
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        rollNo: user.rollNo,
                        yearSection: user.yearSection,
                    },
                });
            }
        );
    } catch (err) {
        console.error('Signup Error:', err.message);
        res.status(500).json({ msg: 'Server error during signup' });
    }
};

// Email/Password Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please provide email and password' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check password (if user has a password)
        if (user.password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }
        } else {
            // User signed up with Google OAuth only
            return res.status(400).json({ msg: 'Please use Google Sign-In for this account' });
        }

        // Generate JWT token
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'fallback_secret',
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        rollNo: user.rollNo,
                        yearSection: user.yearSection,
                    },
                });
            }
        );
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ msg: 'Server error during login' });
    }
};

// Supabase OAuth Sync (with role selection)
exports.syncUser = async (req, res) => {
    try {
        // req.user contains the decoded Supabase JWT
        // Handle different token structures
        const email = req.user.email || req.user.user_email || req.user.user?.email;
        const sub = req.user.sub || req.user.id || req.user.user_id;
        const user_metadata = req.user.user_metadata || req.user.app_metadata || {};
        const { full_name, name, role } = user_metadata;
        
        if (!email) {
            return res.status(400).json({ msg: 'Email not found in token' });
        }
        
        const displayName = full_name || name || email.split('@')[0];

        let user = await User.findOne({ email });

        if (user) {
            // Update existing user role if provided and user doesn't have one
            if (req.body.role && !user.role) {
                if (!['student', 'organizer'].includes(req.body.role)) {
                    return res.status(400).json({ msg: 'Role must be "student" or "organizer"' });
                }
                user.role = req.body.role;
                // Add student-specific fields if provided
                if (req.body.role === 'student' && req.body.rollNo && req.body.yearSection) {
                    user.rollNo = req.body.rollNo;
                    user.yearSection = req.body.yearSection;
                }
                await user.save();
            }
            // If user exists but has no role, return error to prompt role selection
            if (!user.role) {
                return res.status(400).json({ msg: 'Role is required. Please select a role.' });
            }
        } else {
            // Create new user - require role in request body for new users
            if (!req.body.role || !['student', 'organizer'].includes(req.body.role)) {
                return res.status(400).json({ msg: 'Role is required for new users. Must be "student" or "organizer"' });
            }

            const userData = {
                name: displayName,
                email,
                role: req.body.role,
                googleId: sub,
            };

            // Add student-specific fields if provided
            if (req.body.role === 'student' && req.body.rollNo && req.body.yearSection) {
                userData.rollNo = req.body.rollNo;
                userData.yearSection = req.body.yearSection;
            }

            user = new User(userData);
            await user.save();
        }

        res.json({ 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                rollNo: user.rollNo, 
                yearSection: user.yearSection 
            } 
        });
    } catch (err) {
        console.error('Sync User Error:', err);
        console.error('Token payload:', req.user);
        res.status(500).json({ msg: 'Server error' });
    }
};
