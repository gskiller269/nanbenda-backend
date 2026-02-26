const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/emis
 * Query params: ?status=Active|Completed|Overdue
 */
router.get('/', async (req, res) => {
    try {
        let query = supabase.from('emis').select('*');
        if (req.query.status) query = query.eq('status', req.query.status);
        const { data, error } = await query.order('next_due_date', { ascending: true });
        if (error) throw error;
        const emis = data.map(e => ({
            id: e.id,
            customer: e.customer_name,
            mobile: e.mobile,
            product: e.product_name,
            totalAmount: e.total_amount,
            downPayment: e.down_payment,
            emiAmount: e.emi_amount,
            tenure: e.tenure_months,
            paidMonths: e.paid_months,
            nextDue: e.next_due_date,
            status: e.status,
        }));
        res.json(emis);
    } catch (err) {
        console.error('[EMIs] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch EMIs' });
    }
});

/**
 * POST /api/emis
 * Body: { customer, mobile, product, totalAmount, downPayment, emiAmount, tenure, nextDue }
 */
router.post('/', async (req, res) => {
    try {
        const { customer, mobile, product, totalAmount, downPayment, emiAmount, tenure, nextDue } = req.body;
        if (!customer || !mobile || !product || totalAmount == null) {
            return res.status(400).json({ error: 'customer, mobile, product, totalAmount are required' });
        }
        const { data, error } = await supabase
            .from('emis')
            .insert({
                customer_name: customer,
                mobile,
                product_name: product,
                total_amount: totalAmount,
                down_payment: downPayment || 0,
                emi_amount: emiAmount,
                tenure_months: tenure || 1,
                paid_months: 0,
                next_due_date: nextDue,
                status: 'Active',
            })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({
            id: data.id, customer: data.customer_name, mobile: data.mobile,
            product: data.product_name, totalAmount: data.total_amount,
            downPayment: data.down_payment, emiAmount: data.emi_amount,
            tenure: data.tenure_months, paidMonths: data.paid_months,
            nextDue: data.next_due_date, status: data.status,
        });
    } catch (err) {
        console.error('[EMIs] POST error:', err);
        res.status(500).json({ error: 'Failed to create EMI' });
    }
});

/**
 * PUT /api/emis/:id
 * Body: { paidMonths, nextDue, status }
 */
router.put('/:id', async (req, res) => {
    try {
        const { paidMonths, nextDue, status } = req.body;
        const updates = {};
        if (paidMonths != null) updates.paid_months = paidMonths;
        if (nextDue) updates.next_due_date = nextDue;
        if (status) updates.status = status;

        const { data, error } = await supabase
            .from('emis')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({
            id: data.id, paidMonths: data.paid_months,
            nextDue: data.next_due_date, status: data.status,
        });
    } catch (err) {
        console.error('[EMIs] PUT error:', err);
        res.status(500).json({ error: 'Failed to update EMI' });
    }
});

module.exports = router;
