const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/auth');

// All product routes require authentication
router.use(authenticate);

/**
 * GET /api/products
 * Query params: ?branch=Andagalur+Gate
 */
router.get('/', async (req, res) => {
    try {
        let query = supabase.from('products').select('*');
        if (req.query.branch) {
            query = query.eq('branch', req.query.branch);
        }
        const { data, error } = await query.order('name', { ascending: true });
        if (error) throw error;
        // Map snake_case -> camelCase
        const products = data.map(p => ({
            id: p.id,
            name: p.name,
            code: p.code,
            actualPrice: p.actual_price,
            sellingPrice: p.selling_price,
            stock: p.stock,
            branch: p.branch,
        }));
        res.json(products);
    } catch (err) {
        console.error('[Products] GET error:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * POST /api/products
 * Body: { name, code, actualPrice, sellingPrice, stock, branch }
 */
router.post('/', async (req, res) => {
    try {
        const { name, code, actualPrice, sellingPrice, stock, branch } = req.body;
        if (!name || !code || actualPrice == null || sellingPrice == null || stock == null || !branch) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const { data, error } = await supabase
            .from('products')
            .insert({ name, code, actual_price: actualPrice, selling_price: sellingPrice, stock, branch })
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({
            id: data.id, name: data.name, code: data.code,
            actualPrice: data.actual_price, sellingPrice: data.selling_price,
            stock: data.stock, branch: data.branch,
        });
    } catch (err) {
        console.error('[Products] POST error:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

/**
 * PUT /api/products/:id
 * Body: { name, code, actualPrice, sellingPrice, stock, branch }
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, actualPrice, sellingPrice, stock, branch } = req.body;
        const { data, error } = await supabase
            .from('products')
            .update({ name, code, actual_price: actualPrice, selling_price: sellingPrice, stock, branch })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        res.json({
            id: data.id, name: data.name, code: data.code,
            actualPrice: data.actual_price, sellingPrice: data.selling_price,
            stock: data.stock, branch: data.branch,
        });
    } catch (err) {
        console.error('[Products] PUT error:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

/**
 * DELETE /api/products/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('products').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('[Products] DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
