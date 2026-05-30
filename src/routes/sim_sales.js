const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/sim_sales
 */
router.get('/', async (req, res) => {
    try {
        let query = supabase.from('sim_sales').select('*');
        if (req.query.branch) query = query.eq('branch_id', req.query.branch);
        const { data, error } = await query.order('sale_date', { ascending: false });
        if (error) throw error;
        const sales = data.map(s => ({
            id: s.id, customerName: s.customer_name, mobile: s.mobile,
            network: s.network, simType: s.sim_type, simNumber: s.sim_number,
            cost: s.cost, sellingPrice: s.selling_price, branch: s.branch_id,
            employee: s.employee_name, date: s.sale_date, status: s.status, paymentMode: s.payment_mode
        }));
        res.json(sales);
    } catch (err) {
        console.error('[SimSales] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch sim sales' });
    }
});

/**
 * POST /api/sim_sales
 */
router.post('/', async (req, res) => {
    try {
        const { customerName, mobile, network, simType, simNumber, sellingPrice, cost, branch, employee, paymentMode, status } = req.body;
        const { data, error } = await supabase
            .from('sim_sales')
            .insert({
                customer_name: customerName,
                mobile,
                network,
                sim_type: simType,
                sim_number: simNumber,
                selling_price: sellingPrice,
                cost: cost,
                branch_id: branch,
                employee_name: employee,
                payment_mode: paymentMode || 'Hand Cash',
                status: status || 'Activated'
            })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({
            id: data.id, customerName: data.customer_name, mobile: data.mobile,
            network: data.network, simType: data.sim_type, simNumber: data.sim_number,
            cost: data.cost, sellingPrice: data.selling_price, branch: data.branch_id,
            employee: data.employee_name, date: data.sale_date, status: data.status, paymentMode: data.payment_mode
        });
    } catch (err) {
        console.error('[SimSales] POST error:', err);
        res.status(500).json({ error: 'Failed to create sim sale' });
    }
});

/**
 * PUT /api/sim_sales/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { customerName, mobile, network, simType, simNumber, sellingPrice, cost, status, paymentMode } = req.body;
        const { data, error } = await supabase
            .from('sim_sales')
            .update({
                customer_name: customerName,
                mobile,
                network,
                sim_type: simType,
                sim_number: simNumber,
                amount: sellingPrice,
                cost: cost,
                status,
                payment_mode: paymentMode
            })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({
            id: data.id, customerName: data.customer_name, mobile: data.mobile,
            network: data.network, simType: data.sim_type, simNumber: data.sim_number,
            cost: data.cost, sellingPrice: data.selling_price, branch: data.branch_id,
            employee: data.employee_name, date: data.sale_date, status: data.status, paymentMode: data.payment_mode
        });
    } catch (err) {
        console.error('[SimSales] PUT error:', err);
        res.status(500).json({ error: 'Failed to update sim sale' });
    }
});

/**
 * DELETE /api/sim_sales/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('sim_sales').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Sim sale deleted' });
    } catch (err) {
        console.error('[SimSales] DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete sim sale' });
    }
});

module.exports = router;
