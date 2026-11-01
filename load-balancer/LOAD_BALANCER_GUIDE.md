# ⚡ LPUQuick High-Concurrency Load Balancing Architecture

LPUQuick includes multi-tier load balancing built directly into the system, designed to handle **6,000+ simultaneous students**, flash-sales, and campus-wide peak delivery hours.

---

## 1. Native Multi-Core Cluster Load Balancer (`node server/cluster.js`)

Node.js runs on a single thread by default. On multi-core systems (e.g. 4, 8, or 16 cores), a standard single-process server leaves 75%–90% of your CPU power idle.

The **Multi-Core Cluster Load Balancer** solves this:
- **Zero-Dependency Native Clustering**: Uses `node:cluster` to spawn worker processes across all available CPU cores.
- **Single Port Sharing**: All workers share the same HTTP port (`3000` or `process.env.PORT`) with zero port conflicts.
- **Operating-System Round-Robin Distribution**: Incoming connections are distributed across worker processes using the OS kernel load balancer.
- **Zero-Downtime Auto-Healing**: If any worker crashes or runs out of memory, the cluster master detects it instantly and auto-spawns a clean replacement worker within 1 second.
- **State Synchronization**: WebSocket connections and real-time broadcasts synchronize seamlessly across all cluster workers via Supabase Cloud Realtime (`lpuquick_global_realtime`).

### How to Run:
```bash
# Launch with all available CPU cores (automatic detection)
npm run start:cluster

# Or launch with a custom worker count (e.g. 4 workers)
WEB_CONCURRENCY=4 npm run start:cluster
```

---

## 2. Nginx Production Load Balancer (`load-balancer/nginx.conf`)

For deployment on VPS, AWS EC2, DigitalOcean, or Hostinger VPS, use the included [`nginx.conf`](file:///c:/Users/Digvi/OneDrive/Documents/LpuQuick/load-balancer/nginx.conf).

### Features:
- **`least_conn` Balancing**: Dynamically directs incoming HTTP requests to the worker with the lowest active connection load.
- **Connection Pooling (`keepalive 64`)**: Reuses open TCP connections to Node.js workers to eliminate socket starvation and connection lag.
- **Full WebSocket Support**: Proxying for `/ws/*` endpoints with 3600-second long-lived keepalive timeouts.
- **Static Asset Edge Caching**: Offloads images, CSS, and JS caching directly to Nginx so Node.js processes handle only dynamic API logic.
- **Real-IP Resolution**: Cloudflare IP ranges are mapped automatically to restore the client's real IP address.

### Deployment:
```bash
# Copy configuration to Nginx
sudo cp load-balancer/nginx.conf /etc/nginx/nginx.conf

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

## 3. Cloudflare & Vercel Edge Serverless Load Balancing

- **Vercel Cloud**: Serverless functions in [`api/index.js`](file:///c:/Users/Digvi/OneDrive/Documents/LpuQuick/api/index.js) auto-scale dynamically across multiple edge instances with automated regional load balancing.
- **Cloudflare Edge**: All static assets are served from the nearest Cloudflare point of presence, and API calls are load-balanced to your origin server with DDoS protection.

---

## 4. Single-Flight Micro-Cache & Thundering Herd Protection

In [`server/cache.js`](file:///c:/Users/Digvi/OneDrive/Documents/LpuQuick/server/cache.js), request deduplication (`inflight` map) ensures that if 1,000 students request `/api/products` or `/api/home` at the exact same millisecond:
1. Only **1 query** goes to PostgreSQL.
2. The remaining 999 requests wait for the single promise and receive the cached response simultaneously.
3. This completely prevents database thrashing during flash-sales.
