/**
 * LPUQuick Unified Financial & Revenue Calculation Engine
 * 
 * Single Source of Truth for all financial, revenue, and profit calculations
 * across the LPUQuick platform.
 * 
 * CORE PRINCIPLES:
 * 1. Only successfully delivered orders contribute to revenue and profit.
 * 2. Product Profit = LPUQuick Selling Price - Admin/Product Cost (MRP is NEVER used for profit).
 * 3. Order Revenue = Sum of (Selling Price * Quantity) for delivered items.
 * 4. Order Cost = Sum of (Admin Cost * Quantity) for delivered items.
 * 5. Order Profit = Order Revenue - Order Cost.
 * 6. Date comparisons use Indian Standard Time (IST, Asia/Kolkata, UTC+5:30).
 * 7. Cancelled, pending, failed, or test orders contribute strictly ₹0 revenue and ₹0 profit.
 */

/**
 * Check if an order status indicates successful delivery / completion
 */
function isDelivered(status) {
    if (!status) return false;
    const s = String(status).trim().toLowerCase();
    return s === 'delivered' || s === 'completed';
}

/**
 * Check if an order status indicates cancellation or rejection
 */
function isCancelled(status) {
    if (!status) return false;
    const s = String(status).trim().toLowerCase();
    return s === 'cancelled' || s === 'canceled' || s === 'rejected';
}

/**
 * Check if an order status indicates an active / pending order
 */
function isPending(status) {
    if (!status) return false;
    return !isDelivered(status) && !isCancelled(status);
}

/**
 * Format any Date or ISO string into YYYY-MM-DD in Asia/Kolkata (IST, UTC+5:30)
 */
function getISTDateString(inputDate = new Date()) {
    if (!inputDate) return '';
    const d = (inputDate instanceof Date) ? inputDate : new Date(inputDate);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
}

/**
 * Calculate profit per unit and profit margin % for a product
 * 
 * Formula:
 * Profit Per Unit = LPUQuick Selling Price - Admin/Product Cost
 * Profit Margin % = ((LPUQuick Selling Price - Admin/Product Cost) / LPUQuick Selling Price) * 100
 */
function calculateProductProfit(sellingPriceOrObj, costPrice) {
    let sell = 0;
    let cost = 0;

    if (typeof sellingPriceOrObj === 'object' && sellingPriceOrObj !== null) {
        sell = Math.max(0, Number(sellingPriceOrObj.price !== undefined ? sellingPriceOrObj.price : (sellingPriceOrObj.selling_price || sellingPriceOrObj.sellingPrice || 0)) || 0);
        cost = Math.max(0, Number(sellingPriceOrObj.cost_price !== undefined ? sellingPriceOrObj.cost_price : (sellingPriceOrObj.admin_cost || sellingPriceOrObj.costPrice || sellingPriceOrObj.cost || 0)) || 0);
    } else {
        sell = Math.max(0, Number(sellingPriceOrObj) || 0);
        cost = Math.max(0, Number(costPrice) || 0);
    }

    const profitPerUnit = sell > 0 ? Math.round((sell - cost) * 100) / 100 : 0;
    const profitMargin = sell > 0
        ? Math.round(((sell - cost) / sell) * 10000) / 100
        : 0;

    return {
        sellingPrice: sell,
        costPrice: cost,
        profitPerUnit,
        profit_per_unit: profitPerUnit,
        profitMargin: Math.max(-100, Math.min(100, profitMargin)),
        profit_margin_pct: Math.max(-100, Math.min(100, profitMargin))
    };
}

/**
 * Calculate financials for an individual order item
 * Quantity is strictly multiplied.
 */
function calculateItemFinancials(item, productFallback = {}) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    
    // Selling price priority: snapshot > unit_price > product price
    const unitPrice = Number(
        item.selling_price !== undefined ? item.selling_price :
        (item.unit_price !== undefined ? item.unit_price :
        (item.price !== undefined ? item.price :
        (productFallback.price || 0)))
    ) || 0;

    // Cost price priority: snapshot > cost_price > product cost_price fallback > 70% wholesale estimate
    const rawCost = Number(
        item.admin_cost !== undefined ? item.admin_cost :
        (item.cost_price !== undefined ? item.cost_price :
        (productFallback.cost_price !== undefined ? productFallback.cost_price :
        (item.products?.cost_price !== undefined ? item.products.cost_price : 0)))
    );
    const costPrice = rawCost > 0 ? rawCost : (unitPrice > 0 ? Math.round(unitPrice * 0.70) : 0);

    const mrp = Number(
        item.mrp !== undefined ? item.mrp :
        (productFallback.mrp || item.products?.mrp || unitPrice)
    ) || unitPrice;

    const itemRevenue = Math.round(unitPrice * qty * 100) / 100;
    const itemCost = Math.round(costPrice * qty * 100) / 100;
    const itemProfit = Math.round((itemRevenue - itemCost) * 100) / 100;

    return {
        productId: item.product_id || productFallback.id || null,
        productName: item.product_name || item.name || productFallback.name || 'Campus Item',
        quantity: qty,
        unitPrice,
        costPrice,
        mrp,
        revenue: Math.max(0, itemRevenue),
        cost: Math.max(0, itemCost),
        profit: itemProfit
    };
}

/**
 * Calculate order-level financials strictly respecting delivery status.
 * If status is NOT delivered/completed, revenue and profit are strictly 0.
 */
function calculateOrderFinancials(order, items = [], productMap = new Map()) {
    if (!order) {
        return { isDelivered: false, isCancelled: false, revenue: 0, cost: 0, profit: 0, margin_pct: 0, itemsCount: 0 };
    }

    const delivered = isDelivered(order.status);
    const cancelled = isCancelled(order.status);

    const orderItems = (Array.isArray(items) && items.length > 0)
        ? items
        : (Array.isArray(order.items) ? order.items : []);

    if (!delivered) {
        // Cancelled, pending, and failed orders contribute strictly ₹0
        return {
            orderId: order.id,
            status: order.status,
            isDelivered: false,
            isCancelled: cancelled,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin_pct: 0,
            itemsCount: orderItems.length
        };
    }

    let orderRevenue = 0;
    let orderCost = 0;

    if (orderItems.length > 0) {
        for (const it of orderItems) {
            const itemFin = (it && typeof it.revenue === 'number' && typeof it.cost === 'number')
                ? it
                : calculateItemFinancials(it, productMap.get(it.product_id) || {});
            orderRevenue += itemFin.revenue;
            orderCost += itemFin.cost;
        }
    } else {
        // Fallback to order total if item breakdown is not available
        orderRevenue = Math.max(0, Number(order.total || order.subtotal || 0));
        orderCost = 0;
    }

    orderRevenue = Math.round(orderRevenue * 100) / 100;
    orderCost = Math.round(orderCost * 100) / 100;
    const orderProfit = Math.round((orderRevenue - orderCost) * 100) / 100;
    const marginPct = orderRevenue > 0 ? Math.round(((orderRevenue - orderCost) / orderRevenue) * 10000) / 100 : 0;

    return {
        orderId: order.id,
        status: order.status,
        isDelivered: true,
        isCancelled: false,
        revenue: orderRevenue,
        cost: orderCost,
        profit: orderProfit,
        margin_pct: marginPct,
        itemsCount: orderItems.length
    };
}

/**
 * Compute daily summary strictly for today's orders (IST)
 */
function calculateDailySummary(orders = [], targetDateIST = null) {
    const todayIST = targetDateIST || getISTDateString(new Date());

    const todaysOrders = (orders || []).filter(o => {
        if (!o) return false;
        return o.created_at ? getISTDateString(o.created_at) === todayIST : true;
    });

    let todayRevenue = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;
    let pendingCount = 0;

    for (const o of todaysOrders) {
        if (isDelivered(o.status)) {
            deliveredCount++;
            const amt = Number(o.total || o.final_amount || 0);
            todayRevenue += (isNaN(amt) || amt < 0 ? 0 : amt);
        } else if (isCancelled(o.status)) {
            cancelledCount++;
        } else {
            pendingCount++;
        }
    }

    todayRevenue = Math.round(todayRevenue * 100) / 100;

    const parts = [`${todaysOrders.length} order${todaysOrders.length !== 1 ? 's' : ''}`];
    if (deliveredCount > 0) parts.push(`${deliveredCount} delivered`);
    if (pendingCount > 0) parts.push(`${pendingCount} active`);
    if (cancelledCount > 0) parts.push(`${cancelledCount} cancelled`);

    return {
        dateIST: todayIST,
        totalOrders: todaysOrders.length,
        total_count: todaysOrders.length,
        deliveredCount,
        delivered_count: deliveredCount,
        cancelledCount,
        cancelled_count: cancelledCount,
        pendingCount,
        pending_count: pendingCount,
        revenue: todayRevenue,
        formattedRevenue: formatINR(todayRevenue),
        summaryMeta: parts.join(' • ')
    };
}

/**
 * Compute total campus financials across all orders and item records
 */
function calculateTotalFinancials(orders = [], items = [], snapshotsMap = {}, productMap = new Map()) {
    const deliveredOrders = (orders || []).filter(o => isDelivered(o.status));
    const deliveredOrderIds = new Set(deliveredOrders.map(o => o.id));

    let totalRevenue = 0;
    let totalCost = 0;

    // Group items by order_id
    const itemsByOrder = new Map();
    for (const it of (items || [])) {
        if (!deliveredOrderIds.has(it.order_id)) continue;
        if (!itemsByOrder.has(it.order_id)) {
            itemsByOrder.set(it.order_id, []);
        }
        itemsByOrder.get(it.order_id).push(it);
    }

    for (const ord of deliveredOrders) {
        // Priority 1: Check snapshot stored at purchase time
        const snapshot = snapshotsMap[ord.id] || (snapshotsMap.get ? snapshotsMap.get(ord.id) : null);
        const snapshotItems = snapshot?.items || (Array.isArray(snapshot) ? snapshot : null);

        if (snapshotItems && snapshotItems.length > 0) {
            let sCost = 0;
            let sRev = 0;
            for (const sItem of snapshotItems) {
                const itemFin = calculateItemFinancials(sItem, {});
                sRev += itemFin.revenue;
                sCost += itemFin.cost;
            }
            const ordTotal = Number(ord.total || ord.final_amount || 0);
            totalRevenue += (ordTotal > 0 ? ordTotal : sRev);
            totalCost += sCost;
        } else {
            // Priority 2: Use order_items with product fallback
            const orderItems = itemsByOrder.get(ord.id);
            let orderItemCost = 0;
            let orderItemRev = 0;
            if (orderItems && orderItems.length > 0) {
                for (const it of orderItems) {
                    const prod = (productMap && productMap.get) ? (productMap.get(it.product_id) || it.products || {}) : (it.products || {});
                    const itemFin = calculateItemFinancials(it, prod);
                    orderItemRev += itemFin.revenue;
                    orderItemCost += itemFin.cost;
                }
            }
            const ordTotal = Number(ord.total || ord.final_amount || 0);
            totalRevenue += (ordTotal > 0 ? ordTotal : orderItemRev);
            totalCost += orderItemCost;
        }
    }

    totalRevenue = Math.round(totalRevenue * 100) / 100;
    totalCost = Math.round(totalCost * 100) / 100;
    const totalProfit = Math.max(0, Math.round((totalRevenue - totalCost) * 100) / 100);
    const profitMargin = totalRevenue > 0
        ? Math.round((totalProfit / totalRevenue) * 10000) / 100
        : 0;
    const averageOrderValue = deliveredOrders.length > 0
        ? Math.round((totalRevenue / deliveredOrders.length) * 100) / 100
        : 0;

    return {
        completedOrdersCount: deliveredOrders.length,
        completed_orders_count: deliveredOrders.length,
        delivered_orders_count: deliveredOrders.length,
        totalRevenue,
        total_revenue: totalRevenue,
        totalCost,
        total_cost: totalCost,
        totalProfit,
        total_profit: totalProfit,
        profitMargin,
        profit_margin: profitMargin,
        averageOrderValue,
        average_order_value: averageOrderValue,
        formattedRevenue: formatINR(totalRevenue),
        formattedProfit: formatINR(totalProfit)
    };
}

/**
 * Format standard Indian Rupee string (e.g. ₹656 or ₹1,250.50)
 */
function formatINR(amount) {
    const num = Number(amount) || 0;
    const isInteger = Math.abs(num - Math.round(num)) < 0.001;
    return '₹' + (isInteger ? Math.round(num).toLocaleString('en-IN') : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}

/**
 * Format an ISO string to a clean time format in IST (e.g. "07:15 PM")
 */
function formatTimeIST(isoDate) {
    if (!isoDate) return '';
    try {
        const d = new Date(isoDate);
        if (isNaN(d.getTime())) return '';
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    } catch (e) {
        return '';
    }
}

/**
 * Compute Day-Wise Financials strictly from successfully delivered orders.
 * 
 * CORE ACCURACY RULES:
 * 1. ONLY orders with status 'delivered' or 'completed' contribute to revenue and profit.
 * 2. Cancelled, rejected, or pending orders contribute ₹0 revenue and ₹0 profit.
 * 3. All dates are grouped in Indian Standard Time (IST, UTC+5:30).
 * 4. Profit = Revenue - Cost of delivered items.
 */
function calculateDayWiseFinancials(orders = [], items = [], snapshotsMap = {}, options = {}) {
    const todayIST = getISTDateString(new Date());
    const yesterdayIST = getISTDateString(new Date(Date.now() - 86400000));

    // Group items by order_id
    const itemsByOrder = new Map();
    for (const it of (items || [])) {
        if (!it || !it.order_id) continue;
        if (!itemsByOrder.has(it.order_id)) {
            itemsByOrder.set(it.order_id, []);
        }
        itemsByOrder.get(it.order_id).push(it);
    }

    // Map of date string (YYYY-MM-DD) -> Day Metrics Object
    const dayMap = new Map();

    function getOrCreateDay(dateStr) {
        if (!dayMap.has(dateStr)) {
            let displayDate = dateStr;
            try {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    displayDate = dObj.toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                }
            } catch (e) {}

            dayMap.set(dateStr, {
                date: dateStr,
                display_date: displayDate,
                is_today: dateStr === todayIST,
                is_yesterday: dateStr === yesterdayIST,
                delivered_count: 0,
                cancelled_count: 0,
                pending_count: 0,
                total_orders_count: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                profit_margin: 0,
                average_order_value: 0,
                upi_revenue: 0,
                upi_count: 0,
                cash_revenue: 0,
                cash_count: 0,
                orders: []
            });
        }
        return dayMap.get(dateStr);
    }

    // Process all orders
    for (const ord of (orders || [])) {
        if (!ord || !ord.created_at) continue;
        const dateStr = getISTDateString(ord.created_at);
        if (!dateStr) continue;

        const dayEntry = getOrCreateDay(dateStr);
        dayEntry.total_orders_count += 1;

        if (!isDelivered(ord.status)) {
            if (isCancelled(ord.status)) {
                dayEntry.cancelled_count += 1;
            } else {
                dayEntry.pending_count += 1;
            }
            // Cancelled, rejected, or pending orders contribute strictly ₹0
            continue;
        }

        // Successfully delivered order: compute revenue, cost, profit
        dayEntry.delivered_count += 1;

        // Priority 1: Check snapshot stored at purchase time
        const snapshot = snapshotsMap[ord.id] || (snapshotsMap.get ? snapshotsMap.get(ord.id) : null);
        const snapshotItems = snapshot?.items || (Array.isArray(snapshot) ? snapshot : null);

        let ordRevenue = 0;
        let ordCost = 0;
        const itemSummaries = [];

        if (snapshotItems && snapshotItems.length > 0) {
            for (const sItem of snapshotItems) {
                const itemFin = calculateItemFinancials(sItem, {});
                ordRevenue += itemFin.revenue;
                ordCost += itemFin.cost;
                itemSummaries.push({
                    name: itemFin.productName,
                    quantity: itemFin.quantity,
                    unit_price: itemFin.unitPrice,
                    cost_price: itemFin.costPrice,
                    revenue: itemFin.revenue,
                    cost: itemFin.cost,
                    profit: itemFin.profit
                });
            }
        } else {
            // Priority 2: Use order_items with product join
            const orderItems = itemsByOrder.get(ord.id) || [];
            if (orderItems.length > 0) {
                for (const it of orderItems) {
                    const prod = it.products || {};
                    const itemFin = calculateItemFinancials(it, prod);
                    ordRevenue += itemFin.revenue;
                    ordCost += itemFin.cost;
                    itemSummaries.push({
                        name: itemFin.productName,
                        quantity: itemFin.quantity,
                        unit_price: itemFin.unitPrice,
                        cost_price: itemFin.costPrice,
                        revenue: itemFin.revenue,
                        cost: itemFin.cost,
                        profit: itemFin.profit
                    });
                }
            }
        }

        // Fallback or override to total amount paid if higher/clean
        const ordTotal = Number(ord.total || ord.final_amount || 0);
        if (ordTotal > 0) {
            ordRevenue = ordTotal;
        }

        ordRevenue = Math.round(ordRevenue * 100) / 100;
        ordCost = Math.round(ordCost * 100) / 100;
        const ordProfit = Math.round((ordRevenue - ordCost) * 100) / 100;
        const ordMargin = ordRevenue > 0 ? Math.round(((ordRevenue - ordCost) / ordRevenue) * 10000) / 100 : 0;

        dayEntry.revenue = Math.round((dayEntry.revenue + ordRevenue) * 100) / 100;
        dayEntry.cost = Math.round((dayEntry.cost + ordCost) * 100) / 100;
        dayEntry.profit = Math.round((dayEntry.profit + ordProfit) * 100) / 100;

        // Classify payment method: UPI vs Cash
        const rawPM = (ord.payment_method || '').toLowerCase().trim();
        const isUPI = rawPM.includes('upi') || rawPM.includes('qr') || rawPM.includes('online') || rawPM.includes('card') || rawPM.includes('net banking') || rawPM.includes('wallet');
        const isCash = rawPM.includes('cash') || rawPM.includes('cod');
        const paymentType = isUPI ? 'UPI' : (isCash ? 'Cash' : (rawPM ? 'UPI' : 'UPI')); // Default to UPI

        if (paymentType === 'UPI') {
            dayEntry.upi_revenue = Math.round((dayEntry.upi_revenue + ordRevenue) * 100) / 100;
            dayEntry.upi_count += 1;
        } else {
            dayEntry.cash_revenue = Math.round((dayEntry.cash_revenue + ordRevenue) * 100) / 100;
            dayEntry.cash_count += 1;
        }

        dayEntry.orders.push({
            id: ord.id,
            customer_name: ord.customer_name || 'Student',
            customer_phone: ord.customer_phone || '',
            delivery_address: ord.delivery_address || 'Campus Room',
            payment_method: ord.payment_method || 'UPI',
            payment_type: paymentType,
            created_at: ord.created_at,
            time_ist: formatTimeIST(ord.created_at),
            revenue: ordRevenue,
            cost: ordCost,
            profit: ordProfit,
            margin_pct: ordMargin,
            items_count: itemSummaries.length,
            items: itemSummaries
        });
    }

    // Convert dayMap to array and calculate day metrics
    let daysArray = Array.from(dayMap.values()).map(d => {
        const margin = d.revenue > 0 ? Math.round(((d.revenue - d.cost) / d.revenue) * 10000) / 100 : 0;
        const aov = d.delivered_count > 0 ? Math.round((d.revenue / d.delivered_count) * 100) / 100 : 0;
        return {
            ...d,
            profit: Math.round((d.revenue - d.cost) * 100) / 100,
            profit_margin: margin,
            average_order_value: aov,
            formatted_revenue: formatINR(d.revenue),
            formatted_cost: formatINR(d.cost),
            formatted_profit: formatINR(d.profit),
            formatted_aov: formatINR(aov),
            formatted_upi_revenue: formatINR(d.upi_revenue),
            formatted_cash_revenue: formatINR(d.cash_revenue)
        };
    });

    // Sort descending by date (most recent day first)
    daysArray.sort((a, b) => b.date.localeCompare(a.date));

    // Apply filtering options
    const { range, startDate, endDate } = options;
    if (range === 'today') {
        daysArray = daysArray.filter(d => d.date === todayIST);
    } else if (range === 'yesterday') {
        daysArray = daysArray.filter(d => d.date === yesterdayIST);
    } else if (range === '7days') {
        const sevenDaysAgo = getISTDateString(new Date(Date.now() - 7 * 86400000));
        daysArray = daysArray.filter(d => d.date >= sevenDaysAgo && d.date <= todayIST);
    } else if (range === '30days') {
        const thirtyDaysAgo = getISTDateString(new Date(Date.now() - 30 * 86400000));
        daysArray = daysArray.filter(d => d.date >= thirtyDaysAgo && d.date <= todayIST);
    } else if (range === 'this_month') {
        const monthPrefix = todayIST.slice(0, 7); // YYYY-MM
        daysArray = daysArray.filter(d => d.date.startsWith(monthPrefix));
    } else if (startDate && endDate) {
        daysArray = daysArray.filter(d => d.date >= startDate && d.date <= endDate);
    } else if (startDate) {
        daysArray = daysArray.filter(d => d.date >= startDate);
    } else if (endDate) {
        daysArray = daysArray.filter(d => d.date <= endDate);
    }

    // Compute range-level summary totals
    let totalDeliveredOrders = 0;
    let totalCancelledOrders = 0;
    let totalPendingOrders = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let totalUpiRevenue = 0;
    let totalUpiCount = 0;
    let totalCashRevenue = 0;
    let totalCashCount = 0;
    let highestRevDay = null;
    let highestProfDay = null;

    for (const d of daysArray) {
        totalDeliveredOrders += d.delivered_count;
        totalCancelledOrders += d.cancelled_count;
        totalPendingOrders += d.pending_count;
        totalRevenue += d.revenue;
        totalCost += d.cost;
        totalUpiRevenue += d.upi_revenue;
        totalUpiCount += d.upi_count;
        totalCashRevenue += d.cash_revenue;
        totalCashCount += d.cash_count;

        if (!highestRevDay || d.revenue > highestRevDay.revenue) {
            highestRevDay = { date: d.date, display_date: d.display_date, revenue: d.revenue };
        }
        if (!highestProfDay || d.profit > highestProfDay.profit) {
            highestProfDay = { date: d.date, display_date: d.display_date, profit: d.profit };
        }
    }

    totalRevenue = Math.round(totalRevenue * 100) / 100;
    totalCost = Math.round(totalCost * 100) / 100;
    const totalProfit = Math.max(0, Math.round((totalRevenue - totalCost) * 100) / 100);
    const overallProfitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 10000) / 100 : 0;
    const overallAOV = totalDeliveredOrders > 0 ? Math.round((totalRevenue / totalDeliveredOrders) * 100) / 100 : 0;
    const activeDaysCount = daysArray.length;
    const avgDailyRevenue = activeDaysCount > 0 ? Math.round((totalRevenue / activeDaysCount) * 100) / 100 : 0;
    const avgDailyProfit = activeDaysCount > 0 ? Math.round((totalProfit / activeDaysCount) * 100) / 100 : 0;

    totalUpiRevenue = Math.round(totalUpiRevenue * 100) / 100;
    totalCashRevenue = Math.round(totalCashRevenue * 100) / 100;

    return {
        summary: {
            total_delivered_orders: totalDeliveredOrders,
            total_cancelled_orders: totalCancelledOrders,
            total_pending_orders: totalPendingOrders,
            total_orders_evaluated: totalDeliveredOrders + totalCancelledOrders + totalPendingOrders,
            total_revenue: totalRevenue,
            total_cost: totalCost,
            total_profit: totalProfit,
            overall_profit_margin: overallProfitMargin,
            average_order_value: overallAOV,
            days_count: activeDaysCount,
            average_daily_revenue: avgDailyRevenue,
            average_daily_profit: avgDailyProfit,
            highest_revenue_day: highestRevDay,
            highest_profit_day: highestProfDay,
            upi_revenue: totalUpiRevenue,
            upi_count: totalUpiCount,
            cash_revenue: totalCashRevenue,
            cash_count: totalCashCount,
            upi_pct: totalRevenue > 0 ? Math.round((totalUpiRevenue / totalRevenue) * 10000) / 100 : 0,
            cash_pct: totalRevenue > 0 ? Math.round((totalCashRevenue / totalRevenue) * 10000) / 100 : 0,
            formatted_total_revenue: formatINR(totalRevenue),
            formatted_total_profit: formatINR(totalProfit),
            formatted_total_cost: formatINR(totalCost),
            formatted_average_order_value: formatINR(overallAOV),
            formatted_average_daily_revenue: formatINR(avgDailyRevenue),
            formatted_average_daily_profit: formatINR(avgDailyProfit),
            formatted_upi_revenue: formatINR(totalUpiRevenue),
            formatted_cash_revenue: formatINR(totalCashRevenue)
        },
        days: daysArray
    };
}

module.exports = {
    isDelivered,
    isCancelled,
    isPending,
    getISTDateString,
    formatTimeIST,
    calculateProductProfit,
    calculateItemFinancials,
    calculateOrderFinancials,
    calculateDailySummary,
    calculateTotalFinancials,
    calculateDayWiseFinancials,
    formatINR
};
