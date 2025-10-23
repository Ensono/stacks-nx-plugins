# Security Vulnerability Status

## Fixed Vulnerabilities

### 1. Playwright - CVE-2025-59288 (Moderate) ✅ FIXED
- **Issue**: Improper verification of cryptographic signature in Playwright allows an unauthorized attacker to perform spoofing over an adjacent network.
- **Solution**: Updated `@playwright/test` from `^1.36.0` to `^1.55.1`
- **Status**: Fixed in package.json and verified via pnpm audit

### 2. Koa - GHSA-g8mr-fgfg-5qpc (Moderate) ✅ FIXED
- **Issue**: Koa Vulnerable to Open Redirect via Trailing Double-Slash (//) in back Redirect Logic
- **Solution**: Added pnpm override to enforce `koa@>=3.0.3`
- **Status**: Fixed and verified - no longer appears in pnpm audit

### 3. Vite - GHSA-93m4-6634-74q7 (Moderate) ✅ FIXED
- **Issue**: Vite allows server.fs.deny bypass via backslash on Windows
- **Solution**: Added pnpm override to enforce `vite@>=7.1.11` (updated to 7.1.12)
- **Status**: Fixed and verified via pnpm audit

## Remaining Vulnerabilities (No Patch Available)

### 1. validator - CVE-2025-56200 (Moderate) ⚠️ NO PATCH AVAILABLE
- **Issue**: URL validation bypass vulnerability in validator.js through version 13.15.15
- **Path**: `.>verdaccio>@verdaccio/url>validator`
- **Current Version**: 13.12.0
- **Patched Versions**: None available (`<0.0.0` per advisory)
- **Impact**: Dev dependency only (used by Verdaccio for local registry testing)
- **Mitigation**: 
  - This is a dev dependency used only for local development and testing
  - The vulnerability affects URL validation which is not used in our code paths
  - Monitor for updates to validator package
- **Advisory**: https://github.com/advisories/GHSA-9965-vmph-33xx

### 2. fast-redact - CVE-2025-57319 (Low) ⚠️ NO PATCH AVAILABLE
- **Issue**: Prototype Pollution vulnerability in the nestedRestore function
- **Path**: `.>verdaccio>@verdaccio/logger>pino>fast-redact`
- **Current Version**: 3.5.0
- **Patched Versions**: None available (`<0.0.0` per advisory)
- **Impact**: Dev dependency only (used by Verdaccio logging)
- **Severity**: Low
- **Mitigation**: 
  - This is a dev dependency used only for local development and testing
  - The vulnerability is low severity and affects logging functionality
  - Monitor for updates to fast-redact package
- **Advisory**: https://github.com/advisories/GHSA-ffrw-9mx8-89p8

## Summary

- **Total Vulnerabilities Identified**: 5
- **Fixed**: 3 (60%)
- **Remaining**: 2 (40%)
- **Remaining Severity**: 1 Moderate, 1 Low
- **All remaining vulnerabilities are dev dependencies with no production impact**

## Recommendations

1. Monitor for updates to `validator` and `fast-redact` packages
2. Consider alternatives to Verdaccio if these vulnerabilities become critical
3. Run `pnpm audit` regularly to check for newly available patches
4. All production dependencies are secure with no known vulnerabilities
