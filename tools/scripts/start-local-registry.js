/**
 * Wrapper to run TypeScript globalSetup with tsx for Jest 30 compatibility
 */
const { register } = require('tsx/cjs');
const unregister = register();
try {
    module.exports = require('./start-local-registry.ts').default;
} finally {
    unregister();
}
