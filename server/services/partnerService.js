const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getSupabaseClient } = require('../supabase');
const financialEngine = require('../utils/financialEngine');
const { hashPassword } = require('./securityService');
const cache = require('../cache');

class PartnerService {
    constructor() {
        this._partnersFile = path.join(__dirname, '..', 'data', 'partners.json');
        this._investmentsFile = path.join(__dirname, '..', 'data', 'partner_investments.json');
        this._paymentsFile = path.join(__dirname, '..', 'data', 'partner_payments.json');
        this._expensesFile = path.join(__dirname, '..', 'data', 'hostel_expenses.json');

        this._partners = [];
        this._investments = [];
        this._payments = [];
        this._expenses = [];
        this._initialized = false;

        this._loadFromDisk();
    }

    _loadFromDisk() {
        try {
            if (fs.existsSync(this._partnersFile)) {
                const raw = fs.readFileSync(this._partnersFile, 'utf8');
                this._partners = JSON.parse(raw) || [];
            }
        } catch (e) {
            this._partners = [];
        }

        try {
            if (fs.existsSync(this._investmentsFile)) {
                const raw = fs.readFileSync(this._investmentsFile, 'utf8');
                this._investments = JSON.parse(raw) || [];
            }
        } catch (e) {
            this._investments = [];
        }

        try {
            if (fs.existsSync(this._paymentsFile)) {
                const raw = fs.readFileSync(this._paymentsFile, 'utf8');
                this._payments = JSON.parse(raw) || [];
            }
        } catch (e) {
            this._payments = [];
        }

        try {
            if (fs.existsSync(this._expensesFile)) {
                const raw = fs.readFileSync(this._expensesFile, 'utf8');
                this._expenses = JSON.parse(raw) || [];
            }
        } catch (e) {
            this._expenses = [];
        }
    }

    _saveToDisk() {
        if (process.env.VERCEL) return;
        try {
            const dataDir = path.join(__dirname, '..', 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

            fs.writeFileSync(this._partnersFile, JSON.stringify(this._partners, null, 2), 'utf8');
            fs.writeFileSync(this._investmentsFile, JSON.stringify(this._investments, null, 2), 'utf8');
            fs.writeFileSync(this._paymentsFile, JSON.stringify(this._payments, null, 2), 'utf8');
            fs.writeFileSync(this._expensesFile, JSON.stringify(this._expenses, null, 2), 'utf8');
        } catch (e) {
            // Read-only filesystem on Vercel serverless
        }
    }

    async init() {
        if (this._initialized) return;
        this._loadFromDisk();

        const supabase = getSupabaseClient();
        if (supabase) {
            try {
                // 1. Load Partners
                const { data: pData, error: pErr } = await supabase
                    .from('app_availability')
                    .select('message')
                    .eq('id', 'partner_registry')
                    .maybeSingle();

                if (!pErr && pData && pData.message) {
                    try {
                        const parsed = JSON.parse(pData.message);
                        if (Array.isArray(parsed)) this._partners = parsed;
                    } catch (e) {}
                } else if (!pErr && (!pData || !pData.message) && this._partners.length > 0) {
                    await this._syncToSupabase('partner_registry', this._partners);
                }

                // 2. Load Investments
                const { data: iData, error: iErr } = await supabase
                    .from('app_availability')
                    .select('message')
                    .eq('id', 'partner_investments')
                    .maybeSingle();

                if (!iErr && iData && iData.message) {
                    try {
                        const parsed = JSON.parse(iData.message);
                        if (Array.isArray(parsed)) this._investments = parsed;
                    } catch (e) {}
                } else if (!iErr && (!iData || !iData.message) && this._investments.length > 0) {
                    await this._syncToSupabase('partner_investments', this._investments);
                }

                // 3. Load Payments
                const { data: payData, error: payErr } = await supabase
                    .from('app_availability')
                    .select('message')
                    .eq('id', 'partner_payments')
                    .maybeSingle();

                if (!payErr && payData && payData.message) {
                    try {
                        const parsed = JSON.parse(payData.message);
                        if (Array.isArray(parsed)) this._payments = parsed;
                    } catch (e) {}
                } else if (!payErr && (!payData || !payData.message) && this._payments.length > 0) {
                    await this._syncToSupabase('partner_payments', this._payments);
                }

                // 4. Load Expenses
                const { data: expData, error: expErr } = await supabase
                    .from('app_availability')
                    .select('message')
                    .eq('id', 'hostel_expenses')
                    .maybeSingle();

                if (!expErr && expData && expData.message) {
                    try {
                        const parsed = JSON.parse(expData.message);
                        if (Array.isArray(parsed)) this._expenses = parsed;
                    } catch (e) {}
                } else if (!expErr && (!expData || !expData.message) && this._expenses.length > 0) {
                    await this._syncToSupabase('hostel_expenses', this._expenses);
                }

                this._saveToDisk();
            } catch (err) {
                console.warn('[PartnerService Supabase Init Note]:', err.message);
            }
        }

        this._initialized = true;
    }

    async _syncToSupabase(key, payload) {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        try {
            await supabase.from('app_availability').upsert([{
                id: key,
                is_locked: false,
                lock_type: 'NONE',
                message: JSON.stringify(payload),
                updated_at: new Date().toISOString()
            }]);
        } catch (e) {
            console.warn(`[PartnerService Supabase Sync Error for ${key}]:`, e.message);
        }
    }

    _normalizeHostelId(hostelId) {
        if (!hostelId || hostelId === 'all' || hostelId === 'ALL') return null;
        let str = String(hostelId).trim().toUpperCase();
        const match = str.match(/^(?:\[)?(BH|GH)[-\s]?(\d+)(?:\])?/i);
        if (match) {
            return `${match[1].toUpperCase()}-${match[2]}`;
        }
        return str.replace(/[^A-Z0-9]/g, '');
    }

    // =========================================================================
    // PARTNER CRUD OPERATIONS
    // =========================================================================

    async getAllPartners() {
        await this.init();
        return this._partners.map(p => {
            const { password_hash, ...safePartner } = p;
            return safePartner;
        });
    }

    async getPartnerById(partnerId, includePassword = false) {
        await this.init();
        const partner = this._partners.find(p => p.id === partnerId || p.partner_id === partnerId);
        if (!partner) return null;
        if (includePassword) return partner;
        const { password_hash, ...safePartner } = partner;
        return safePartner;
    }

    async getPartnerByEmail(email, includePassword = false) {
        await this.init();
        if (!email) return null;
        const cleanEmail = String(email).trim().toLowerCase();
        const partner = this._partners.find(p => String(p.email).trim().toLowerCase() === cleanEmail);
        if (!partner) return null;
        if (includePassword) return partner;
        const { password_hash, ...safePartner } = partner;
        return safePartner;
    }

    async createPartner(partnerData) {
        await this.init();

        const cleanEmail = String(partnerData.email || '').trim().toLowerCase();
        if (!cleanEmail) throw new Error('Partner email is required');

        const existing = this._partners.find(p => String(p.email).trim().toLowerCase() === cleanEmail);
        if (existing) {
            throw new Error(`A partner with email ${cleanEmail} already exists`);
        }

        const partnerCount = this._partners.length + 1;
        const partnerId = `ptr_${crypto.randomBytes(6).toString('hex')}`;
        const formattedPartnerId = partnerData.partner_id || `LPU-PTR-${String(partnerCount).padStart(3, '0')}`;

        // Normalize assigned hostels
        const rawHostels = Array.isArray(partnerData.assigned_hostels) ? partnerData.assigned_hostels : [];
        const normalizedHostels = Array.from(new Set(
            rawHostels.map(h => this._normalizeHostelId(h)).filter(Boolean)
        ));

        // Hostel-specific profit sharing map or default
        const defaultProfitShare = Math.max(0, Math.min(100, Number(partnerData.profit_sharing_percentage) || 50));
        let hostelProfitShares = {};
        if (partnerData.hostel_profit_shares && typeof partnerData.hostel_profit_shares === 'object') {
            for (const [h, pct] of Object.entries(partnerData.hostel_profit_shares)) {
                const normH = this._normalizeHostelId(h);
                if (normH) hostelProfitShares[normH] = Math.max(0, Math.min(100, Number(pct) || defaultProfitShare));
            }
        }
        for (const h of normalizedHostels) {
            if (hostelProfitShares[h] === undefined) {
                hostelProfitShares[h] = defaultProfitShare;
            }
        }

        const rawPassword = partnerData.password || crypto.randomBytes(4).toString('hex') + 'A1!';
        const passwordHash = await hashPassword(rawPassword);

        const initialInvestment = Math.max(0, Number(partnerData.investment_amount) || 0);

        const newPartner = {
            id: partnerId,
            partner_id: formattedPartnerId,
            name: String(partnerData.name || '').trim(),
            email: cleanEmail,
            phone: String(partnerData.phone || '').trim(),
            password_hash: passwordHash,
            assigned_hostels: normalizedHostels,
            profit_sharing_percentage: defaultProfitShare,
            hostel_profit_shares: hostelProfitShares,
            investment_amount: initialInvestment,
            partnership_start_date: partnerData.partnership_start_date || financialEngine.getISTDateString(),
            status: partnerData.status || 'ACTIVE',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        this._partners.push(newPartner);
        this._saveToDisk();
        await this._syncToSupabase('partner_registry', this._partners);

        // Also record initial investment if specified
        if (initialInvestment > 0) {
            await this.recordInvestment({
                partner_id: partnerId,
                partner_name: newPartner.name,
                hostel_id: normalizedHostels[0] || 'GENERAL',
                amount: initialInvestment,
                investment_date: newPartner.partnership_start_date,
                investment_type: 'INITIAL',
                transaction_reference: partnerData.transaction_reference || 'INITIAL_DEPOSIT',
                description: 'Initial partnership capital investment'
            });
        }

        // Also ensure user record exists in Supabase users table with role 'partner'
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.from('users').upsert([{
                    id: partnerId,
                    email: cleanEmail,
                    name: newPartner.name,
                    phone: newPartner.phone,
                    role: 'partner',
                    account_status: newPartner.status,
                    dob: JSON.stringify({
                        roles: ['partner'],
                        partner_id: formattedPartnerId,
                        assigned_hostels: normalizedHostels,
                        profit_sharing_percentage: defaultProfitShare,
                        hostel_profit_shares: hostelProfitShares,
                        partnership_start_date: newPartner.partnership_start_date
                    }),
                    created_at: newPartner.created_at
                }]);
            }
        } catch (uErr) {
            console.warn('[PartnerService sync to users table note]:', uErr.message);
        }

        const { password_hash, ...safePartner } = newPartner;
        return { partner: safePartner, temporaryPassword: partnerData.password ? undefined : rawPassword };
    }

    async updatePartner(partnerId, updateData) {
        await this.init();
        const index = this._partners.findIndex(p => p.id === partnerId || p.partner_id === partnerId);
        if (index === -1) throw new Error('Partner not found');

        const existing = this._partners[index];

        if (updateData.name !== undefined) existing.name = String(updateData.name).trim();
        if (updateData.phone !== undefined) existing.phone = String(updateData.phone).trim();
        if (updateData.status !== undefined) existing.status = updateData.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
        if (updateData.partnership_start_date !== undefined) existing.partnership_start_date = updateData.partnership_start_date;

        if (updateData.profit_sharing_percentage !== undefined) {
            existing.profit_sharing_percentage = Math.max(0, Math.min(100, Number(updateData.profit_sharing_percentage) || 50));
        }

        if (Array.isArray(updateData.assigned_hostels)) {
            existing.assigned_hostels = Array.from(new Set(
                updateData.assigned_hostels.map(h => this._normalizeHostelId(h)).filter(Boolean)
            ));
        }

        if (updateData.hostel_profit_shares && typeof updateData.hostel_profit_shares === 'object') {
            const shares = {};
            for (const [h, pct] of Object.entries(updateData.hostel_profit_shares)) {
                const normH = this._normalizeHostelId(h);
                if (normH) shares[normH] = Math.max(0, Math.min(100, Number(pct) || existing.profit_sharing_percentage));
            }
            existing.hostel_profit_shares = shares;
        }

        if (updateData.investment_amount !== undefined) {
            existing.investment_amount = Math.max(0, Number(updateData.investment_amount) || 0);
        }

        existing.updated_at = new Date().toISOString();

        this._partners[index] = existing;
        this._saveToDisk();
        await this._syncToSupabase('partner_registry', this._partners);

        // Update users table in Supabase
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.from('users').update({
                    name: existing.name,
                    phone: existing.phone,
                    account_status: existing.status,
                    dob: JSON.stringify({
                        roles: ['partner'],
                        partner_id: existing.partner_id,
                        assigned_hostels: existing.assigned_hostels,
                        profit_sharing_percentage: existing.profit_sharing_percentage,
                        hostel_profit_shares: existing.hostel_profit_shares,
                        partnership_start_date: existing.partnership_start_date
                    })
                }).eq('id', existing.id);
            }
        } catch (e) {}

        const { password_hash, ...safePartner } = existing;
        return safePartner;
    }

    async resetPartnerPassword(partnerId, newPassword) {
        await this.init();
        const index = this._partners.findIndex(p => p.id === partnerId || p.partner_id === partnerId);
        if (index === -1) throw new Error('Partner not found');

        if (!newPassword || newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters long');
        }

        const passwordHash = await hashPassword(newPassword);
        this._partners[index].password_hash = passwordHash;
        this._partners[index].updated_at = new Date().toISOString();

        this._saveToDisk();
        await this._syncToSupabase('partner_registry', this._partners);

        return { success: true, message: 'Password reset successfully' };
    }

    async deletePartner(partnerId) {
        await this.init();
        const index = this._partners.findIndex(p => p.id === partnerId || p.partner_id === partnerId);
        if (index === -1) throw new Error('Partner not found');

        const deleted = this._partners.splice(index, 1)[0];
        this._saveToDisk();
        await this._syncToSupabase('partner_registry', this._partners);

        // Deactivate in users table
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                await supabase.from('users').update({
                    account_status: 'DEACTIVATED'
                }).eq('id', deleted.id);
            }
        } catch (e) {}

        return { success: true, message: 'Partner removed successfully' };
    }

    // =========================================================================
    // INVESTMENT MANAGEMENT
    // =========================================================================

    async recordInvestment(data) {
        await this.init();
        const partner = this._partners.find(p => p.id === data.partner_id || p.partner_id === data.partner_id);
        const partnerName = data.partner_name || (partner ? partner.name : 'Unknown Partner');
        const partnerId = partner ? partner.id : data.partner_id;

        const amount = Math.max(0, Number(data.amount) || 0);
        if (amount <= 0) throw new Error('Investment amount must be greater than zero');

        const investment = {
            id: `inv_${crypto.randomBytes(6).toString('hex')}`,
            partner_id: partnerId,
            partner_name: partnerName,
            hostel_id: this._normalizeHostelId(data.hostel_id) || data.hostel_id || 'GENERAL',
            amount: amount,
            investment_date: data.investment_date || financialEngine.getISTDateString(),
            investment_type: data.investment_type === 'INITIAL' ? 'INITIAL' : 'ADDITIONAL',
            transaction_reference: String(data.transaction_reference || 'N/A').trim(),
            description: String(data.description || '').trim(),
            created_at: new Date().toISOString()
        };

        this._investments.unshift(investment);
        this._saveToDisk();
        await this._syncToSupabase('partner_investments', this._investments);

        // Recalculate partner total investment
        if (partner) {
            const partnerAllInv = this._investments.filter(i => i.partner_id === partner.id);
            const totalInv = partnerAllInv.reduce((sum, i) => sum + i.amount, 0);
            partner.investment_amount = totalInv;
            await this._syncToSupabase('partner_registry', this._partners);
        }

        return investment;
    }

    async getInvestments(partnerId = null) {
        await this.init();
        if (partnerId) {
            return this._investments.filter(i => i.partner_id === partnerId || i.partner_id === `ptr_${partnerId}`);
        }
        return this._investments;
    }

    // =========================================================================
    // PARTNER PAYMENT / PAYOUT MANAGEMENT
    // =========================================================================

    async recordPayment(data) {
        await this.init();
        const partner = this._partners.find(p => p.id === data.partner_id || p.partner_id === data.partner_id);
        if (!partner) throw new Error('Partner not found');

        const amount = Math.max(0, Number(data.amount) || 0);
        if (amount <= 0) throw new Error('Payment amount must be greater than zero');

        const payment = {
            id: `pay_${crypto.randomBytes(6).toString('hex')}`,
            partner_id: partner.id,
            partner_name: partner.name,
            amount: amount,
            payment_method: String(data.payment_method || 'UPI').toUpperCase(),
            transaction_id: String(data.transaction_id || 'N/A').trim(),
            payment_date: data.payment_date || financialEngine.getISTDateString(),
            remarks: String(data.remarks || '').trim(),
            status: 'CONFIRMED',
            created_at: new Date().toISOString()
        };

        this._payments.unshift(payment);
        this._saveToDisk();
        await this._syncToSupabase('partner_payments', this._payments);

        return payment;
    }

    async getPayments(partnerId = null) {
        await this.init();
        if (partnerId) {
            return this._payments.filter(p => p.partner_id === partnerId || p.partner_id === `ptr_${partnerId}`);
        }
        return this._payments;
    }

    // =========================================================================
    // HOSTEL EXPENSES MANAGEMENT (Operating Costs)
    // =========================================================================

    async recordExpense(data, adminId = 'owner') {
        await this.init();

        const amount = Math.max(0, Number(data.amount) || 0);
        if (amount <= 0) throw new Error('Expense amount must be greater than zero');

        const normHostel = this._normalizeHostelId(data.hostel_id);

        const expense = {
            id: `exp_${crypto.randomBytes(6).toString('hex')}`,
            hostel_id: normHostel || 'ALL',
            category: String(data.category || 'OTHER').toUpperCase(), // 'DELIVERY' | 'PACKAGING' | 'PAYMENT_CHARGES' | 'OTHER'
            amount: amount,
            date: data.date || financialEngine.getISTDateString(),
            description: String(data.description || '').trim(),
            recorded_by: adminId,
            created_at: new Date().toISOString()
        };

        this._expenses.unshift(expense);
        this._saveToDisk();
        await this._syncToSupabase('hostel_expenses', this._expenses);

        return expense;
    }

    async getExpenses(hostelId = null, startDate = null, endDate = null) {
        await this.init();
        let list = [...this._expenses];

        if (hostelId && hostelId !== 'all' && hostelId !== 'ALL') {
            const norm = this._normalizeHostelId(hostelId);
            list = list.filter(e => e.hostel_id === 'ALL' || e.hostel_id === norm);
        }

        if (startDate) {
            list = list.filter(e => e.date >= startDate);
        }
        if (endDate) {
            list = list.filter(e => e.date <= endDate);
        }

        return list;
    }

    async deleteExpense(expenseId) {
        await this.init();
        const index = this._expenses.findIndex(e => e.id === expenseId);
        if (index === -1) throw new Error('Expense not found');

        this._expenses.splice(index, 1);
        this._saveToDisk();
        await this._syncToSupabase('hostel_expenses', this._expenses);

        return { success: true };
    }

    // =========================================================================
    // FINANCIAL CALCULATION ENGINE (Database Scoped)
    // =========================================================================

    /**
     * Resolves orders and items from Supabase, strictly calculating
     * financial metrics based on actual database records.
     */
    async calculateFinancials({ hostels = null, startDate = null, endDate = null }) {
        await this.init();
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Database client unavailable');

        // Normalize hostel filter
        let targetHostels = null;
        if (Array.isArray(hostels) && hostels.length > 0) {
            targetHostels = hostels.map(h => this._normalizeHostelId(h)).filter(Boolean);
        } else if (typeof hostels === 'string' && hostels !== 'all' && hostels !== 'ALL') {
            const norm = this._normalizeHostelId(hostels);
            if (norm) targetHostels = [norm];
        }

        // Single-flight coalesced dataset fetch (30s TTL) with projected columns instead of repeated full-table SELECT * scans
        const { allProducts, allOrders, allItems } = await cache.wrap('partner:raw_dataset', async () => {
            const [prodsRes, ordRes, itemsRes] = await Promise.all([
                supabase.from('products').select('id, name, cost_price, price'),
                supabase.from('orders').select('id, hostel_id, status, total, subtotal, delivery_fee, platform_fee, payment_method, delivery_address, created_at'),
                supabase.from('order_items').select('order_id, product_id, quantity, unit_price')
            ]);
            if (ordRes.error) throw ordRes.error;
            return {
                allProducts: prodsRes.data || [],
                allOrders: ordRes.data || [],
                allItems: itemsRes.data || []
            };
        }, 30000);

        const productMap = new Map();
        for (const p of allProducts) {
            productMap.set(p.id, p);
        }

        // Group items by order_id
        const itemsByOrderId = new Map();
        for (const it of allItems) {
            if (!itemsByOrderId.has(it.order_id)) {
                itemsByOrderId.set(it.order_id, []);
            }
            itemsByOrderId.get(it.order_id).push(it);
        }

        // Filter orders by hostel and date range (IST)
        const filteredOrders = allOrders.filter(order => {
            const normHostel = this._normalizeHostelId(order.hostel_id || order.delivery_address);
            if (targetHostels && (!normHostel || !targetHostels.includes(normHostel))) {
                return false;
            }

            const orderDateIST = financialEngine.getISTDateString(order.created_at);
            if (startDate && orderDateIST < startDate) return false;
            if (endDate && orderDateIST > endDate) return false;

            return true;
        });

        // Compute metrics
        let totalOrdersCount = filteredOrders.length;
        let deliveredOrdersCount = 0;
        let cancelledOrdersCount = 0;
        let pendingOrdersCount = 0;

        let grossRevenue = 0;
        let cashCollection = 0;
        let onlineCollection = 0;
        let productCosts = 0;
        let cancelledAmount = 0;
        let deliveryOrdersCount = 0;
        let takeawayOrdersCount = 0;
        let deliveryRevenue = 0;
        let takeawayRevenue = 0;
        let takeawayFees = 0;

        const hostelBreakdown = {};
        if (targetHostels) {
            for (const h of targetHostels) {
                hostelBreakdown[h] = {
                    hostel_id: h,
                    total_orders: 0,
                    completed_orders: 0,
                    cancelled_orders: 0,
                    delivery_orders: 0,
                    takeaway_orders: 0,
                    delivery_revenue: 0,
                    takeaway_revenue: 0,
                    revenue: 0,
                    cash_collection: 0,
                    online_collection: 0,
                    product_costs: 0,
                    delivery_expenses: 0,
                    packaging_expenses: 0,
                    payment_charges: 0,
                    other_expenses: 0,
                    total_expenses: 0,
                    net_profit: 0
                };
            }
        }

        for (const order of filteredOrders) {
            const normHostel = this._normalizeHostelId(order.hostel_id || order.delivery_address) || 'UNASSIGNED';
            if (!hostelBreakdown[normHostel]) {
                hostelBreakdown[normHostel] = {
                    hostel_id: normHostel,
                    total_orders: 0,
                    completed_orders: 0,
                    cancelled_orders: 0,
                    delivery_orders: 0,
                    takeaway_orders: 0,
                    delivery_revenue: 0,
                    takeaway_revenue: 0,
                    revenue: 0,
                    cash_collection: 0,
                    online_collection: 0,
                    product_costs: 0,
                    delivery_expenses: 0,
                    packaging_expenses: 0,
                    payment_charges: 0,
                    other_expenses: 0,
                    total_expenses: 0,
                    net_profit: 0
                };
            }

            const hEntry = hostelBreakdown[normHostel];
            hEntry.total_orders += 1;

            const isDelivered = financialEngine.isDelivered(order.status);
            const isCancelled = financialEngine.isCancelled(order.status);

            const orderTotal = Math.max(0, Number(order.total || 0));

            if (isCancelled) {
                cancelledOrdersCount += 1;
                cancelledAmount += orderTotal;
                hEntry.cancelled_orders += 1;
                continue;
            }

            if (!isDelivered) {
                pendingOrdersCount += 1;
                continue;
            }

            // Completed / Delivered order
            deliveredOrdersCount += 1;
            hEntry.completed_orders += 1;
            grossRevenue += orderTotal;
            hEntry.revenue += orderTotal;

            const isTakeaway = (order.order_mode || '').toUpperCase() === 'TAKEAWAY';
            if (isTakeaway) {
                takeawayOrdersCount += 1;
                takeawayRevenue += orderTotal;
                takeawayFees += Number(order.takeaway_fee || 0);
                hEntry.takeaway_orders = (hEntry.takeaway_orders || 0) + 1;
                hEntry.takeaway_revenue = (hEntry.takeaway_revenue || 0) + orderTotal;
            } else {
                deliveryOrdersCount += 1;
                deliveryRevenue += orderTotal;
                hEntry.delivery_orders = (hEntry.delivery_orders || 0) + 1;
                hEntry.delivery_revenue = (hEntry.delivery_revenue || 0) + orderTotal;
            }

            // Payment method breakdown
            const payMethod = String(order.payment_method || '').toLowerCase();
            const isCash = payMethod.includes('cash') || payMethod.includes('cod');
            if (isCash) {
                cashCollection += orderTotal;
                hEntry.cash_collection += orderTotal;
            } else {
                onlineCollection += orderTotal;
                hEntry.online_collection += orderTotal;
            }

            // Product costs
            const orderItems = itemsByOrderId.get(order.id) || [];
            const orderFin = financialEngine.calculateOrderFinancials(order, orderItems, productMap);
            productCosts += orderFin.cost;
            hEntry.product_costs += orderFin.cost;
        }

        // Fetch Operating Expenses for the same period and hostels
        let expensesList = await this.getExpenses(null, startDate, endDate);
        let deliveryExpenses = 0;
        let packagingExpenses = 0;
        let paymentCharges = 0;
        let otherExpenses = 0;

        for (const exp of expensesList) {
            const expHostel = exp.hostel_id;
            const matchesHostel = !targetHostels || expHostel === 'ALL' || targetHostels.includes(expHostel);
            if (!matchesHostel) continue;

            const amt = exp.amount;
            if (exp.category === 'DELIVERY') deliveryExpenses += amt;
            else if (exp.category === 'PACKAGING') packagingExpenses += amt;
            else if (exp.category === 'PAYMENT_CHARGES') paymentCharges += amt;
            else otherExpenses += amt;

            if (expHostel !== 'ALL' && hostelBreakdown[expHostel]) {
                const hEntry = hostelBreakdown[expHostel];
                if (exp.category === 'DELIVERY') hEntry.delivery_expenses += amt;
                else if (exp.category === 'PACKAGING') hEntry.packaging_expenses += amt;
                else if (exp.category === 'PAYMENT_CHARGES') hEntry.payment_charges += amt;
                else hEntry.other_expenses += amt;
            }
        }

        const totalOperatingExpenses = deliveryExpenses + packagingExpenses + paymentCharges + otherExpenses;
        const totalExpenses = Math.round((productCosts + totalOperatingExpenses) * 100) / 100;
        const netProfit = Math.round((grossRevenue - totalExpenses) * 100) / 100;

        // Finalize hostel breakdown
        for (const key of Object.keys(hostelBreakdown)) {
            const h = hostelBreakdown[key];
            h.revenue = Math.round(h.revenue * 100) / 100;
            h.cash_collection = Math.round(h.cash_collection * 100) / 100;
            h.online_collection = Math.round(h.online_collection * 100) / 100;
            h.product_costs = Math.round(h.product_costs * 100) / 100;
            h.total_expenses = Math.round((h.product_costs + h.delivery_expenses + h.packaging_expenses + h.payment_charges + h.other_expenses) * 100) / 100;
            h.net_profit = Math.round((h.revenue - h.total_expenses) * 100) / 100;
        }

        return {
            total_orders: totalOrdersCount,
            completed_orders: deliveredOrdersCount,
            cancelled_orders: cancelledOrdersCount,
            pending_orders: pendingOrdersCount,
            delivery_orders: deliveryOrdersCount,
            takeaway_orders: takeawayOrdersCount,
            delivery_revenue: Math.round(deliveryRevenue * 100) / 100,
            takeaway_revenue: Math.round(takeawayRevenue * 100) / 100,
            takeaway_fees: Math.round(takeawayFees * 100) / 100,
            gross_revenue: Math.round(grossRevenue * 100) / 100,
            cash_collection: Math.round(cashCollection * 100) / 100,
            online_collection: Math.round(onlineCollection * 100) / 100,
            product_costs: Math.round(productCosts * 100) / 100,
            delivery_expenses: Math.round(deliveryExpenses * 100) / 100,
            packaging_expenses: Math.round(packagingExpenses * 100) / 100,
            payment_charges: Math.round(paymentCharges * 100) / 100,
            other_expenses: Math.round(otherExpenses * 100) / 100,
            total_expenses: totalExpenses,
            net_profit: netProfit,
            hostel_breakdown: hostelBreakdown
        };
    }

    /**
     * Calculate financial summary for a specific partner
     */
    async getPartnerFinancialSummary(partnerId, { startDate = null, endDate = null } = {}) {
        await this.init();
        const partner = this._partners.find(p => p.id === partnerId || p.partner_id === partnerId);
        if (!partner) throw new Error('Partner not found');

        const assignedHostels = partner.assigned_hostels || [];
        if (assignedHostels.length === 0) {
            return {
                partner_id: partner.id,
                partner_code: partner.partner_id,
                partner_name: partner.name,
                assigned_hostels: [],
                gross_revenue: 0,
                cash_collection: 0,
                online_collection: 0,
                product_costs: 0,
                total_expenses: 0,
                net_profit: 0,
                partner_profit_share: 0,
                total_investment: partner.investment_amount || 0,
                total_paid: 0,
                pending_payment: 0,
                hostel_breakdown: {}
            };
        }

        const financials = await this.calculateFinancials({
            hostels: assignedHostels,
            startDate,
            endDate
        });

        // Compute partner profit share
        let partnerProfitShare = 0;
        const hostelProfitShares = partner.hostel_profit_shares || {};
        const defaultPct = partner.profit_sharing_percentage || 50;

        for (const hId of assignedHostels) {
            const hData = financials.hostel_breakdown[hId];
            if (hData) {
                const pct = hostelProfitShares[hId] !== undefined ? hostelProfitShares[hId] : defaultPct;
                const hProfit = Math.max(0, hData.net_profit); // No negative payout
                const share = Math.round((hProfit * (pct / 100)) * 100) / 100;
                hData.profit_sharing_percentage = pct;
                hData.partner_share = share;
                partnerProfitShare += share;
            }
        }
        partnerProfitShare = Math.round(partnerProfitShare * 100) / 100;

        // Investment total
        const partnerInvestments = await this.getInvestments(partner.id);
        const totalInvestment = partnerInvestments.reduce((sum, i) => sum + i.amount, 0);

        // Payments total
        const partnerPayments = await this.getPayments(partner.id);
        const totalPaid = partnerPayments.reduce((sum, p) => sum + p.amount, 0);

        const pendingPayment = Math.max(0, Math.round((partnerProfitShare - totalPaid) * 100) / 100);

        return {
            partner_id: partner.id,
            partner_code: partner.partner_id,
            partner_name: partner.name,
            assigned_hostels: assignedHostels,
            total_orders: financials.total_orders,
            completed_orders: financials.completed_orders,
            cancelled_orders: financials.cancelled_orders,
            gross_revenue: financials.gross_revenue,
            cash_collection: financials.cash_collection,
            online_collection: financials.online_collection,
            product_costs: financials.product_costs,
            delivery_expenses: financials.delivery_expenses,
            packaging_expenses: financials.packaging_expenses,
            payment_charges: financials.payment_charges,
            other_expenses: financials.other_expenses,
            total_expenses: financials.total_expenses,
            net_profit: financials.net_profit,
            partner_profit_share: partnerProfitShare,
            owner_profit_share: Math.max(0, Math.round((financials.net_profit - partnerProfitShare) * 100) / 100),
            total_investment: totalInvestment,
            total_paid: Math.round(totalPaid * 100) / 100,
            pending_payment: pendingPayment,
            hostel_breakdown: financials.hostel_breakdown
        };
    }

    /**
     * Calculate Owner 10 KPI Overview Across All Partners and Platform
     */
    async getOwnerOverview() {
        await this.init();

        const totalPartners = this._partners.length;
        const activePartners = this._partners.filter(p => p.status === 'ACTIVE').length;

        // Total assigned hostels across all partners (unique count)
        const allAssigned = new Set();
        for (const p of this._partners) {
            for (const h of (p.assigned_hostels || [])) {
                allAssigned.add(h);
            }
        }
        const totalAssignedHostels = allAssigned.size;

        // Total partner investments recorded
        const totalPartnerInvestments = this._investments.reduce((sum, i) => sum + i.amount, 0);

        // Platform-wide financials
        const financials = await this.calculateFinancials({ hostels: null });

        // Calculate total partner profit share across all partners
        let totalPartnerProfitShare = 0;
        for (const partner of this._partners) {
            const assigned = partner.assigned_hostels || [];
            const defaultPct = partner.profit_sharing_percentage || 50;
            const shares = partner.hostel_profit_shares || {};

            for (const hId of assigned) {
                const hData = financials.hostel_breakdown[hId];
                if (hData) {
                    const pct = shares[hId] !== undefined ? shares[hId] : defaultPct;
                    const hProfit = Math.max(0, hData.net_profit);
                    totalPartnerProfitShare += (hProfit * (pct / 100));
                }
            }
        }
        totalPartnerProfitShare = Math.round(totalPartnerProfitShare * 100) / 100;

        // Total paid to partners
        const totalPaidToPartners = this._payments.reduce((sum, p) => sum + p.amount, 0);

        // Pending partner payments
        const pendingPartnerPayments = Math.max(0, Math.round((totalPartnerProfitShare - totalPaidToPartners) * 100) / 100);

        return {
            total_partners: totalPartners,
            active_partners: activePartners,
            total_assigned_hostels: totalAssignedHostels,
            total_partner_investments: Math.round(totalPartnerInvestments * 100) / 100,
            combined_revenue: financials.gross_revenue,
            combined_business_expenses: financials.total_expenses,
            combined_net_profit: financials.net_profit,
            total_partner_profit_share: totalPartnerProfitShare,
            total_paid_to_partners: Math.round(totalPaidToPartners * 100) / 100,
            pending_partner_payments: pendingPartnerPayments,
            financials: financials
        };
    }
}

// Singleton instance
const partnerService = new PartnerService();
module.exports = partnerService;
