const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/employees
 * Query params: ?branch=...&status=Active|Inactive
 */
router.get('/', async (req, res) => {
    try {
        let query = supabase.from('employees').select('*');
        if (req.query.branch) query = query.eq('branch', req.query.branch);
        if (req.query.status) query = query.eq('status', req.query.status);
        const { data, error } = await query.order('name', { ascending: true });
        if (error) throw error;
        const employees = data.map(e => ({
            id: e.id,
            name: e.name,
            role: e.role,
            branch: e.branch,
            phone: e.phone,
            email: e.email,
            sales: e.sales,
            joinedDate: e.joined_date,
            status: e.status,
        }));
        res.json(employees);
    } catch (err) {
        console.error('[Employees] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

/**
 * POST /api/employees  (admin only)
 * Body: { name, role, branch, phone, email, joinedDate, status }
 */
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, role, branch, phone, email, joinedDate, status } = req.body;
        if (!name || !branch) {
            return res.status(400).json({ error: 'name and branch are required' });
        }
        const { data, error } = await supabase
            .from('employees')
            .insert({
                name, role: role || 'employee', branch,
                phone: phone || '', email: email || '',
                sales: 0,
                joined_date: joinedDate || new Date().toISOString().split('T')[0],
                status: status || 'Active',
            })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({
            id: data.id, name: data.name, role: data.role, branch: data.branch,
            phone: data.phone, email: data.email, sales: data.sales,
            joinedDate: data.joined_date, status: data.status,
        });
    } catch (err) {
        console.error('[Employees] POST error:', err);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

/**
 * PUT /api/employees/:id  (admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const { name, role, branch, phone, email, joinedDate, status } = req.body;
        const { data, error } = await supabase
            .from('employees')
            .update({
                name, role, branch, phone, email,
                joined_date: joinedDate, status,
            })
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json({
            id: data.id, name: data.name, role: data.role, branch: data.branch,
            phone: data.phone, email: data.email, sales: data.sales,
            joinedDate: data.joined_date, status: data.status,
        });
    } catch (err) {
        console.error('[Employees] PUT error:', err);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

/**
 * DELETE /api/employees/:id  (admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('employees').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Employee deleted' });
    } catch (err) {
        console.error('[Employees] DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

module.exports = router;
