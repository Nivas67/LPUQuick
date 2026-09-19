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

    // Cost price priority: snapshot > cost_price > product cost_price fallback
    const costPrice = Number(
        item.admin_cost !== undefined ? item.admin_cost :
        (item.cost_price !== undefined ? item.cost_price :
        (productFallback.cost_price !== undefined ? productFallback.cost_price :
        (item.products?.cost_price || 0)))
    ) || 0;

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
            for (const sItem of snapshotItems) {
                const itemFin = calculateItemFinancials(sItem, {});
                totalRevenue += itemFin.revenue;
                totalCost += itemFin.cost;
            }
        } else {
            // Priority 2: Use order_items with product fallback
            const orderItems = itemsByOrder.get(ord.id);
            if (orderItems && orderItems.length > 0) {
                for (const it of orderItems) {
                    const prod = (productMap && productMap.get) ? (productMap.get(it.product_id) || it.products || {}) : (it.products || {});
                    const itemFin = calculateItemFinancials(it, prod);
                    totalRevenue += itemFin.revenue;
                    totalCost += itemFin.cost;
                }
            } else {
                // Priority 3: Fallback to order total if no items exist
                totalRevenue += Math.max(0, Number(ord.total || 0));
            }
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
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin,
        averageOrderValue,
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

module.exports = {
    isDelivered,
    isCancelled,
    isPending,
    getISTDateString,
    calculateProductProfit,
    calculateItemFinancials,
    calculateOrderFinancials,
    calculateDailySummary,
    calculateTotalFinancials,
    formatINR
};
