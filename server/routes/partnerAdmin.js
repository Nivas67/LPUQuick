const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/adminAuth');
const { requireOwner } = require('../middleware/partnerAuth');
const partnerService = require('../services/partnerService');
const { getSupabaseClient } = require('../supabase');
const financialEngine = require('../utils/financialEngine');

// All endpoints in this router require Admin with Owner privileges
router.use(requireAdmin);
router.use(requireOwner);

/**
 * 1. OWNER DASHBOARD: PARTNERSHIP OVERVIEW (10 KPIs)
 */
router.get('/overview', async (req, res) => {
    try {
        const overview = await partnerService.getOwnerOverview();
        res.json({
            success: true,
            data: overview
        });
    } catch (err) {
        console.error('[PartnerAdmin Overview Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to generate partnership overview'
        });
    }
});

/**
 * 2. LIST ALL PARTNERS
 */
router.get('/', async (req, res) => {
    try {
        const partners = await partnerService.getAllPartners();

        // Enrich with financial summaries for each partner
        const enriched = await Promise.all(partners.map(async (p) => {
            try {
                const fin = await partnerService.getPartnerFinancialSummary(p.id);
                return {
                    ...p,
                    summary: {
                        revenue: fin.gross_revenue,
                        net_profit: fin.net_profit,
                        partner_profit_share: fin.partner_profit_share,
                        total_paid: fin.total_paid,
                        pending_payment: fin.pending_payment
                    }
                };
            } catch (e) {
                return { ...p, summary: null };
            }
        }));

        res.json({
            success: true,
            count: enriched.length,
            data: enriched
        });
    } catch (err) {
        console.error('[PartnerAdmin Get Partners Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to load partners'
        });
    }
});

/**
 * 3. CREATE NEW PARTNER
 */
router.post('/', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            partner_id,
            password,
            investment_amount,
            assigned_hostels,
            profit_sharing_percentage,
            hostel_profit_shares,
            partnership_start_date,
            status,
            transaction_reference
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Full name and email address are required'
            });
        }

        const result = await partnerService.createPartner({
            name,
            email,
            phone,
            partner_id,
            password,
            investment_amount: Number(investment_amount) || 0,
            assigned_hostels: Array.isArray(assigned_hostels) ? assigned_hostels : [],
            profit_sharing_percentage: Number(profit_sharing_percentage) || 50,
            hostel_profit_shares: hostel_profit_shares || {},
            partnership_start_date: partnership_start_date || financialEngine.getISTDateString(),
            status: status || 'ACTIVE',
            transaction_reference: transaction_reference || 'INITIAL_DEPOSIT'
        });

        // Broadcast real-time update
        try {
            const realtime = require('../realtime');
            realtime.broadcast('PARTNER_CREATED', { partner: result.partner });
        } catch (e) {}

        res.status(201).json({
            success: true,
            message: 'Partner created successfully',
            data: result.partner,
            temporaryPassword: result.temporaryPassword
        });
    } catch (err) {
        console.error('[PartnerAdmin Create Partner Error]:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to create partner'
        });
    }
});

/**
 * 4. GET SINGLE PARTNER WITH FINANCIAL DETAILS
 */
router.get('/:id', async (req, res) => {
    try {
        const partner = await partnerService.getPartnerById(req.params.id);
        if (!partner) {
            return res.status(404).json({ success: false, error: 'Partner not found' });
        }

        const summary = await partnerService.getPartnerFinancialSummary(partner.id);
        const investments = await partnerService.getInvestments(partner.id);
        const payments = await partnerService.getPayments(partner.id);

        res.json({
            success: true,
            data: {
                partner,
                financials: summary,
                investments,
                payments
            }
        });
    } catch (err) {
        console.error('[PartnerAdmin Get Single Partner Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to retrieve partner'
        });
    }
});

/**
 * 5. UPDATE PARTNER DETAILS & ASSIGNMENTS
 */
router.put('/:id', async (req, res) => {
    try {
        const updated = await partnerService.updatePartner(req.params.id, req.body);

        try {
            const realtime = require('../realtime');
            realtime.broadcast('PARTNER_UPDATED', { partner: updated });
        } catch (e) {}

        res.json({
            success: true,
            message: 'Partner details updated successfully',
            data: updated
        });
    } catch (err) {
        console.error('[PartnerAdmin Update Partner Error]:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to update partner'
        });
    }
});

/**
 * 6. RESET PARTNER PASSWORD
 */
router.post('/:id/reset-password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters long'
            });
        }

        const result = await partnerService.resetPartnerPassword(req.params.id, newPassword);
        res.json({
            success: true,
            message: result.message
        });
    } catch (err) {
        console.error('[PartnerAdmin Reset Password Error]:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to reset password'
        });
    }
});

/**
 * 7. DELETE / REMOVE PARTNER
 */
router.delete('/:id', async (req, res) => {
    try {
        const result = await partnerService.deletePartner(req.params.id);

        try {
            const realtime = require('../realtime');
            realtime.broadcast('PARTNER_DELETED', { partnerId: req.params.id });
        } catch (e) {}

        res.json({
            success: true,
            message: result.message
        });
    } catch (err) {
        console.error('[PartnerAdmin Delete Partner Error]:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to remove partner'
        });
    }
});

/**
 * 8. GET HOSTEL ASSIGNMENT MATRIX
 */
router.get('/meta/hostels-matrix', async (req, res) => {
    try {
        const supabase = getSupabaseClient();
        let campusHostels = [];
        try {
            const { data } = await supabase.from('hostels').select('id, name');
            if (Array.isArray(data)) campusHostels = data;
        } catch (e) {}

        const partners = await partnerService.getAllPartners();

        // Create mapping: hostel -> assigned partners
        const matrix = campusHostels.map(h => {
            const normH = partnerService._normalizeHostelId(h.id);
            const assignedPartners = partners.filter(p =>
                (p.assigned_hostels || []).some(ah => partnerService._normalizeHostelId(ah) === normH)
            ).map(p => ({
                id: p.id,
                name: p.name,
                partner_id: p.partner_id,
                profit_share: (p.hostel_profit_shares && p.hostel_profit_shares[normH] !== undefined)
                    ? p.hostel_profit_shares[normH]
                    : p.profit_sharing_percentage
            }));

            return {
                id: h.id,
                name: h.name,
                normalized_id: normH,
                assigned_partners: assignedPartners,
                is_assigned: assignedPartners.length > 0
            };
        });

        res.json({
            success: true,
            data: matrix
        });
    } catch (err) {
        console.error('[PartnerAdmin Hostels Matrix Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to retrieve hostel matrix'
        });
    }
});

/**
 * 9. INVESTMENT MANAGEMENT (GET & POST)
 */
router.get('/meta/investments', async (req, res) => {
    try {
        const partnerId = req.query.partner_id || null;
        const investments = await partnerService.getInvestments(partnerId);

        const totalInitial = investments
            .filter(i => i.investment_type === 'INITIAL')
            .reduce((sum, i) => sum + i.amount, 0);

        const totalAdditional = investments
            .filter(i => i.investment_type === 'ADDITIONAL')
            .reduce((sum, i) => sum + i.amount, 0);

        res.json({
            success: true,
            summary: {
                total_initial: totalInitial,
                total_additional: totalAdditional,
                total_investment: totalInitial + totalAdditional,
                count: investments.length
            },
            data: investments
        });
    } catch (err) {
        console.error('[PartnerAdmin Get Investments Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to load investments'
        });
    }
});

router.post('/meta/investments', async (req, res) => {
    try {
        const {
            partner_id,
            hostel_id,
            amount,
            investment_date,
            investment_type,
            transaction_reference,
            description
        } = req.body;

        if (!partner_id) {
            return res.status(400).json({ success: false, error: 'Partner ID is required' });
        }

        const investment = await partnerService.recordInvestment({
            partner_id,
            hostel_id,
            amount: Number(amount) || 0,
            investment_date,
            investment_type,
            transaction_reference,
            description
        });

        try {
            const realtime = require('../realtime');
            realtime.broadcast('PARTNER_INVESTMENT_RECORDED', { investment });
        } catch (e) {}

        res.status(201).json({
            success: true,
            message: 'Investment recorded successfully',
            data: investment
        });
    } catch (err) {
        console.error('[PartnerAdmin Record Investment Error]:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to record investment'
        });
    }
});

/**
 * 10. PARTNER PAYMENTS / PAYOUT MANAGEMENT
 */
router.get('/meta/payments', async (req, res) => {
    try {
        const partnerId = req.query.partner_id || null;
        const payments = await partnerService.getPayments(partnerId);

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

        res.json({
            success: true,
            summary: {
                total_paid: totalPaid,
                count: payments.length
            },
            data: payments
        });
    } catch (err) {
        console.error('[PartnerAdmin Get Payments Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to load payments'
        });
    }
});

router.post('/meta/payments', async (req, res) => {
    try {
        const {
            partner_id,
            amount,
            payment_method,
            transaction_id,
            payment_date,
            remarks
        } = req.body;

        if (!partner_id || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Partner ID and valid payment amount are required'
            });
        }

        const payment = await partnerService.recordPayment({
            partner_id,
            amount: Number(amount) || 0,
            payment_method,
            transaction_id,
            payment_date,
            remarks
        });

        try {
            const realtime = require('../realtime');
            realtime.broadcast('PARTNER_PAYMENT_RECORDED', { payment });
        } catch (e) {}

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: payment
        });
    } catch (err) {
        console.error('[PartnerAdmin Record Payment Error]:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to record payment'
        });
    }
});

/**
 * 11. OPERATING EXPENSES (Hostel / Period)
 */
router.get('/meta/expenses', async (req, res) => {
    try {
        const { hostel_id, start_date, end_date } = req.query;
        const expenses = await partnerService.getExpenses(hostel_id, start_date, end_date);

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        res.json({
            success: true,
            summary: {
                total_expenses: totalExpenses,
                count: expenses.length
            },
            data: expenses
        });
    } catch (err) {
        console.error('[PartnerAdmin Get Expenses Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to load expenses'
        });
    }
});

router.post('/meta/expenses', async (req, res) => {
    try {
        const { hostel_id, category, amount, date, description } = req.body;

        if (!category || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Category and expense amount are required'
            });
        }

        const expense = await partnerService.recordExpense({
            hostel_id,
            category,
            amount: Number(amount) || 0,
            date,
            description
        }, req.admin?.id || 'owner');

        try {
            const realtime = require('../realtime');
            realtime.broadcast('EXPENSE_RECORDED', { expense });
        } catch (e) {}

        res.status(201).json({
            success: true,
            message: 'Operating expense recorded successfully',
            data: expense
        });
    } catch (err) {
        console.error('[PartnerAdmin Record Expense Error]:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to record expense'
        });
    }
});

router.delete('/meta/expenses/:id', async (req, res) => {
    try {
        await partnerService.deleteExpense(req.params.id);
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (err) {
        console.error('[PartnerAdmin Delete Expense Error]:', err);
        res.status(400).json({
            success: false,
            error: err.message || 'Failed to delete expense'
        });
    }
});

/**
 * 12. PROFIT MANAGEMENT & FINANCIAL REPORTS
 */
router.get('/meta/profits', async (req, res) => {
    try {
        const { start_date, end_date, partner_id, hostel_id } = req.query;

        if (partner_id) {
            const summary = await partnerService.getPartnerFinancialSummary(partner_id, {
                startDate: start_date,
                endDate: end_date
            });
            return res.json({ success: true, data: summary });
        }

        const financials = await partnerService.calculateFinancials({
            hostels: hostel_id ? [hostel_id] : null,
            startDate: start_date,
            endDate: end_date
        });

        // Compute partner profit share mapping
        const partners = await partnerService.getAllPartners();
        const partnerProfits = partners.map(p => {
            const assigned = p.assigned_hostels || [];
            let pShare = 0;
            const shares = p.hostel_profit_shares || {};
            const defPct = p.profit_sharing_percentage || 50;

            for (const h of assigned) {
                const hData = financials.hostel_breakdown[h];
                if (hData) {
                    const pct = shares[h] !== undefined ? shares[h] : defPct;
                    const hProfit = Math.max(0, hData.net_profit);
                    pShare += (hProfit * (pct / 100));
                }
            }
            return {
                partner_id: p.id,
                partner_name: p.name,
                partner_code: p.partner_id,
                assigned_hostels: assigned,
                partner_profit_share: Math.round(pShare * 100) / 100
            };
        });

        const totalPartnerShare = partnerProfits.reduce((sum, p) => sum + p.partner_profit_share, 0);
        const ownerShare = Math.max(0, Math.round((financials.net_profit - totalPartnerShare) * 100) / 100);

        res.json({
            success: true,
            period: {
                start_date: start_date || 'ALL_TIME',
                end_date: end_date || 'ALL_TIME'
            },
            financials,
            partner_profits: partnerProfits,
            total_partner_profit_share: Math.round(totalPartnerShare * 100) / 100,
            owner_profit_share: ownerShare
        });
    } catch (err) {
        console.error('[PartnerAdmin Profits Calculation Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to calculate profits'
        });
    }
});

module.exports = router;
