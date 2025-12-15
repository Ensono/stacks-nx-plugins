/**
 * Wrapper to run TypeScript globalSetup with ts-node for Jest 30 compatibility
 */
require('ts-node/register');
module.exports = require('./start-local-registry.ts').default;
