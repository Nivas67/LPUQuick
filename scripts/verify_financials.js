const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const financialEngine = require('../server/utils/financialEngine');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    const { data: allOrders } = await supabase.from('orders').select('*');
    const deliveredOrders = allOrders.filter(o => financialEngine.isDelivered(o.status));
    const deliveredOrderIds = deliveredOrders.map(o => o.id);

    let items = [];
    const CHUNK_SIZE = 150;
    for (let i = 0; i < deliveredOrderIds.length; i += CHUNK_SIZE) {
        const chunk = deliveredOrderIds.slice(i, i + CHUNK_SIZE);
        const { data: chunkItems } = await supabase
            .from('order_items')
            .select('order_id, product_id, quantity, unit_price, products(id, name, price, cost_price, mrp)')
            .in('order_id', chunk);
        if (chunkItems) items.push(...chunkItems);
    }

    console.log('Delivered orders count:', deliveredOrders.length);
    console.log('Delivered items fetched:', items.length);

    const breakdown = financialEngine.calculateDayWiseFinancials(allOrders, items, {});
    const sep28 = breakdown.days.find(d => d.date === '2026-09-28');
    console.log('Sep 28 day metrics:');
    console.log(' - Date:', sep28.date);
    console.log(' - Delivered orders:', sep28.delivered_count);
    console.log(' - Revenue:', sep28.formatted_revenue);
    console.log(' - Cost:', sep28.formatted_cost);
    console.log(' - Profit:', sep28.formatted_profit);
    console.log(' - Margin:', sep28.profit_margin + '%');

    console.log('\nAll recorded days breakdown:');
    breakdown.days.forEach(d => {
        console.log(d.date + ': ' + d.delivered_count + ' orders, Rev ' + d.formatted_revenue + ', Cost ' + d.formatted_cost + ', Profit ' + d.formatted_profit + ' (' + d.profit_margin + '%)');
    });

    console.log('\nOverall Summary:');
    console.log(' - Total Delivered Orders:', breakdown.summary.total_delivered_orders);
    console.log(' - Total Revenue:', breakdown.summary.formatted_total_revenue);
    console.log(' - Total Cost:', breakdown.summary.formatted_total_cost);
    console.log(' - Total Profit:', breakdown.summary.formatted_total_profit);
    console.log(' - Overall Profit Margin:', breakdown.summary.overall_profit_margin + '%');
    console.log(' - Average Order Value:', breakdown.summary.formatted_average_order_value);
}

verify().catch(console.error);
