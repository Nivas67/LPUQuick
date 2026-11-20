const express = require('express');
const router = express.Router();
const partnerService = require('../services/partnerService');
const { generatePartnerToken, requirePartnerAuth } = require('../middleware/partnerAuth');
const { verifyPassword } = require('../services/securityService');
const financialEngine = require('../utils/financialEngine');

/**
 * 1. PARTNER LOGIN
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                code: 'MISSING_CREDENTIALS',
                error: 'Email and password are required.'
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const partner = await partnerService.getPartnerByEmail(cleanEmail, true);

        if (!partner) {
            return res.status(401).json({
                success: false,
                code: 'INVALID_CREDENTIALS',
                error: 'Invalid partner credentials.'
            });
        }

        if (partner.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                code: 'ACCOUNT_INACTIVE',
                error: 'Your partner account has been deactivated. Please contact the administrator.'
            });
        }

        // Verify password
        const passwordMatches = await verifyPassword(password, partner.password_hash);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                code: 'INVALID_CREDENTIALS',
                error: 'Invalid partner credentials.'
            });
        }

        // Issue token
        const token = generatePartnerToken(partner.id);
        const { password_hash, ...safePartner } = partner;

        res.json({
            success: true,
            message: 'Signed in successfully.',
            token,
            partner: safePartner
        });
    } catch (err) {
        console.error('[Partner Login Error]:', err);
        res.status(500).json({
            success: false,
            code: 'SERVER_ERROR',
            error: 'Authentication service temporarily unavailable.'
        });
    }
});

// All routes below require valid Partner Authentication
router.use(requirePartnerAuth);

/**
 * 2. GET PARTNER PROFILE
 */
router.get('/profile', async (req, res) => {
    res.json({
        success: true,
        partner: req.partner
    });
});

/**
 * 3. PARTNER DASHBOARD (12 KPIs strictly scoped to assigned hostels)
 */
router.get('/dashboard', async (req, res) => {
    try {
        const partner = req.partner;
        const { start_date, end_date, hostel_id } = req.query;

        // If specific hostel requested, verify partner has access
        let queryHostels = partner.assigned_hostels;
        if (hostel_id && hostel_id !== 'ALL' && hostel_id !== 'all') {
            const normHostel = partnerService._normalizeHostelId(hostel_id);
            if (!partner.canAccessHostel(normHostel)) {
                return res.status(403).json({
                    success: false,
                    code: 'FORBIDDEN_HOSTEL',
                    error: `Access denied. You do not have permission to view data for ${hostel_id}.`
                });
            }
            queryHostels = [normHostel];
        }

        // 1. Overall period summary
        const summary = await partnerService.getPartnerFinancialSummary(partner.id, {
            startDate: start_date,
            endDate: end_date
        });

        // 2. Today's metrics (IST)
        const todayIST = financialEngine.getISTDateString();
        const todayFin = await partnerService.calculateFinancials({
            hostels: queryHostels,
            startDate: todayIST,
            endDate: todayIST
        });

        // 3. This Month's metrics (IST)
        const currentYearMonth = todayIST.substring(0, 7); // YYYY-MM
        const monthStart = `${currentYearMonth}-01`;
        const monthFin = await partnerService.calculateFinancials({
            hostels: queryHostels,
            startDate: monthStart,
            endDate: todayIST
        });

        // 4. Yesterday's metrics (IST)
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayIST = financialEngine.getISTDateString(yesterdayDate);
        const yesterdayFin = await partnerService.calculateFinancials({
            hostels: queryHostels,
            startDate: yesterdayIST,
            endDate: yesterdayIST
        });

        // 5. Last 7 Days metrics
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysIST = financialEngine.getISTDateString(sevenDaysAgo);
        const weeklyFin = await partnerService.calculateFinancials({
            hostels: queryHostels,
            startDate: sevenDaysIST,
            endDate: todayIST
        });

        // 6. Filtered period metrics (if custom filter applied)
        let periodFin = summary;
        if (hostel_id && hostel_id !== 'ALL') {
            const normH = partnerService._normalizeHostelId(hostel_id);
            const hData = summary.hostel_breakdown[normH] || {};
            periodFin = {
                ...summary,
                total_orders: hData.total_orders || 0,
                completed_orders: hData.completed_orders || 0,
                cancelled_orders: hData.cancelled_orders || 0,
                gross_revenue: hData.revenue || 0,
                cash_collection: hData.cash_collection || 0,
                online_collection: hData.online_collection || 0,
                product_costs: hData.product_costs || 0,
                total_expenses: hData.total_expenses || 0,
                net_profit: hData.net_profit || 0,
                partner_profit_share: hData.partner_share || 0
            };
        }

        res.json({
            success: true,
            data: {
                partner_id: partner.id,
                partner_code: partner.partner_id,
                partner_name: partner.name,
                assigned_hostels: partner.assigned_hostels,
                active_filter: {
                    hostel_id: hostel_id || 'ALL',
                    start_date: start_date || 'ALL_TIME',
                    end_date: end_date || 'ALL_TIME'
                },
                // 12 Mandatory Partner KPI Cards:
                kpis: {
                    assigned_hostels: partner.assigned_hostels,
                    today_orders: todayFin.total_orders,
                    total_orders: periodFin.total_orders,
                    today_revenue: todayFin.gross_revenue,
                    monthly_revenue: monthFin.gross_revenue,
                    total_revenue: periodFin.gross_revenue,
                    total_expenses: periodFin.total_expenses,
                    net_profit: periodFin.net_profit,
                    partner_profit_share: periodFin.partner_profit_share,
                    total_investment: summary.total_investment,
                    total_amount_received: summary.total_paid,
                    pending_payments: summary.pending_payment
                },
                period_stats: {
                    today: todayFin,
                    yesterday: yesterdayFin,
                    weekly: weeklyFin,
                    monthly: monthFin,
                    current_view: periodFin
                },
                hostel_breakdown: summary.hostel_breakdown
            }
        });
    } catch (err) {
        console.error('[Partner Dashboard Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to load partner dashboard data'
        });
    }
});

/**
 * 4. HOSTEL-WISE DETAILED DASHBOARD & DATE FILTERS
 */
router.get('/hostel-data', async (req, res) => {
    try {
        const partner = req.partner;
        const { hostel_id, date_filter, start_date, end_date } = req.query;

        if (!hostel_id) {
            return res.status(400).json({
                success: false,
                error: 'hostel_id parameter is required'
            });
        }

        let targetHostels = [];
        if (hostel_id === 'ALL' || hostel_id === 'all') {
            targetHostels = partner.assigned_hostels;
        } else {
            const normH = partnerService._normalizeHostelId(hostel_id);
            if (!partner.canAccessHostel(normH)) {
                return res.status(403).json({
                    success: false,
                    code: 'FORBIDDEN_HOSTEL',
                    error: `Forbidden. You do not have permission to view records for hostel ${hostel_id}.`
                });
            }
            targetHostels = [normH];
        }

        // Resolve date range
        let filterStart = start_date || null;
        let filterEnd = end_date || null;

        const todayIST = financialEngine.getISTDateString();
        if (date_filter === 'today') {
            filterStart = todayIST;
            filterEnd = todayIST;
        } else if (date_filter === 'yesterday') {
            const yDate = new Date();
            yDate.setDate(yDate.getDate() - 1);
            const yIST = financialEngine.getISTDateString(yDate);
            filterStart = yIST;
            filterEnd = yIST;
        } else if (date_filter === 'last_7_days') {
            const d7 = new Date();
            d7.setDate(d7.getDate() - 7);
            filterStart = financialEngine.getISTDateString(d7);
            filterEnd = todayIST;
        } else if (date_filter === 'last_30_days') {
            const d30 = new Date();
            d30.setDate(d30.getDate() - 30);
            filterStart = financialEngine.getISTDateString(d30);
            filterEnd = todayIST;
        } else if (date_filter === 'this_month') {
            filterStart = `${todayIST.substring(0, 7)}-01`;
            filterEnd = todayIST;
        }

        const financials = await partnerService.calculateFinancials({
            hostels: targetHostels,
            startDate: filterStart,
            endDate: filterEnd
        });

        // Compute partner profit share
        let totalPartnerShare = 0;
        const hostelProfitShares = partner.hostel_profit_shares || {};
        const defaultPct = partner.profit_sharing_percentage || 50;

        for (const h of targetHostels) {
            const hData = financials.hostel_breakdown[h];
            if (hData) {
                const pct = hostelProfitShares[h] !== undefined ? hostelProfitShares[h] : defaultPct;
                const share = Math.round((Math.max(0, hData.net_profit) * (pct / 100)) * 100) / 100;
                hData.profit_sharing_percentage = pct;
                hData.partner_share = share;
                totalPartnerShare += share;
            }
        }

        res.json({
            success: true,
            filter: {
                hostel_id,
                date_filter: date_filter || 'custom',
                start_date: filterStart,
                end_date: filterEnd
            },
            data: {
                ...financials,
                partner_profit_share: Math.round(totalPartnerShare * 100) / 100,
                owner_profit_share: Math.max(0, Math.round((financials.net_profit - totalPartnerShare) * 100) / 100)
            }
        });
    } catch (err) {
        console.error('[Partner Hostel-Data Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to retrieve hostel financial data'
        });
    }
});

/**
 * 5. PARTNER INVESTMENTS LEDGER
 */
router.get('/investments', async (req, res) => {
    try {
        const investments = await partnerService.getInvestments(req.partner.id);

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
        console.error('[Partner Investments Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to retrieve investment records'
        });
    }
});

/**
 * 6. PARTNER PAYOUTS & SETTLEMENTS LEDGER
 */
router.get('/payments', async (req, res) => {
    try {
        const partner = req.partner;
        const payments = await partnerService.getPayments(partner.id);
        const summary = await partnerService.getPartnerFinancialSummary(partner.id);

        res.json({
            success: true,
            summary: {
                total_profit_earned: summary.partner_profit_share,
                total_paid: summary.total_paid,
                pending_payment: summary.pending_payment,
                count: payments.length
            },
            data: payments
        });
    } catch (err) {
        console.error('[Partner Payments Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to retrieve payment records'
        });
    }
});

/**
 * 7. PARTNER EXPORTABLE FINANCIAL STATEMENT
 */
router.get('/reports', async (req, res) => {
    try {
        const partner = req.partner;
        const { start_date, end_date } = req.query;

        const summary = await partnerService.getPartnerFinancialSummary(partner.id, {
            startDate: start_date,
            endDate: end_date
        });

        const investments = await partnerService.getInvestments(partner.id);
        const payments = await partnerService.getPayments(partner.id);

        res.json({
            success: true,
            partner: {
                id: partner.id,
                partner_id: partner.partner_id,
                name: partner.name,
                email: partner.email,
                phone: partner.phone,
                assigned_hostels: partner.assigned_hostels,
                profit_sharing_percentage: partner.profit_sharing_percentage
            },
            period: {
                start_date: start_date || 'ALL_TIME',
                end_date: end_date || 'ALL_TIME'
            },
            statement: summary,
            investments,
            payments
        });
    } catch (err) {
        console.error('[Partner Reports Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Failed to generate financial report'
        });
    }
});

module.exports = router;
