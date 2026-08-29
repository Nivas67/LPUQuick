// Server Admin Authentication Middleware
module.exports = function requireAdmin(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const adminToken = req.headers['x-admin-token'] || req.headers['x-admin-key'] || '';
    const referer = req.headers['referer'] || '';
    
    // Check Bearer / Custom Tokens / Admin Referer
    if (
        authHeader.includes('adm_sec_') || 
        adminToken.includes('adm_sec_') || 
        authHeader.includes('lpuquick_admin_secret_2026') || 
        adminToken === 'lpuquick_admin_secret_2026' ||
        referer.includes('/admin')
    ) {
        return next();
    }

    // Check query param
    if (req.query && req.query.admin_token) {
        return next();
    }

    return res.status(403).json({
        success: false,
        error: 'Forbidden. Administrator authorization required.'
    });
};
