const fs = require('fs');
const path = require('path');
const pushService = require('../notifications/pushService');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CAMPAIGNS_FILE = path.join(DATA_DIR, 'broadcast_campaigns.json');

// Ensure data directory exists
try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (e) {}

// Initial starter seed campaigns so Super Admin has rich visual history immediately
const SEED_CAMPAIGNS = [
    {
        id: 'camp_seed_store_open',
        title: "🟢 LPUQuick Store is Now Open! 🛒",
        body: "Your campus dark store is open for fast delivery. Order late-night snacks, chilled drinks & Maggi directly to your hostel room in 10 minutes!",
        category: "store_status",
        targetHostel: "all",
        targetHostelName: "All Hostels",
        imageUrl: "/img/notif_store_open.gif",
        actionText: "ORDER NOW 🛒",
        actionUrl: "/#/",
        status: "sent",
        scheduledAt: null,
        sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        createdBy: "Super Admin (Nivas Naidu)",
        stats: {
            targetCount: 1420,
            sentCount: 1420,
            deliveredCount: 1388,
            failedCount: 32,
            clickedCount: 412
        }
    },
    {
        id: 'camp_seed_diwali_offer',
        title: "🪔 Happy Diwali! Special 20% Off Festive Drop",
        body: "Celebrate Diwali with sweets, snacks & treats at special student discounts! Use promo code DIWALI20 at checkout tonight.",
        category: "festival",
        targetHostel: "all",
        targetHostelName: "All Hostels",
        imageUrl: "/img/notif_store_open.gif",
        actionText: "VIEW FESTIVE DROP",
        actionUrl: "/#/categories",
        status: "sent",
        scheduledAt: null,
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        createdBy: "Super Admin (Nivas Naidu)",
        stats: {
            targetCount: 1390,
            sentCount: 1390,
            deliveredCount: 1365,
            failedCount: 25,
            clickedCount: 528
        }
    },
    {
        id: 'camp_seed_bh13_midnight',
        title: "🌙 BH13 Special Midnight Rush! Flat ₹30 Off",
        body: "Studying late in BH-13? Hot noodles, energy drinks and chips delivered straight to your room door in under 10 minutes.",
        category: "special_offer",
        targetHostel: "BH-13",
        targetHostelName: "Boys Hostel 13",
        imageUrl: "/img/notif_near_room.gif",
        actionText: "CLAIM OFFER ⚡",
        actionUrl: "/#/",
        status: "sent",
        scheduledAt: null,
        sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        createdBy: "Super Admin (Nivas Naidu)",
        stats: {
            targetCount: 345,
            sentCount: 345,
            deliveredCount: 341,
            failedCount: 4,
            clickedCount: 182
        }
    }
];

let campaigns = [];

function loadCampaigns() {
    try {
        if (fs.existsSync(CAMPAIGNS_FILE)) {
            const data = fs.readFileSync(CAMPAIGNS_FILE, 'utf8');
            campaigns = JSON.parse(data);
        } else {
            campaigns = [...SEED_CAMPAIGNS];
            persistCampaigns();
        }
    } catch (e) {
        console.warn('[Broadcast Notification Service] Load warning:', e.message);
        campaigns = [...SEED_CAMPAIGNS];
    }
}

function persistCampaigns() {
    try {
        fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2));
    } catch (e) {
        try {
            const tmpFile = path.join(require('os').tmpdir(), 'broadcast_campaigns.json');
            fs.writeFileSync(tmpFile, JSON.stringify(campaigns, null, 2));
        } catch (tmpErr) {}
    }
}

loadCampaigns();

class BroadcastNotificationService {
    getAllCampaigns() {
        return campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getCampaignById(id) {
        return campaigns.find(c => c.id === id);
    }

    async createCampaign({
        title,
        body,
        category = 'general',
        targetHostel = 'all',
        targetHostelName = 'All Hostels',
        imageUrl = '',
        actionText = '',
        actionUrl = '/#/',
        scheduledAt = null,
        createdBy = 'Super Admin'
    }) {
        // Validation
        if (!title || typeof title !== 'string' || title.trim().length < 3) {
            throw new Error('Title must be at least 3 characters long.');
        }
        if (!body || typeof body !== 'string' || body.trim().length < 3) {
            throw new Error('Notification description must be at least 3 characters long.');
        }

        const validCategories = ['store_status', 'special_offer', 'festival', 'announcement', 'general'];
        const sanitizedCategory = validCategories.includes(category) ? category : 'general';

        const isScheduled = Boolean(scheduledAt && new Date(scheduledAt) > new Date());
        const campaignId = 'camp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);

        const newCampaign = {
            id: campaignId,
            title: title.trim(),
            body: body.trim(),
            category: sanitizedCategory,
            targetHostel: (targetHostel || 'all').trim(),
            targetHostelName: (targetHostelName || (targetHostel === 'all' ? 'All Hostels' : targetHostel)).trim(),
            imageUrl: (imageUrl || '').trim(),
            actionText: (actionText || '').trim(),
            actionUrl: (actionUrl || '/#/').trim(),
            status: isScheduled ? 'scheduled' : 'pending',
            scheduledAt: isScheduled ? new Date(scheduledAt).toISOString() : null,
            sentAt: null,
            createdAt: new Date().toISOString(),
            createdBy: createdBy || 'Super Admin',
            stats: {
                targetCount: 0,
                sentCount: 0,
                deliveredCount: 0,
                failedCount: 0,
                clickedCount: 0
            }
        };

        campaigns.unshift(newCampaign);
        persistCampaigns();

        // If not scheduled for future, dispatch immediately!
        if (!isScheduled) {
            await this.sendCampaign(campaignId);
        }

        return this.getCampaignById(campaignId);
    }

    async sendCampaign(campaignId) {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign) throw new Error('Campaign not found.');

        // Build Android Web Push payload with LPUQuick branding
        const payload = {
            title: campaign.title,
            body: campaign.body,
            icon: '/logo.png',
            badge: '/favicon.png',
            image: campaign.imageUrl || undefined,
            tag: `lpuquick-broadcast-${campaign.id}`,
            data: {
                url: campaign.actionUrl || '/#/',
                campaignId: campaign.id,
                type: 'BROADCAST_PROMOTION',
                category: campaign.category
            },
            actions: campaign.actionText ? [
                { action: 'open', title: campaign.actionText }
            ] : [
                { action: 'open', title: 'Open LPUQuick' }
            ]
        };

        const result = await pushService.broadcastToAudience({
            targetHostel: campaign.targetHostel,
            payload
        });

        campaign.status = 'sent';
        campaign.sentAt = new Date().toISOString();
        campaign.stats.targetCount = result.total;
        campaign.stats.sentCount = result.total;
        campaign.stats.deliveredCount = result.delivered;
        campaign.stats.failedCount = result.failed;

        persistCampaigns();
        console.log(`[Broadcast Service] Dispatched campaign "${campaign.title}" to ${result.delivered}/${result.total} devices.`);
        return campaign;
    }

    deleteCampaign(campaignId) {
        const idx = campaigns.findIndex(c => c.id === campaignId);
        if (idx === -1) return false;
        campaigns.splice(idx, 1);
        persistCampaigns();
        return true;
    }

    trackClick(campaignId) {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (campaign) {
            campaign.stats.clickedCount = (campaign.stats.clickedCount || 0) + 1;
            persistCampaigns();
            return true;
        }
        return false;
    }

    getSubscriberStats() {
        const allSubs = pushService.getSubscriptions();
        const totalSubscribers = allSubs.length;

        // Group by hostel
        const hostelCounts = {};
        allSubs.forEach(s => {
            const h = (s.hostelId || 'General').toUpperCase().replace('-', '');
            hostelCounts[h] = (hostelCounts[h] || 0) + 1;
        });

        // Totals across campaigns
        let totalSent = 0;
        let totalDelivered = 0;
        let totalClicks = 0;

        campaigns.forEach(c => {
            if (c.status === 'sent') {
                totalSent += (c.stats?.sentCount || 0);
                totalDelivered += (c.stats?.deliveredCount || 0);
                totalClicks += (c.stats?.clickedCount || 0);
            }
        });

        const ctr = totalDelivered > 0 ? ((totalClicks / totalDelivered) * 100).toFixed(1) : '0.0';

        return {
            totalSubscribers,
            totalCampaigns: campaigns.length,
            totalSent,
            totalDelivered,
            totalClicks,
            clickThroughRate: `${ctr}%`,
            hostelCounts
        };
    }

    getCustomerFeed(hostelId) {
        const cleanHostel = (hostelId || '').toUpperCase().replace(/[\s-]/g, '');
        // Return active sent campaigns matching all hostels or user's hostel
        return campaigns
            .filter(c => c.status === 'sent')
            .filter(c => {
                if (!c.targetHostel || c.targetHostel.toLowerCase() === 'all') return true;
                const cHostel = c.targetHostel.toUpperCase().replace(/[\s-]/g, '');
                return cleanHostel.length > 0 && cHostel === cleanHostel;
            })
            .slice(0, 20); // most recent 20
    }

    initScheduler() {
        // Check for scheduled campaigns every 30 seconds
        setInterval(async () => {
            try {
                const now = new Date();
                const dueCampaigns = campaigns.filter(c => c.status === 'scheduled' && c.scheduledAt && new Date(c.scheduledAt) <= now);
                for (const camp of dueCampaigns) {
                    console.log(`[Broadcast Scheduler] Triggering scheduled broadcast: ${camp.id} (${camp.title})`);
                    await this.sendCampaign(camp.id);
                }
            } catch (err) {
                console.warn('[Broadcast Scheduler Error]:', err.message);
            }
        }, 30000);
    }
}

const serviceInstance = new BroadcastNotificationService();
serviceInstance.initScheduler();

module.exports = serviceInstance;

