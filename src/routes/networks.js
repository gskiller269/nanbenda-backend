const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/networks
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('network_balances')
            .select('*')
            .order('network_name', { ascending: true });
        if (error) throw error;
        const networks = data.map(n => ({
            id: n.id,
            network: n.network_name,
            commissionPercent: n.commission_percent,
            status: n.status,
            balance: n.balance,
            minRecharge: 10,
            maxRecharge: 5000,
        }));
        res.json(networks);
    } catch (err) {
        console.error('[Networks] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch networks' });
    }
});

/**
 * PUT /api/networks/:id  (admin only)
 * Body: { balance, commissionPercent, status }
 */
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { balance, commissionPercent, status } = req.body;
        const updates = {};
        if (balance != null) updates.balance = balance;
        if (commissionPercent != null) updates.commission_percent = commissionPercent;
        if (status) updates.status = status;

        const { data, error } = await supabase
            .from('network_balances')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({
            id: data.id, network: data.network_name,
            commissionPercent: data.commission_percent,
            status: data.status, balance: data.balance,
        });
    } catch (err) {
        console.error('[Networks] PUT error:', err);
        res.status(500).json({ error: 'Failed to update network' });
    }
});

module.exports = router;
