/**
 * LPUQuick Multi-Core Cluster Load Balancer
 * 
 * Utilizes 100% of available CPU cores by spawning parallel worker processes.
 * Incoming traffic is automatically distributed and load-balanced across all workers
 * via OS-level round-robin socket sharing with zero downtime and automatic self-healing.
 */

const cluster = require('node:cluster');
const os = require('node:os');
require('dotenv').config();

const numCPUs = os.cpus().length;
// Default to available CPU cores, minimum 2 for redundancy, or override via environment
const WORKERS_COUNT = Math.max(2, Math.min(numCPUs, Number(process.env.WEB_CONCURRENCY || process.env.WORKERS || numCPUs)));

if (cluster.isPrimary || cluster.isMaster) {
    console.log('================================================================');
    console.log('⚡ LPUQUICK HIGH-CONCURRENCY MULTI-CORE LOAD BALANCER');
    console.log('================================================================');
    console.log(`[Cluster Primary] Master PID: ${process.pid}`);
    console.log(`[Cluster Primary] Host CPUs: ${numCPUs} cores available`);
    console.log(`[Cluster Primary] Spawning ${WORKERS_COUNT} worker processes across CPU cores...`);
    console.log('----------------------------------------------------------------');

    let activeWorkers = 0;
    const workersMap = new Map();

    // Spawn workers across all CPU cores
    for (let i = 0; i < WORKERS_COUNT; i++) {
        const worker = cluster.fork();
        workersMap.set(worker.id, { pid: worker.process.pid, startedAt: Date.now() });
    }

    cluster.on('online', (worker) => {
        activeWorkers++;
        console.log(`[Cluster Load Balancer] Worker #${worker.id} online (PID ${worker.process.pid}) [${activeWorkers}/${WORKERS_COUNT} Active]`);
    });

    // Zero-Downtime Auto-Restart with Backoff Protection
    let isShuttingDown = false;
    cluster.on('exit', (worker, code, signal) => {
        activeWorkers = Math.max(0, activeWorkers - 1);
        workersMap.delete(worker.id);
        const reason = signal ? `signal ${signal}` : `exit code ${code}`;
        console.warn(`[Cluster Alert] Worker #${worker.id} (PID ${worker.process.pid}) died (${reason}).`);
        
        if (isShuttingDown) return;

        // Auto-healing with 1000ms backoff to prevent CPU thrashing if port is in use
        setTimeout(() => {
            if (!isShuttingDown && activeWorkers < WORKERS_COUNT) {
                console.log(`[Cluster Load Balancer] 🔄 Auto-healing: Spawning new replacement worker...`);
                const newWorker = cluster.fork();
                workersMap.set(newWorker.id, { pid: newWorker.process.pid, startedAt: Date.now() });
            }
        }, 1000);
    });

    // Graceful Shutdown on termination signals
    const shutdownCluster = (signal) => {
        isShuttingDown = true;
        console.log(`\n[Cluster Shutdown] Received ${signal}. Gracefully stopping all ${WORKERS_COUNT} workers...`);
        for (const id in cluster.workers) {
            if (cluster.workers[id]) {
                cluster.workers[id].process.kill('SIGTERM');
            }
        }
        setTimeout(() => {
            console.log('[Cluster Shutdown] Forcefully closing master process.');
            process.exit(0);
        }, 5000);
    };

    process.on('SIGINT', () => shutdownCluster('SIGINT'));
    process.on('SIGTERM', () => shutdownCluster('SIGTERM'));

} else {
    // Worker processes execute the main server application
    require('./index');
}
