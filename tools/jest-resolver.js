/**
 * Custom Jest resolver to fix .d.ts file loading issue in Nx 22.2.3
 * This wraps the Nx resolver but ensures .d.ts files are never returned
 */
const nxResolver = require('@nx/jest/plugins/resolver');
const path = require('path');

module.exports = function (modulePath, options) {
    const result = nxResolver(modulePath, options);
    
    // If the resolver returned a .d.ts file, try to find the corresponding .js file
    if (result && result.endsWith('.d.ts')) {
        const jsFile = result.replace(/\.d\.ts$/, '.js');
        const fs = require('fs');
        if (fs.existsSync(jsFile)) {
            return jsFile;
        }
    }
    
    return result;
};
