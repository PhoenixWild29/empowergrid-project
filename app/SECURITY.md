# Security Policy

## Supported Versions

We actively support and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Vulnerabilities

### Known Vulnerabilities

#### CVE-2025-3194: bigint-buffer Buffer Overflow

**Status**: Mitigated with patch  
**Severity**: High (CVSS 7.7)  
**Advisory**: [GHSA-3gc7-fjrx-p6mg](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg)

**Description**:
The `bigint-buffer` package (versions <= 1.1.5) is vulnerable to a buffer overflow in the `toBigIntLE()` function. This is a transitive dependency through `@solana/spl-token` → `@solana/buffer-layout-utils` → `bigint-buffer`.

**Impact**:
- Attackers can exploit this vulnerability to crash the application
- No patched version is currently available from the upstream maintainer

**Mitigation**:
We have implemented a security patch using `patch-package` that adds input validation to prevent buffer overflow:
- Validates that input is a valid Buffer instance
- Limits buffer size to 64KB maximum to prevent overflow
- Applied automatically via `postinstall` script

**Patch Location**: `patches/bigint-buffer+1.1.5.patch`

**Monitoring**:
- Monitoring for updates from Solana team (`@solana/spl-token`)
- Monitoring for patched version of `bigint-buffer`
- Regularly checking [GitHub Advisory Database](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg)

**Dependency Chain**:
```
@solana/spl-token@0.4.14
  └── @solana/buffer-layout-utils@0.2.0
      └── bigint-buffer@1.1.5 (vulnerable, patched)
```

## Reporting a Vulnerability

If you discover a security vulnerability, please report it to:

**Email**: security@empowergrid.io (if available)  
**GitHub**: Create a private security advisory at https://github.com/PhoenixWild29/empowergrid-project/security/advisories

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Best Practices

1. **Keep dependencies updated**: Regularly run `npm audit` and `npm update`
2. **Review security advisories**: Monitor GitHub Security Advisories
3. **Use dependency overrides**: Explicitly control vulnerable transitive dependencies
4. **Apply patches**: Use `patch-package` for critical security fixes when upstream patches are unavailable
5. **Validate inputs**: Always validate user inputs and external data
6. **Monitor logs**: Regularly review application logs for suspicious activity

## Security Checklist

- [x] CVE-2025-3194: bigint-buffer - Mitigated with patch
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Security monitoring in place

## References

- [GitHub Advisory Database](https://github.com/advisories)
- [NPM Security Advisories](https://www.npmjs.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln)

