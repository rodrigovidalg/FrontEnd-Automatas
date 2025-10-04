// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://lexicoreapi-production.up.railway.app',
      changeOrigin: true,
      // si el backend usa HTTPS con certs estrictos y hay problemas, usa secure:false
      // secure: false,
      // opcional: reescritura si tu front pide /api/... y el backend también usa /api/...
      pathRewrite: { '^/api': '/api' },
    })
  );
};
