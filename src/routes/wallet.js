const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

/**
 * GET /api/wallet/transactions
 */
router.get('/transactions', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[Wallet] GET transactions error:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

/**
 * POST /api/wallet/transactions
 */
router.post('/transactions', async (req, res) => {
    try {
        let { customerName, mobile, provider, type, amount, commission, branch, description } = req.body;

        // Validation
        if (!customerName) return res.status(400).json({ success: false, error: 'Customer name is required' });
        if (!amount || isNaN(Number(amount))) return res.status(400).json({ success: false, error: 'Valid amount is required' });

        // Normalize input to satisfy DB constraints for text fields
        const normalizeProvider = (p) => {
            const low = (p || '').toLowerCase();
            if (low.includes('paytm')) return 'Paytm';
            if (low.includes('phone') || low.includes('pe')) return 'PhonePe';
            if (low.includes('google') || low.includes('gpay')) return 'Google Pay';
            if (low.includes('amazon')) return 'Amazon Pay';
            if (low.includes('free')) return 'Freecharge';
            if (low.includes('mobi')) return 'MobiKwik';
            return 'Paytm';
        };

        const normalizeType = (t) => {
            const low = (t || '').toLowerCase();
            if (low.includes('load')) return 'Load Money';
            if (low.includes('cash') || low.includes('out')) return 'Cash Out';
            if (low.includes('trans')) return 'Transfer';
            if (low.includes('bill')) return 'Bill Payment';
            if (low.includes('merch') || low.includes('paytm')) return 'Merchant Payment';
            // Default to 'Transfer' — never fall back to 'Load Money' (an IN type) for WalletOut
            return t || 'Transfer';
        };

        const finalBranch = branch || req.user?.branch || 'Andagalur Gate';

        const { data, error } = await supabase
            .from('wallet_transactions')
            .insert({
                customer_name: customerName.trim(),
                mobile: mobile || 'N/A',
                description: description || '',
                provider: normalizeProvider(provider),
                type: normalizeType(type),
                amount: Number(amount),
                commission: Number(commission || 0),
                branch: finalBranch,
                employee_name: req.user?.name || req.user?.email?.split('@')[0] || 'System',
                status: 'Success'
            })
            .select()
            .single();

        if (error) {
            console.error('[Wallet] Supabase insertion error details:', JSON.stringify(error, null, 2));
            return res.status(500).json({ 
                success: false,
                error: 'Database error',
                details: error.message,
                code: error.code
            });
        }
        
        res.status(201).json({ success: true, data: data || req.body });
    } catch (err) {
        console.error('[Wallet] POST transaction critical error:', err);
        res.status(500).json({ 
            success: false,
            error: 'Internal error',
            details: err.message
        });
    }
});

/**
 * PUT /api/wallet/transactions/:id
 */
router.put('/transactions/:id', async (req, res) => {
    try {
        let { customerName, mobile, amount, commission, provider, type, description, branch } = req.body;

        const normalizeProvider = (p) => {
            const low = (p || '').toLowerCase();
            if (low.includes('paytm')) return 'Paytm';
            if (low.includes('phone') || low.includes('pe')) return 'PhonePe';
            if (low.includes('google') || low.includes('gpay')) return 'Google Pay';
            if (low.includes('amazon')) return 'Amazon Pay';
            if (low.includes('free')) return 'Freecharge';
            if (low.includes('mobi')) return 'MobiKwik';
            return 'Paytm';
        };

        const normalizeType = (t) => {
            const low = (t || '').toLowerCase();
            if (low.includes('load')) return 'Load Money';
            if (low.includes('cash') || low.includes('out')) return 'Cash Out';
            if (low.includes('trans')) return 'Transfer';
            if (low.includes('bill')) return 'Bill Payment';
            if (low.includes('merch') || low.includes('paytm')) return 'Merchant Payment';
            return t || 'Transfer';
        };

        const updateData = {
            customer_name: customerName,
            mobile: mobile || 'N/A',
            description: description || '',
            amount: amount ? Number(amount) : undefined,
            commission: commission ? Number(commission) : undefined,
            provider: provider ? normalizeProvider(provider) : undefined,
            type: type ? normalizeType(type) : undefined,
        };

        if (branch) updateData.branch = branch;

        const { data, error } = await supabase
            .from('wallet_transactions')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            console.error('[Wallet] Supabase update error:', error);
            return res.status(500).json({ error: error.message || 'Failed to update transaction' });
        }
        res.json(data);
    } catch (err) {
        console.error('[Wallet] PUT transaction critical error:', err);
        res.status(500).json({ error: 'Internal server error while updating transaction' });
    }
});

/**
 * DELETE /api/wallet/transactions/:id
 */
router.delete('/transactions/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('wallet_transactions')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error('[Wallet] DELETE transaction error:', err);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

/**
 * GET /api/wallet/balances
 */
router.get('/balances', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('wallet_balances')
            .select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[Wallet] GET balances error:', err);
        res.status(500).json({ error: 'Failed to fetch balances' });
    }
});

/**
 * PUT /api/wallet/balances/:provider
 */
router.put('/balances/:provider', async (req, res) => {
    try {
        const { balance } = req.body;
        const { data, error } = await supabase
            .from('wallet_balances')
            .update({
                balance,
                last_updated: new Date().toISOString()
            })
            .eq('provider', req.params.provider)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error('[Wallet] PUT balance error:', err);
        res.status(500).json({ error: 'Failed to update balance' });
    }
});

module.exports = router;
