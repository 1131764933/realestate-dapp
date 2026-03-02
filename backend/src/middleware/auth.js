const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// Auth0 配置
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'dev-pif4ht6v60w4enxg.us.auth0.com';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'https://realestate-api';

// JWT 验证中间件
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    audience: AUTH0_AUDIENCE,
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
});

// 可选的认证中间件（不强制要求登录）
const optionalJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    // 暂时不验证 audience
    // audience: AUTH0_AUDIENCE,
    issuer: `https://${AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
    credentialsRequired: false
});

// 错误处理中间件
const handleAuthError = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ 
            error: 'Invalid or expired token',
            message: err.message 
        });
    }
    next(err);
};

module.exports = {
    checkJwt,
    optionalJwt,
    handleAuthError
};
