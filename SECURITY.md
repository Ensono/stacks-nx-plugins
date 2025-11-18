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

### 4. glob - CVE-2025-64756 (High) ✅ FIXED
- **Issue**: Command injection via -c/--cmd executes matches with shell:true
- **Path**: `.>@nx/jest>@jest/reporters>glob` and `.>rimraf>glob`
- **Vulnerable Versions**: >= 10.3.7, <= 11.0.3
- **Patched Version**: 11.1.0
- **Solution**: Added pnpm override to enforce `glob@>=11.1.0`
- **Status**: Fixed and verified via pnpm audit

### 5. js-yaml - CVE-2025-64718 (Moderate) ✅ FIXED
- **Issue**: Prototype pollution in merge (<<) function
- **Path**: Multiple paths including `.>@commitlint/cli>@commitlint/load>cosmiconfig>js-yaml` and Nx dependencies
- **Vulnerable Versions**: < 3.14.2 and >= 4.0.0, < 4.1.1
- **Patched Versions**: >= 3.14.2 for 3.x, >= 4.1.1 for 4.x
- **Solution**: Added pnpm overrides to enforce patched versions
- **Status**: Fixed and verified via pnpm audit

### 6. validator - CVE-2025-56200 (Moderate) ✅ FIXED
- **Issue**: URL validation bypass vulnerability in validator.js
- **Path**: `.>verdaccio>@verdaccio/url>validator`
- **Vulnerable Versions**: < 13.15.20
- **Patched Version**: 13.15.20
- **Solution**: Added pnpm override to enforce `validator@>=13.15.20`
- **Status**: Fixed and verified - now using v13.15.22

## Remaining Vulnerabilities (No Patch Available)

### 1. fast-redact - CVE-2025-57319 (Low) ⚠️ NO PATCH AVAILABLE
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

- **Total Vulnerabilities Identified**: 7
- **Fixed**: 6 (86%)
- **Remaining**: 1 (14%)
- **Remaining Severity**: 1 Low
- **All remaining vulnerabilities are dev dependencies with no production impact**

## Recommendations

1. Monitor for updates to `fast-redact` package
2. Consider alternatives to Verdaccio if this vulnerability becomes critical
3. Run `pnpm audit` regularly to check for newly available patches
4. All production dependencies are secure with no known vulnerabilities

