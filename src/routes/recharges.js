const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/recharges
 * Query params: ?branch=...&status=Success|Pending|Failed
 */
router.get('/', async (req, res) => {
    try {
        let query = supabase.from('recharges').select('*');
        if (req.query.branch) query = query.eq('branch', req.query.branch);
        if (req.query.status) query = query.eq('status', req.query.status);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        const recharges = data.map(r => ({
            id: r.id,
            mobile: r.mobile,
            customerName: r.customer_name,
            network: r.network,
            plan: r.plan,
            amount: r.amount,
            cost: r.cost,
            branch: r.branch,
            employee: r.employee,
            date: r.created_at,
            status: r.status,
        }));
        res.json(recharges);
    } catch (err) {
        console.error('[Recharges] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch recharges' });
    }
});

/**
 * POST /api/recharges
 * Body: { mobile, customerName, network, plan, amount, cost, branch, employee, status }
 */
router.post('/', async (req, res) => {
    try {
        const { mobile, customerName, network, plan, amount, cost, branch, employee, status } = req.body;
        if (!mobile || !network || !branch || !employee) {
            return res.status(400).json({ error: 'mobile, network, branch, employee are required' });
        }
        const { data, error } = await supabase
            .from('recharges')
            .insert({
                mobile,
                customer_name: customerName,
                network,
                plan,
                amount,
                cost: cost || 0,
                branch,
                employee,
                status: status || 'Pending',
            })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({
            id: data.id, mobile: data.mobile, customerName: data.customer_name,
            network: data.network, plan: data.plan, amount: data.amount,
            cost: data.cost, branch: data.branch, employee: data.employee,
            date: data.created_at, status: data.status,
        });
    } catch (err) {
        console.error('[Recharges] POST error:', err);
        res.status(500).json({ error: 'Failed to create recharge' });
    }
});

/**
 * PUT /api/recharges/:id
 * Body: { mobile, customerName, network, plan, amount, cost, status }
 */
router.put('/:id', async (req, res) => {
    try {
        const { mobile, customerName, network, plan, amount, cost, status } = req.body;
        const { data, error } = await supabase
            .from('recharges')
            .update({
                mobile,
                customer_name: customerName,
                network,
                plan,
                amount,
                cost,
                status
            })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({
            id: data.id, mobile: data.mobile, customerName: data.customer_name,
            network: data.network, plan: data.plan, amount: data.amount,
            cost: data.cost, branch: data.branch, employee: data.employee,
            date: data.created_at, status: data.status,
        });
    } catch (err) {
        console.error('[Recharges] PUT error:', err);
        res.status(500).json({ error: 'Failed to update recharge' });
    }
});

/**
 * DELETE /api/recharges/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('recharges').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Recharge deleted' });
    } catch (err) {
        console.error('[Recharges] DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete recharge' });
    }
});

module.exports = router;
