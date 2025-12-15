/**
 * Wrapper to run TypeScript globalTeardown with tsx for Jest 30 compatibility
 */
const { register } = require('tsx/cjs');
const unregister = register();
try {
    module.exports = require('./stop-local-registry.ts').default;
} finally {
    unregister();
}
