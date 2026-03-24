// Deprecated compatibility layer. New code should import verifyToken/optionalAuthenticateToken
// from verifyToken.js and allowRoles from roleAccess.js.
export { default as authenticateToken, optionalAuthenticateToken } from './verifyToken.js';
export { allowRoles as authorizeRoles } from './roleAccess.js';
