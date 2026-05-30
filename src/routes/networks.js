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
 * PUT /api/networks/:id
 * Body: { balance, commissionPercent, status }
 */
router.put('/:id', async (req, res) => {
    try {
        const rawId = req.params.id;
        const decodedId = decodeURIComponent(rawId);
        const { balance, commissionPercent, status } = req.body;

        console.log(`[Networks] PUT request for ID/Name: "${decodedId}"`, { balance, commissionPercent });

        const updates = {};
        if (balance != null) updates.balance = balance;
        if (commissionPercent != null) updates.commission_percent = commissionPercent;
        if (status) updates.status = status;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No update data provided' });
        }

        // Handle both numeric ID and network name for identification
        let query = supabase.from('network_balances').update(updates);

        if (!isNaN(decodedId) && decodedId.trim() !== "") {
            query = query.eq('id', decodedId);
        } else {
            // Case-insensitive mapping for common networks
            const normalizedName = decodedId.trim();
            query = query.ilike('network_name', normalizedName);
        }

        const { data, error } = await query.select(); // Get all matches first to avoid .single() error if 0 rows

        if (error) {
            console.error('[Networks] Supabase update error:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn(`[Networks] No network found matching "${decodedId}"`);
            return res.status(404).json({ error: `Network "${decodedId}" not found` });
        }

        const updatedRow = data[0];
        console.log(`[Networks] Success: Updated ${updatedRow.network_name}`);

        res.json({
            id: updatedRow.id,
            network: updatedRow.network_name,
            commissionPercent: updatedRow.commission_percent,
            status: updatedRow.status,
            balance: updatedRow.balance,
        });
    } catch (err) {
        console.error('[Networks] PUT unexpected error:', err);
        res.status(500).json({ error: 'Failed to update network balance' });
    }
});

module.exports = router;
