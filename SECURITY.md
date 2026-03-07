# Security Policy

## Supported Versions

This project is actively maintained. Security updates are provided for the current production version.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest | :x:               |

## Security Features

### Authentication & Authorization
- Firebase Authentication with role-based access control
- Granular permission system (view/create/edit levels per module)
- User archiving to disable access while preserving data
- Hotel staff scoped to specific properties
- Real-time permission updates via Firestore listeners

### Data Protection
- Firestore Security Rules enforce all access controls at database level
- Encrypted data transmission (HTTPS/TLS)
- No client-side permission bypasses possible
- Archived users completely blocked from all access
- Hotel staff can only access their assigned hotel data

### Security Rules
All data access is protected by comprehensive Firestore Security Rules that:
- Require authentication for all operations
- Block archived users (`archived != true`)
- Enforce module-based permissions (diveLog, maintenance, contracts)
- Validate permission levels (view < create < edit)
- Scope hotel staff to their assigned `hotelId`
- Prevent unauthorized data modification

See `firestore.rules` for complete security rule implementation.

## Reporting a Vulnerability

If you discover a security vulnerability in this application, please report it responsibly:

### Contact
- **Email:** [security@seasaba.com]
- **Response Time:** We aim to acknowledge reports within 48 hours
- **Updates:** You will receive updates on the status of your report weekly

### What to Include
1. Description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact assessment
4. Suggested fix (if available)

### What to Expect
- **Acknowledgment:** Within 48 hours of report
- **Initial Assessment:** Within 1 week
- **Fix Timeline:** Critical issues within 2 weeks, others within 30 days
- **Disclosure:** We will coordinate disclosure timing with you
- **Credit:** Security researchers will be credited (unless they prefer anonymity)

### Out of Scope
- Vulnerabilities in third-party dependencies (report to the dependency maintainers)
- Social engineering attacks
- Physical security issues
- Denial of service attacks

## Security Best Practices

### For Administrators
- Use strong, unique passwords for all accounts
- Enable two-factor authentication when available
- Regularly review user permissions and access logs
- Archive users immediately upon termination
- Keep Firebase SDK and dependencies up to date
- Monitor Firebase console for security rule violations

### For Developers
- Never commit API keys or secrets to version control
- Use environment variables for all sensitive configuration
- Follow principle of least privilege for all operations
- Validate all user input on both client and server
- Keep dependencies updated and monitor for vulnerabilities
- Test security rules thoroughly before deployment
- Use TypeScript for type safety and reduced bugs

### For Users
- Use strong, unique passwords
- Do not share login credentials
- Report suspicious activity immediately
- Log out when using shared devices
- Keep your contact information up to date

## Compliance

This application handles business operational data and implements:
- Role-based access control (RBAC)
- Audit trails via Firestore timestamps and `createdBy` fields
- Data retention policies (archived users, not deleted)
- Secure data transmission (HTTPS only)

## Security Updates

Security updates are deployed as follows:
1. **Critical vulnerabilities:** Immediate hotfix deployment
2. **High severity:** Within 1 week
3. **Medium severity:** Within 30 days
4. **Low severity:** Next scheduled release

Users will be notified of security updates via:
- In-app notifications
- Email to administrators
- Release notes in repository

## Additional Resources

- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Last Updated:** March 2026  
**Next Review:** Quarterly
