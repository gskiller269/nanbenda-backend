const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { token, user: { id, email, role, branch } }
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Normalize: if no @ given, treat as username -> username@example.com
        const emailToUse = email.includes('@') ? email : `${email}@example.com`;

        // Authenticate via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password,
        });

        if (authError || !authData?.user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userId = authData.user.id;

        // Fetch profile for role/branch
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, branch')
            .eq('id', userId)
            .single();

        const role = profile?.role || 'employee';
        const branch = profile?.branch || 'Andagalur Gate';

        // Sign a JWT
        const token = jwt.sign(
            { id: userId, email: emailToUse, role, branch },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            token,
            user: { id: userId, email: emailToUse, role, branch },
        });
    } catch (err) {
        console.error('[Auth] Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/auth/logout
 * Stateless JWT — just acknowledge. Client should discard the token.
 */
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
