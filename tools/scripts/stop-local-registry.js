/**
 * Wrapper to run TypeScript globalTeardown with ts-node for Jest 30 compatibility
 */
require('ts-node/register');
module.exports = require('./stop-local-registry.ts').default;
