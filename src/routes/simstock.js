const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/simstock
 * Returns: { Airtel: 50, Jio: 30, ... }
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sim_stock')
            .select('*')
            .order('network_name', { ascending: true });
        if (error) throw error;
        const stockMap = {};
        data.forEach(item => { stockMap[item.network_name] = item.quantity || 0; });
        res.json(stockMap);
    } catch (err) {
        console.error('[SimStock] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch SIM stock' });
    }
});

/**
 * GET /api/simstock/list  — returns full rows with IDs
 */
router.get('/list', async (req, res) => {
    try {
        const { data, error } = await supabase.from('sim_stock').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch SIM stock list' });
    }
});

/**
 * PUT /api/simstock/:network  (admin only)
 * Body: { quantity }
 */
router.put('/:network', requireAdmin, async (req, res) => {
    try {
        const { network } = req.params;
        const { quantity } = req.body;
        if (quantity == null) return res.status(400).json({ error: 'quantity is required' });

        // Upsert — update if exists, insert if not
        const { data, error } = await supabase
            .from('sim_stock')
            .upsert({ network_name: network, quantity }, { onConflict: 'network_name' })
            .select()
            .single();
        if (error) throw error;
        res.json({ network: data.network_name, quantity: data.quantity });
    } catch (err) {
        console.error('[SimStock] PUT error:', err);
        res.status(500).json({ error: 'Failed to update SIM stock' });
    }
});

module.exports = router;
