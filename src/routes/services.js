const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/auth');

// All service routes require authentication
router.use(authenticate);

/**
 * GET /api/services
 * Query params: ?branch=Andagalur+Gate
 */
router.get('/', async (req, res) => {
    try {
        let query = supabase.from('services').select('*');
        if (req.query.branch) {
            query = query.eq('branch', req.query.branch);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Map snake_case -> camelCase
        const services = data.map(s => ({
            id: s.id,
            customer: s.customer_name,
            mobile: s.mobile,
            device: s.device,
            issue: s.issue,
            status: s.status,
            cost: Number(s.cost) || 0,
            branch: s.branch,
            date: s.service_date || s.created_at,
        }));
        res.json(services);
    } catch (err) {
        console.error('[Services] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

/**
 * POST /api/services
 * Body: { customer, mobile, device, issue, status, cost, branch }
 */
router.post('/', async (req, res) => {
    try {
        const { customer, mobile, device, issue, status, cost, branch } = req.body;
        if (!customer || !mobile || !device || !issue || !status || cost == null || !branch) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const { data, error } = await supabase
            .from('services')
            .insert({
                customer_name: customer,
                mobile,
                device,
                issue,
                status,
                cost,
                branch,
                service_date: new Date().toISOString()
            })
            .select()
            .single();
        if (error) throw error;

        res.status(201).json({
            id: data.id,
            customer: data.customer_name,
            mobile: data.mobile,
            device: data.device,
            issue: data.issue,
            status: data.status,
            cost: data.cost,
            branch: data.branch,
            date: data.service_date,
        });
    } catch (err) {
        console.error('[Services] POST error:', err);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

/**
 * PUT /api/services/:id
 * Body: { customer, mobile, device, issue, status, cost }
 */
router.put('/:id', async (req, res) => {
    try {
        const { customer, mobile, device, issue, status, cost } = req.body;
        const { data, error } = await supabase
            .from('services')
            .update({
                customer_name: customer,
                mobile,
                device,
                issue,
                status,
                cost
            })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({
            id: data.id, customer: data.customer_name, mobile: data.mobile,
            device: data.device, issue: data.issue, status: data.status,
            cost: data.cost, branch: data.branch, date: data.service_date
        });
    } catch (err) {
        console.error('[Services] PUT error:', err);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

/**
 * DELETE /api/services/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('services').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Service deleted' });
    } catch (err) {
        console.error('[Services] DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

module.exports = router;
