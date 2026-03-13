# Firestore Security Rules Documentation

## Overview

This document explains the comprehensive Firestore security rules implemented for the Sea Saba Business App. These rules enforce granular, role-based access control at the database level, ensuring that all data access is properly authorized regardless of client-side code.

---

## Security Principles

### 1. **Defense in Depth**
- Security rules are enforced at the database level
- Client-side permission checks provide UX, server-side rules provide security
- No way to bypass security rules from client code

### 2. **Principle of Least Privilege**
- Users only have access to data they need for their role
- Permission levels are hierarchical: `edit` > `create` > `view`
- Archived users have zero access to all data

### 3. **Data Integrity**
- Users cannot be deleted (only archived)
- Audit trails preserved via `createdBy` and timestamps
- Hotel staff scoped to their assigned hotel

---

## Helper Functions

### `isSignedIn()`
Checks if the user is authenticated via Firebase Auth.

```javascript
function isSignedIn() {
  return request.auth != null;
}
```

### `isActive()`
Checks if user is signed in AND not archived. This is the foundation of all access control.

```javascript
function isActive() {
  return isSignedIn() && getUserData().archived != true;
}
```

**Critical:** Archived users are completely blocked from all operations.

### `getUserData()`
Retrieves the current user's document from the `users` collection.

```javascript
function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}
```

### `isAdmin()`
Checks if user has admin role. Admins bypass all permission checks.

```javascript
function isAdmin() {
  return isActive() && getUserData().role == 'admin';
}
```

### `isHotelStaff()`
Checks if user has any hotel-related role (for backward compatibility).

```javascript
function isHotelStaff() {
  return isActive() && getUserData().role in ['hotel-staff', 'hotel-manager', 'manager'];
}
```

### `hasPermission(module, level)`
The core permission checking function. Implements the granular permission system.

```javascript
function hasPermission(module, level) {
  let user = getUserData();
  
  // Admins have all permissions
  if (user.role == 'admin') {
    return true;
  }
  
  // Check if user has permissions object
  if (!('permissions' in user)) {
    return false;
  }
  
  // Get the permission level for the module
  let userLevel = user.permissions[module];
  
  // Map permission levels to numeric values
  let levelValue = level == 'edit' ? 3 : (level == 'create' ? 2 : (level == 'view' ? 1 : 0));
  let userLevelValue = userLevel == 'edit' ? 3 : (userLevel == 'create' ? 2 : (userLevel == 'view' ? 1 : 0));
  
  // User must have equal or higher permission level
  return userLevelValue >= levelValue;
}
```

**Modules:** `diveLog`, `maintenance`, `contracts`, `operations`  
**Levels:** `view` (1), `create` (2), `edit` (3)

---

## Collection Rules

### Users Collection

| Operation | Rule |
|-----------|------|
| **Read** | Own document OR admin |
| **Create** | Admin only |
| **Update** | Own `name` and `preferences` OR admin can update anything |
| **Delete** | Never (use archiving) |

**Key Points:**
- Users can only read their own profile (except admins)
- Users can update their display name and preferences
- Admins can modify roles, permissions, and archive status
- User documents are never deleted to preserve audit trails

### Dive Log Module

#### Dives Collection

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('diveLog', 'view')` |
| **Create** | `hasPermission('diveLog', 'create')` |
| **Update** | `hasPermission('diveLog', 'edit')` |
| **Delete** | Admin OR `hasPermission('diveLog', 'edit')` |

#### Reference Data (boats, guides, sites, species)

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('diveLog', 'view')` |
| **Create** | Admin only |
| **Update** | Admin only |
| **Delete** | Admin only |

**Rationale:** Reference data is managed centrally by admins to maintain consistency.

### Maintenance Module

#### Assets Collection

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('maintenance', 'view')` |
| **Create** | `hasPermission('maintenance', 'create')` |
| **Update** | `hasPermission('maintenance', 'edit')` |
| **Delete** | Admin OR `hasPermission('maintenance', 'edit')` |

#### Maintenance Logs Collection

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('maintenance', 'view')` |
| **Create** | `hasPermission('maintenance', 'create')` |
| **Update** | `hasPermission('maintenance', 'edit')` |
| **Delete** | Admin OR `hasPermission('maintenance', 'edit')` |

#### Technicians Collection

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('maintenance', 'view')` |
| **Create** | Admin OR `hasPermission('maintenance', 'edit')` |
| **Update** | Admin OR `hasPermission('maintenance', 'edit')` |
| **Delete** | Admin OR `hasPermission('maintenance', 'edit')` |

### Contracts Module

#### Hotels Collection

| Operation | Rule |
|-----------|------|
| **Read** | Any active user |
| **Create** | Admin only |
| **Update** | Admin OR hotel staff for their assigned hotel |
| **Delete** | Admin only |

**Special Rule:** Hotel staff can only update the hotel they're assigned to:
```javascript
allow update: if isAdmin() || (isHotelStaff() && getUserData().hotelId == hotelId);
```

#### Configuration Collections (roomCategories, roomTypes, seasons, rates, divePackages, mealPackages)

| Operation | Rule |
|-----------|------|
| **Read** | Any active user |
| **Create** | Admin OR `hasPermission('contracts', 'edit')` |
| **Update** | Admin OR `hasPermission('contracts', 'edit')` |
| **Delete** | Admin OR `hasPermission('contracts', 'edit')` |

**Rationale:** Configuration data needs to be readable by anyone creating contracts, but only modified by authorized users.

#### Group Contracts Collection

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('contracts', 'view')` |
| **Create** | `hasPermission('contracts', 'create')` |
| **Update** | `hasPermission('contracts', 'edit')` |
| **Delete** | Admin only |

**Subcollection: Contract Notes**

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('contracts', 'view')` |
| **Create** | `hasPermission('contracts', 'create')` |
| **Update** | Never (immutable) |
| **Delete** | Admin OR `hasPermission('contracts', 'edit')` |

**Rationale:** Notes are immutable once created to maintain audit trail.

#### Payments Collection

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('contracts', 'view')` |
| **Create** | `hasPermission('contracts', 'create')` |
| **Update** | `hasPermission('contracts', 'edit')` |
| **Delete** | Admin OR `hasPermission('contracts', 'edit')` |

### Operations Module

#### Customers, Day Manifests Collections

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('operations', 'view')` |
| **Create** | `hasPermission('operations', 'create')` |
| **Update** | `hasPermission('operations', 'edit')` |
| **Delete** | Admin OR `hasPermission('operations', 'edit')` |

#### Crew, Taxis Collections

| Operation | Rule |
|-----------|------|
| **Read** | `hasPermission('operations', 'view')` |
| **Create** | Admin OR `hasPermission('operations', 'edit')` |
| **Update** | Admin OR `hasPermission('operations', 'edit')` |
| **Delete** | Admin OR `hasPermission('operations', 'edit')` |

---

## Permission Matrix

### Default Permissions by Role

| Role | Contracts | Dive Log | Maintenance | Operations |
|------|-----------|----------|-------------|------------|
| **Admin** | edit | edit | edit | edit |
| **Hotel Manager** | edit | create | view | create |
| **Hotel Staff** | view | create | view | create |
| **Employee** | null | create | view | create |
| **Viewer** | null | view | null | null |
| **Archived** | null | null | null | null |

### Permission Level Hierarchy

```
edit (3)    - Full access: read, create, update, delete
  ↓
create (2)  - Can read and create new entries
  ↓
view (1)    - Read-only access
  ↓
null (0)    - No access
```

**Example:** A user with `create` permission can also `view`, but cannot `edit` or `delete`.

---

## User Archiving

### How It Works

1. **Archive Action:**
   - Set `archived: true` on user document
   - Set all permissions to `null`
   - User immediately loses all access

2. **Unarchive Action:**
   - Set `archived: false`
   - Restore default permissions based on role
   - User regains access based on role

3. **Security Enforcement:**
   - `isActive()` function blocks archived users
   - All collection rules require `isActive()` or specific permissions
   - Archived users cannot access ANY data

### Why Not Delete?

- Preserves audit trails (`createdBy` fields)
- Maintains data integrity
- Allows reversible access control
- Complies with data retention policies

---

## Hotel Staff Scoping

Hotel staff and managers are assigned to a specific hotel via the `hotelId` field in their user document.

### Enforcement

```javascript
// Hotels collection
allow update: if isAdmin() || (isHotelStaff() && getUserData().hotelId == hotelId);
```

### Implications

- Hotel staff can only modify their assigned hotel
- Hotel staff can view all hotels (needed for contract creation)
- Hotel staff cannot create or delete hotels
- Admins can modify any hotel

---

## Testing Security Rules

### Firebase Console Rules Playground

1. Navigate to Firestore → Rules
2. Click "Rules Playground"
3. Select a collection and operation
4. Set authentication UID
5. Test the rule

### Example Test Cases

#### Test 1: Archived User Access
```
Collection: dives
Operation: read
Auth UID: user123 (archived: true)
Expected: DENY
```

#### Test 2: Hotel Staff Hotel Update
```
Collection: hotels/hotel456
Operation: update
Auth UID: user123 (role: hotel-staff, hotelId: hotel456)
Expected: ALLOW
```

#### Test 3: Employee Dive Creation
```
Collection: dives
Operation: create
Auth UID: user123 (role: employee, permissions.diveLog: create)
Expected: ALLOW
```

#### Test 4: Viewer Contract Access
```
Collection: groupContracts
Operation: read
Auth UID: user123 (role: viewer, permissions.contracts: null)
Expected: DENY
```

---

## Deployment

### Deploy Rules

```bash
firebase deploy --only firestore:rules
```

### Verify Deployment

1. Check Firebase Console → Firestore → Rules
2. Verify "Last deployed" timestamp
3. Test critical rules in Rules Playground

### Rollback (if needed)

```bash
# View previous versions
firebase firestore:rules:list

# Rollback to specific version
firebase firestore:rules:release <release-name>
```

---

## Common Issues & Solutions

### Issue: "Missing or insufficient permissions"

**Cause:** User doesn't have required permission level for the operation.

**Solution:**
1. Check user's `permissions` object in Firestore
2. Verify user is not archived
3. Ensure user has appropriate permission level (view/create/edit)

### Issue: "User can't update their hotel"

**Cause:** User's `hotelId` doesn't match the hotel they're trying to update.

**Solution:**
1. Verify user's `hotelId` field in user document
2. Ensure user has `hotel-staff` or `hotel-manager` role
3. Check that hotel document ID matches user's `hotelId`

### Issue: "Admin can't access data"

**Cause:** User document might be missing or corrupted.

**Solution:**
1. Verify user document exists in `users` collection
2. Check that `role` field is exactly `'admin'`
3. Ensure user is not archived

### Issue: "Rules are too slow"

**Cause:** `getUserData()` function makes an additional read on every operation.

**Solution:**
- This is expected behavior for security
- Firebase caches user documents
- Performance impact is minimal (<50ms typically)
- Alternative: Use custom claims (requires Cloud Functions)

---

## Best Practices

### For Administrators

1. **Never delete users** - Always use archiving
2. **Test rules before deploying** - Use Rules Playground
3. **Monitor security violations** - Check Firebase Console logs
4. **Keep permissions minimal** - Only grant what's needed
5. **Regular audits** - Review user permissions quarterly

### For Developers

1. **Match client-side checks to rules** - Provide good UX
2. **Handle permission errors gracefully** - Show helpful messages
3. **Test with different roles** - Verify all permission levels
4. **Don't rely on client-side security** - Rules are the source of truth
5. **Document permission requirements** - In code comments

### For Security

1. **Monitor failed auth attempts** - Set up alerts
2. **Review rule changes** - Require code review
3. **Test edge cases** - Archived users, missing permissions, etc.
4. **Keep rules simple** - Complex rules are hard to audit
5. **Use version control** - Track all rule changes

---

## Migration Guide

### Migrating from Open Rules

If you're migrating from wide-open rules (`allow read, write: if true`), follow these steps:

#### Phase 1: Prepare User Documents (CRITICAL)

```javascript
// Ensure ALL users have required fields
{
  uid: "user123",
  email: "user@example.com",
  name: "John Doe",
  role: "employee",  // REQUIRED
  archived: false,   // REQUIRED
  permissions: {     // REQUIRED
    diveLog: "create",
    maintenance: "view",
    contracts: null,
    operations: "create"
  },
  hotelId: null,     // Required for hotel-staff
  createdAt: "2024-01-01T00:00:00Z"
}
```

**Migration Script:**
```javascript
// Run this in Firebase Console or Cloud Function
const users = await db.collection('users').get();
for (const doc of users.docs) {
  const data = doc.data();
  
  // Add missing fields
  const updates = {};
  if (!data.archived) updates.archived = false;
  if (!data.permissions) {
    // Set default permissions based on role
    updates.permissions = getDefaultPermissions(data.role);
  }
  
  if (Object.keys(updates).length > 0) {
    await doc.ref.update(updates);
  }
}
```

#### Phase 2: Deploy Rules

```bash
# Test in a development environment first!
firebase deploy --only firestore:rules --project dev-project

# If tests pass, deploy to production
firebase deploy --only firestore:rules --project prod-project
```

#### Phase 3: Verify Access

1. Test with each role type
2. Verify archived users are blocked
3. Check hotel staff scoping works
4. Monitor error logs for 24 hours

#### Phase 4: Fix Issues

If users report access issues:
1. Check their user document has all required fields
2. Verify permissions are set correctly
3. Ensure they're not archived
4. Check Firebase Console logs for specific errors

---

## Appendix: Complete Rules Reference

See `firestore.rules` file for the complete, production-ready security rules.

### Collections Covered

- ✅ users
- ✅ dives
- ✅ boats
- ✅ guides
- ✅ sites
- ✅ species
- ✅ assets
- ✅ maintenanceLogs
- ✅ technicians
- ✅ hotels
- ✅ roomCategories
- ✅ roomTypes
- ✅ seasons
- ✅ rates
- ✅ divePackages
- ✅ mealPackages
- ✅ groupContracts
- ✅ groupContracts/{id}/notes
- ✅ payments
- ✅ customers
- ✅ dayManifests
- ✅ crew
- ✅ taxis

### Default Deny Rule

All collections not explicitly listed are denied by default:

```javascript
match /{document=**} {
  allow read, write: if false;
}
```

This ensures new collections are secure by default.

---

**Last Updated:** March 2026  
**Version:** 1.0  
**Maintained By:** Development Team
