const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/sales
 * Query params: ?branch=...&date=YYYY-MM-DD
 */
router.get('/', async (req, res) => {
    try {
        let query = supabase.from('daily_sales').select('*');
        if (req.query.branch) query = query.eq('branch', req.query.branch);
        if (req.query.date) query = query.eq('sale_date', req.query.date);
        const { data, error } = await query.order('sale_date', { ascending: false });
        if (error) throw error;
        const sales = data.map(s => ({
            id: s.id,
            product: s.product_name,
            code: s.product_code,
            quantity: s.quantity,
            sellingPrice: s.selling_price,
            actualPrice: s.actual_price,
            branch: s.branch,
            employee: s.employee_name,
            date: s.sale_date,
            paymentMode: s.payment_mode,
        }));
        res.json(sales);
    } catch (err) {
        console.error('[Sales] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

/**
 * POST /api/sales
 * Body: { product, code, quantity, sellingPrice, actualPrice, branch, employee, date, paymentMode }
 */
router.post('/', async (req, res) => {
    try {
        const { product, code, quantity, sellingPrice, actualPrice, branch, employee, date, paymentMode } = req.body;
        if (!product || !branch || !employee) {
            return res.status(400).json({ error: 'product, branch, and employee are required' });
        }
        const { data, error } = await supabase
            .from('daily_sales')
            .insert({
                product_name: product,
                product_code: code,
                quantity: quantity || 1,
                selling_price: sellingPrice,
                actual_price: actualPrice,
                branch,
                employee_name: employee,
                sale_date: date || new Date().toISOString().split('T')[0],
                payment_mode: paymentMode || 'Cash',
            })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({
            id: data.id, product: data.product_name, code: data.product_code,
            quantity: data.quantity, sellingPrice: data.selling_price,
            actualPrice: data.actual_price, branch: data.branch,
            employee: data.employee_name, date: data.sale_date,
            paymentMode: data.payment_mode,
        });
    } catch (err) {
        console.error('[Sales] POST error:', err);
        res.status(500).json({ error: 'Failed to create sale' });
    }
});

/**
 * DELETE /api/sales/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('daily_sales').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Sale deleted' });
    } catch (err) {
        console.error('[Sales] DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete sale' });
    }
});

module.exports = router;
