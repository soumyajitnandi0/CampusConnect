const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            // User exists, update googleId if not present (linking account)
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // Create new user
            user = new User({
                name,
                email,
                googleId,
                password: '', // No password for Google users
                role: 'student', // Default role
            });
            await user.save();
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
            }
        );
    } catch (err) {
        console.error('Google Auth Error:', err.message);
        res.status(400).json({ msg: 'Google Sign-In Failed' });
    }
};
