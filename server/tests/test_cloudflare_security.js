const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🧪 TESTING CLOUDFLARE SECURITY INTEGRATION & IP RESTORATION');
console.log('====================================================\n');

// 1. Test ipBlockService.extractClientIp
const ipBlockService = require('../services/ipBlockService');

// Case A: Cloudflare CF-Connecting-IP header provided
const reqWithCf = {
    headers: {
        'cf-connecting-ip': '103.21.244.50',
        'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        'x-real-ip': '9.9.9.9'
    }
};
const extractedCf = ipBlockService.extractClientIp(reqWithCf);
assert.strictEqual(extractedCf, '103.21.244.50', 'CF-Connecting-IP must take precedence over spoofed X-Forwarded-For');
console.log('✅ [PASS] CF-Connecting-IP correctly prioritized over spoofed X-Forwarded-For');

// Case B: Cloudflare Enterprise True-Client-IP header provided
const reqWithTrueIp = {
    headers: {
        'true-client-ip': '141.101.64.12',
        'x-forwarded-for': '4.4.4.4'
    }
};
const extractedTrueIp = ipBlockService.extractClientIp(reqWithTrueIp);
assert.strictEqual(extractedTrueIp, '141.101.64.12', 'True-Client-IP must be honored');
console.log('✅ [PASS] True-Client-IP correctly honored');

// Case C: Vercel Edge proxy header when Cloudflare is not present
const reqWithVercel = {
    headers: {
        'x-vercel-forwarded-for': '49.36.12.5, 76.76.21.21'
    }
};
const extractedVercel = ipBlockService.extractClientIp(reqWithVercel);
assert.strictEqual(extractedVercel, '49.36.12.5', 'X-Vercel-Forwarded-For extracted cleanly');
console.log('✅ [PASS] Vercel Edge Forwarded IP fallback honored');

// 2. Test securityShield getClientIp
const shieldContent = fs.readFileSync(path.join(__dirname, '..', 'middleware', 'securityShield.js'), 'utf8');
const getClientIpMatch = shieldContent.match(/function getClientIp\(req\) \{[\s\S]*?\n\}/);
assert(getClientIpMatch, 'getClientIp function must exist in securityShield.js');

const fnShield = new Function(`
    ${getClientIpMatch[0]}
    return getClientIp;
`)();

const shieldIp = fnShield({
    headers: {
        'cf-connecting-ip': '108.162.192.88',
        'x-forwarded-for': '12.34.56.78'
    }
});
assert.strictEqual(shieldIp, '108.162.192.88', 'securityShield must use CF-Connecting-IP over X-Forwarded-For');
console.log('✅ [PASS] securityShield getClientIp prioritizes CF-Connecting-IP for rate-limiting');

// 3. Test nginx.conf Cloudflare CIDRs
const nginxContent = fs.readFileSync(path.join(__dirname, '..', '..', 'load-balancer', 'nginx.conf'), 'utf8');

const requiredIpv6Cidrs = [
    '2400:cb00::/32',
    '2606:4700::/32',
    '2803:f800::/32',
    '2405:b500::/32',
    '2405:8100::/32',
    '2a06:98c0::/29',
    '2c0f:f248::/32'
];

requiredIpv6Cidrs.forEach(cidr => {
    assert(nginxContent.includes(cidr), `Nginx must include Cloudflare IPv6 CIDR: ${cidr}`);
});
console.log('✅ [PASS] Nginx configuration includes all 7 Cloudflare IPv6 CIDR blocks');

assert(nginxContent.includes('real_ip_header CF-Connecting-IP;'), 'Nginx must specify CF-Connecting-IP as real_ip_header');
assert(nginxContent.includes('real_ip_recursive on;'), 'Nginx must enable real_ip_recursive');
assert(nginxContent.includes('proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;'), 'Nginx must pass CF-Connecting-IP upstream');
assert(nginxContent.includes('proxy_set_header CF-Ray $http_cf_ray;'), 'Nginx must pass CF-Ray upstream');
assert(nginxContent.includes('proxy_set_header CF-IPCountry $http_cf_ipcountry;'), 'Nginx must pass CF-IPCountry upstream');
console.log('✅ [PASS] Nginx configuration properly forwards CF-Connecting-IP, CF-Ray, and CF-IPCountry');

console.log('\n====================================================');
console.log('🎉 ALL CLOUDFLARE SECURITY TESTS PASSED!');
console.log('====================================================\n');
process.exit(0);
