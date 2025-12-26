# Sea Saba Business App - Project Map

**Purpose**: Comprehensive guide for AI agents and developers navigating the ContractBuilder codebase.

**Last Updated**: December 23, 2025

---

## 📋 Project Overview

**Application**: Sea Saba Business App - Dive operations management platform  
**Tech Stack**: Next.js 14 (App Router), React 18, TypeScript, Firebase (Firestore/Auth/Storage), Chakra UI  
**Primary Business**: Dive shop operations, contract management, maintenance tracking, business analytics

---

## 🗂️ Repository Structure

```
ContractBuilder/
├── contract_builder/          # Main Next.js application
│   ├── src/                   # Source code
│   ├── docs/                  # Documentation
│   ├── tools/                 # Utility scripts (Checkfront integration)
│   ├── package.json           # Dependencies & scripts
│   └── next.config.mjs        # Next.js configuration
├── functions/                 # Firebase Cloud Functions
│   └── src/index.ts          # getDivesByDate API endpoint
├── scripts/                   # Data migration scripts
│   ├── dives.csv             # Historical dive data
│   └── migrateDives.ts       # Dive data migration utility
├── .github/                   # GitHub configuration
│   ├── copilot-instructions.md  # AI agent guidelines
│   └── dependabot.yml        # Dependency updates
├── firebase.json              # Firebase project configuration
├── firestore.rules           # Database security rules
├── firestore.indexes.json    # Database indexes
├── storage.rules             # Storage security rules
└── README.md                 # Project documentation
```

---

## 🎯 Core Application Structure

### `contract_builder/src/` Directory Map

```
src/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Home/dashboard
│   ├── layout.tsx           # Root layout with navigation
│   ├── admin/               # Admin-only features
│   ├── contracts/           # Contract management
│   ├── dive-packages/       # Dive package configuration
│   ├── dives/               # Dive logging & analytics
│   ├── hotel-staff/         # Hotel staff portal
│   ├── hotels/              # Hotel management
│   ├── login/               # Authentication
│   ├── maintenance/         # Maintenance tracking
│   ├── manifests/           # Dive manifests
│   ├── operations/          # Operations management
│   ├── profile/             # User profile
│   └── register/            # User registration
├── components/              # Reusable UI components
│   ├── shared/             # Shared components
│   └── ui/                 # UI primitives
├── context/                # React Context providers
│   ├── AuthContext.tsx     # Authentication state
│   └── PermissionProvider.tsx  # Permission management
├── lib/                    # Core libraries
│   └── firebase.ts         # Firebase initialization
├── services/               # Firebase service layer (27 files)
├── types/                  # TypeScript type definitions (11 files)
├── utils/                  # Utility functions (15 files)
└── theme.ts               # Chakra UI theme configuration
```

---

## 🔑 Key Modules & Features

### 1. **Admin Module** (`src/app/admin/`)
**Purpose**: System configuration and user management  
**Permission Required**: Admin role

**Pages**:
- `@/admin/boats/page.tsx` - Fleet management
- `@/admin/guides/page.tsx` - Dive guide profiles
- `@/admin/sites/page.tsx` - Dive site database
- `@/admin/species/page.tsx` - Marine life catalog
- `@/admin/users/page.tsx` - User management & permissions

**Key Features**:
- Granular permission assignment (view/create/edit per module)
- User archiving (disable access while preserving data)
- Hotel assignment for staff
- Role management (admin, hotel-staff, hotel-manager, viewer)

---

### 2. **Dive Operations Module** (`src/app/dives/`)
**Purpose**: Dive logging, history, and analytics  
**Permission Required**: `diveLog` module access

**Pages**:
- `@/dives/log/page.tsx` - Daily dive logging interface
- `@/dives/view/page.tsx` - Dive history & search
- `@/dives/dashboard/page.tsx` - Analytics & insights
- `@/dives/edit/[id]/page.tsx` - Edit existing dive records

**Key Features**:
- Record dives with sites, guides, customers, conditions
- Species tracking for marine life sightings
- 7-day site matrices for pattern analysis
- Guide performance metrics
- Temperature trend analysis
- Seasonal wildlife patterns

**Related Services**:
- `@/services/dives.ts` - Dive CRUD operations
- `@/services/diveDashboard.ts` - Analytics calculations
- `@/services/sites.ts` - Dive site management
- `@/services/guides.ts` - Guide management
- `@/services/species.ts` - Species catalog

---

### 3. **Contract Management Module** (`src/app/contracts/`)
**Purpose**: Group contract creation and management  
**Permission Required**: `contracts` module access

**Pages**:
- `@/contracts/page.tsx` - Contract listing
- `@/contracts/[id]/view/page.tsx` - View contract details

**Key Components**:
- `GroupContractWizard.tsx` - Multi-step contract creation
- `GroupContractForm.tsx` - Basic contract info
- `RoomSelectionForm.tsx` - Hotel room selection
- `DivePackageSelectionForm.tsx` - Dive package selection
- `MealPackageSelectionForm.tsx` - Meal options
- `TotalCostCalculation.tsx` - Cost summary & PDF generation

**Key Features**:
- Step-by-step wizard with form persistence
- Automated FOC (Free of Charge) calculations (7+1 diver rule)
- Multi-tier commission engine
- Seasonal pricing support
- PDF contract generation
- Hotel-specific access control

**Related Services**:
- `@/services/groupContracts.ts` - Contract CRUD
- `@/services/hotels.ts` - Hotel data
- `@/services/divePackages.ts` - Dive packages
- `@/services/mealPackages.ts` - Meal packages
- `@/services/payments.ts` - Payment tracking

---

### 4. **Maintenance Module** (`src/app/maintenance/`)
**Purpose**: Asset tracking and maintenance logging  
**Permission Required**: `maintenance` module access

**Pages**:
- `@/maintenance/dashboard/page.tsx` - Maintenance overview
- `@/maintenance/logs/page.tsx` - Service records listing
- `@/maintenance/logs/new/page.tsx` - Create maintenance log
- `@/maintenance/logs/[id]/page.tsx` - View/edit log
- `@/maintenance/assets/page.tsx` - Asset management
- `@/maintenance/technicians/page.tsx` - Technician management

**Key Features**:
- Hierarchical asset structure (parent/child assets)
- Asset categories: Marine, Compressors, Vehicles, Scuba Equipment, Other
- Service history tracking with costs
- Next service due date calculations
- Technician activity tracking
- Preventive maintenance scheduling

**Related Services**:
- `@/services/maintenance.ts` - Maintenance log operations
- `@/services/assets.ts` - Asset management
- `@/services/technicians.ts` - Technician management

---

### 5. **Operations Module** (`src/app/operations/`)
**Purpose**: Daily operations management  
**Permission Required**: `operations` module access

**Pages**:
- `@/operations/manage-boats/page.tsx` - Boat scheduling
- `@/operations/manage-crew/page.tsx` - Crew management
- `@/operations/manage-taxis/page.tsx` - Taxi coordination

**Related Services**:
- `@/services/boats.ts` - Boat management
- `@/services/crew.ts` - Crew scheduling
- `@/services/taxis.ts` - Taxi operations

---

### 6. **Manifests Module** (`src/app/manifests/`)
**Purpose**: Dive manifest generation and management  
**Permission Required**: Module access

**Pages**:
- `@/manifests/page.tsx` - Manifest creation & viewing

**Related Services**:
- `@/services/manifests.ts` - Manifest operations
- `@/services/customers.ts` - Customer data

---

### 7. **Hotel Management** (`src/app/hotels/`)
**Purpose**: Hotel configuration and room management  
**Permission Required**: Admin or hotel-specific access

**Pages**:
- `@/hotels/page.tsx` - Hotel listing & configuration

**Related Services**:
- `@/services/hotels.ts` - Hotel CRUD
- `@/services/roomTypes.ts` - Room type management
- `@/services/roomCategories.ts` - Room categories
- `@/services/seasons.ts` - Seasonal rates
- `@/services/rates.ts` - Rate management
- `@/services/rateSync.ts` - Rate synchronization

---

## 🔐 Authentication & Permissions System

### Authentication Flow
**Location**: `@/context/AuthContext.tsx`

**Process**:
1. Firebase Auth handles user authentication
2. User document fetched from `users/{uid}` collection
3. Role and permissions loaded into context
4. Real-time listeners update permissions dynamically

### User Roles & Access Control

**User Types**:
1. **Internal Employees** - Have module permissions granular access
   - `admin` - Full system access, all modules
   - Internal staff with specific module permissions (contracts, diveLog, maintenance, operations)
   
2. **Hotel Staff** - Hotel-specific access, no module permissions
   - `hotel-manager` - Full access to their hotel's contracts and data
   - `hotel-staff` - View/edit access to their hotel's contracts and data
   
3. **Special Roles**:
   - `viewer` - Read-only access (default for internal employees without permissions)
   - `archived` - Disabled access (data preserved)

### Permission Structure

**Modules** (Internal Employees only):
- `diveLog` - Dive logging operations
- `maintenance` - Maintenance tracking  
- `contracts` - Contract management
- `operations` - Operations management (including guest management)

**Permission Levels** (hierarchical):
- `edit` - Full read/write access
- `create` - Can view and create new records
- `view` - Read-only access

**Access Patterns**:
- **Internal Employees**: Access based on module permissions
- **Hotel Staff**: Access to their assigned hotel's data only
- **Admins**: Access to everything, including user management

**Permission Checking**:
```typescript
// In components
import { usePermissions } from '@/context/PermissionProvider';
const { hasPermission, canAccessModule, isInternalEmployee, isHotelStaff } = usePermissions();

// Check module access (internal employees)
if (hasPermission('contracts', 'edit')) {
  // Allow editing contracts
}

// Check hotel access (hotel staff)
if (isHotelStaff && hasHotelAccess(hotelId)) {
  // Allow access to hotel data
}

// Check if user is internal employee
if (isInternalEmployee && canAccessModule('operations')) {
  // Allow operations access
}
```

**Protected Routes**:
- `@/components/shared/LayoutComponents/ProtectedRoute.tsx` - Route-level protection
- `@/components/shared/LayoutComponents/ProtectedPage.tsx` - Page-level protection

---

## 🗄️ Firebase Architecture

### Firestore Collections

**Core Collections**:
- `users` - User profiles, roles, permissions
- `dives` - Dive log entries
- `groupContracts` - Group contracts
- `hotels` - Hotel configurations
- `boats` - Fleet information
- `guides` - Dive guide profiles
- `sites` - Dive site database
- `species` - Marine life catalog
- `maintenanceLogs` - Maintenance records
- `assets` - Company assets
- `technicians` - Maintenance technicians
- `manifests` - Dive manifests
- `crew` - Crew members
- `taxis` - Taxi services
- `customers` - Customer database

**Security Rules**: `@/firestore.rules`
- Role-based access control with internal employee vs hotel staff distinction
- Module permission enforcement for internal employees
- Hotel-specific data isolation for hotel staff
- User archiving support
- Internal employee collections (operations, maintenance, diveLog) restricted to internal staff
- Contract collections accessible by both internal employees (with permissions) and hotel staff (for their hotel)

**Indexes**: `@/firestore.indexes.json`
- Optimized queries for dashboard analytics
- Date-range queries for dive logs
- Multi-field sorting for reports

### Firebase Storage
**Rules**: `@/storage.rules`
- PDF contract storage
- Asset documentation
- User uploads

### Cloud Functions
**Location**: `@/functions/src/index.ts`

**Endpoints**:
- `getDivesByDate` - Aggregated dive data for date ranges
  - Query params: `startDate`, `endDate` (YYYY-MM-DD)
  - Returns: Aggregated dives with boat, site, guides
  - Filters out private boats

---

## 🛠️ Services Layer

**Location**: `@/services/`

All Firebase operations abstracted into service modules:

**Data Management**:
- `assets.ts` - Asset CRUD with hierarchy support
- `boats.ts` - Boat management
- `crew.ts` - Crew scheduling
- `customers.ts` - Customer database
- `divePackages.ts` - Dive package configuration
- `dives.ts` - Dive log operations
- `guides.ts` - Guide management
- `groupContracts.ts` - Contract operations
- `hotels.ts` - Hotel configuration
- `maintenance.ts` - Maintenance logging
- `mealPackages.ts` - Meal package management
- `sites.ts` - Dive site database
- `species.ts` - Species catalog
- `technicians.ts` - Technician management
- `taxis.ts` - Taxi operations
- `users.ts` - User management

**Analytics & Reporting**:
- `diveDashboard.ts` - Dive analytics calculations
- `payments.ts` - Payment tracking & reporting
- `manifests.ts` - Manifest generation

**Configuration**:
- `hotelStaff.ts` - Hotel staff management
- `rates.ts` - Rate management
- `rateSync.ts` - Rate synchronization
- `roomCategories.ts` - Room category config
- `roomTypes.ts` - Room type config
- `seasons.ts` - Seasonal configuration

**Utilities**:
- `fileUpload.ts` - Firebase Storage operations
- `knowledge.ts` - Knowledge base operations

---

## 📊 Type Definitions

**Location**: `@/types/`

**Core Types**:
- `contractTypes.ts` - Contract, hotel, room, package types
- `diveLogTypes.ts` - Dive log entry structure
- `maintenance.ts` - Asset, log, technician types
- `manifestTypes.ts` - Manifest and customer types
- `permissions.ts` - Permission and role types
- `userTypes.ts` - User profile structure
- `dashboard.ts` - Dashboard analytics types
- `formTypes.ts` - Form state types
- `crewTypes.ts` - Crew member types
- `taxiTypes.ts` - Taxi service types
- `knowledge.ts` - Knowledge base types

---

## 🧰 Utility Functions

**Location**: `@/utils/`

**Calculations**:
- `contractCalculations.ts` - FOC logic, commission calculations
- `dashboardFilters.ts` - Analytics filtering & aggregation

**Data Processing**:
- `parsers/` - CSV parsing utilities
  - `csvHelpers.ts` - Shared CSV parsing utilities
  - `checkfrontParser.ts` - Checkfront CSV parsing (equipment, customers)
  - `guestParser.ts` - Guest CSV parsing with duplicate detection
  - `customerImportParser.ts` - Customer import UI logic
  - `customerBatchParser.ts` - Batch processing with duplicate prevention
- `formatDiveValue.ts` - Format dive log values
- `formatters.ts` - General formatting utilities
- `conversions.ts` - Unit conversions

**Date & Time Handling**:
- `datetime/` - Unified date/time utilities
  - `parsers.ts` - Date parsing functions (Firebase, UTC, local)
  - `formatters.ts` - Date formatting functions (short, long, relative)
  - `constants.ts` - Timezone and format constants
  - `index.ts` - Clean exports

**Validation**:
- `validators.ts` - Input validation
- `stringUtils.ts` - String manipulation

**Error Handling**:
- `errorHandler.ts` - Centralized error handling

**Selectors**:
- `maintenanceSelectors.ts` - Maintenance data selectors

**Tests**: `@/utils/__tests__/` - Unit tests for utilities

---

## 🎨 UI Components

### Shared Components
**Location**: `@/components/shared/LayoutComponents/`

- `ProtectedRoute.tsx` - Route-level authentication guard
- `ProtectedPage.tsx` - Page-level permission guard
- `NavLinks.tsx` - Navigation menu with permission-based visibility
- `LogoutButton.tsx` - User logout functionality
- `ThemeToggle.tsx` - Dark/light mode toggle

### Theme Configuration
**Location**: `@/theme.ts`

- Chakra UI theme customization
- Color mode configuration
- Component style overrides

---

## 📝 Development Workflows

### Running the Application

```bash
# Development server
cd contract_builder
npm run dev
# Runs on http://localhost:3000

# Production build
npm run build
npm start

# Testing
npm run test
npm run test:watch

# Linting
npm run lint
```

### Checkfront Integration

```bash
# Login to Checkfront
npm run checkfront:login

# Export waivers
npm run checkfront:export
```

### Firebase Deployment

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy storage rules
firebase deploy --only storage:rules

# Deploy functions
firebase deploy --only functions

# Full deployment
firebase deploy
```

---

## 🔍 Important Files for AI Agents

### Configuration Files
- `@/.github/copilot-instructions.md` - **AI agent guidelines** (read first!)
- `@/contract_builder/package.json` - Dependencies & scripts
- `@/contract_builder/next.config.mjs` - Next.js configuration
- `@/contract_builder/tsconfig.json` - TypeScript configuration
- `@/firebase.json` - Firebase project setup
- `@/firestore.rules` - **Security rules** (critical for permissions)

### Core Application Files
- `@/contract_builder/src/lib/firebase.ts` - Firebase initialization
- `@/contract_builder/src/context/AuthContext.tsx` - Auth state management
- `@/contract_builder/src/context/PermissionProvider.tsx` - Permission system
- `@/contract_builder/src/app/layout.tsx` - Root layout & navigation
- `@/contract_builder/src/theme.ts` - UI theme configuration

### Documentation
- `@/README.md` - Comprehensive project documentation
- `@/SECURITY.md` - Security policies
- `@/PROJECT_MAP.md` - This file

---

## 🚨 Critical Patterns & Conventions

### 1. **Always Use Services Layer**
Never access Firestore directly from components. Use service functions:
```typescript
// ❌ Bad
import { collection, getDocs } from 'firebase/firestore';
const snapshot = await getDocs(collection(db, 'dives'));

// ✅ Good
import { getAllDives } from '@/services/dives';
const dives = await getAllDives();
```

### 2. **Permission Checks**
Always check permissions before rendering sensitive UI:
```typescript
import { usePermissions } from '@/context/PermissionProvider';

const { hasPermission } = usePermissions();

if (!hasPermission('contracts', 'edit')) {
  return <AccessDenied />;
}
```

### 3. **Protected Routes**
Wrap pages requiring authentication:
```typescript
import ProtectedRoute from '@/components/shared/LayoutComponents/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute requiredModule="contracts" requiredLevel="view">
      <YourComponent />
    </ProtectedRoute>
  );
}
```

### 4. **Navigation**
Use Next.js App Router navigation:
```typescript
// ✅ Correct
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push('/dives/log');

// ❌ Wrong
import { useRouter } from 'next/router'; // Old Pages Router
```

### 5. **Date Handling**
Firestore Timestamps must be converted:
```typescript
// In services
const data = doc.data();
const date = data.date?.toDate() || new Date(data.date);
```

### 6. **Color Mode**
Use Chakra UI hooks for theme-aware styling:
```typescript
import { useColorModeValue } from '@chakra-ui/react';

const bg = useColorModeValue('white', 'gray.800');
const borderColor = useColorModeValue('gray.200', 'gray.600');
```

### 7. **Form State Persistence**
Contract wizard uses localStorage for form persistence. Follow this pattern for multi-step forms.

### 8. **Asset Hierarchy**
Assets can have parent-child relationships. Children inherit parent category. Handle recursively.

### 9. **Hotel Access Control**
Hotel staff can only access assigned hotels. Filter queries by `hotelId` when applicable.

### 10. **User Archiving**
Archived users (`archived: true`) cannot access any features but data is preserved.

---

## 🧪 Testing

### Test Structure
- Unit tests: `@/utils/__tests__/`
- Test framework: Vitest
- Testing library: @testing-library/react

### Running Tests
```bash
npm run test          # Run once
npm run test:watch    # Watch mode
```

---

## 📦 Key Dependencies

**Frontend**:
- `next` (16.0.10) - React framework
- `react` (18) - UI library
- `typescript` (5.9.2) - Type safety
- `@chakra-ui/react` (2.8.2) - UI components
- `framer-motion` (11.5.4) - Animations
- `react-icons` (5.5.0) - Icon library
- `lucide-react` (0.556.0) - Additional icons
- `recharts` (3.5.1) - Charts & graphs

**Firebase**:
- `firebase` (12.3.0) - Client SDK
- `firebase-admin` (13.5.0) - Admin SDK

**Utilities**:
- `date-fns-tz` (3.1.3) - Date manipulation
- `papaparse` (5.5.3) - CSV parsing
- `react-datepicker` (7.3.0) - Date picker

**Development**:
- `vitest` (3.2.4) - Testing
- `playwright` (1.55.0) - E2E testing
- `eslint` (9) - Linting

---

## 🎯 Quick Reference for Common Tasks

### Adding a New Page
1. Create `page.tsx` in appropriate `app/` subdirectory
2. Wrap with `ProtectedRoute` if authentication required
3. Add navigation link in `NavLinks.tsx` with permission check

### Adding a New Service Function
1. Add function to appropriate service file in `@/services/`
2. Add TypeScript types to `@/types/`
3. Handle Firestore Timestamp conversions
4. Add error handling

### Adding a New Permission Module
1. Update `permissions.ts` type definition
2. Update `firestore.rules` with new module checks
3. Update `PermissionProvider.tsx` if needed
4. Update admin user management UI

### Debugging Permission Issues
1. Check browser console for permission logs
2. Verify user document has `permissions` field in Firestore
3. Check `firestore.rules` are deployed
4. Verify role is set correctly

### Adding Analytics/Dashboard Features
1. Add calculation logic to `@/services/diveDashboard.ts`
2. Add filter logic to `@/utils/dashboardFilters.ts`
3. Add types to `@/types/dashboard.ts`
4. Create UI in `@/app/dives/dashboard/`

---

## 🔄 Data Flow Patterns

### Read Operations
```
Component → Service → Firestore → Service (transform) → Component
```

### Write Operations
```
Component → Validation → Service → Firestore → Success/Error → Component
```

### Real-time Updates
```
Component → Service (listener) → Firestore (onChange) → Service (transform) → Component (setState)
```

### Permission Checks
```
Component → PermissionProvider → AuthContext → Firestore (users/{uid}) → Component (render/hide)
```

---

## 🚀 Deployment Checklist

1. ✅ Run tests: `npm run test`
2. ✅ Run linter: `npm run lint`
3. ✅ Build application: `npm run build`
4. ✅ Deploy Firestore rules: `firebase deploy --only firestore:rules`
5. ✅ Deploy Storage rules: `firebase deploy --only storage:rules`
6. ✅ Deploy Functions: `firebase deploy --only functions`
7. ✅ Verify all users have `permissions` field
8. ✅ Test permission levels in production
9. ✅ Monitor Firebase console for errors

---

## 📚 Additional Resources

- **Main Documentation**: `@/README.md`
- **AI Agent Guidelines**: `@/.github/copilot-instructions.md`
- **Security Policy**: `@/SECURITY.md`
- **Firebase Console**: Check project settings for URLs
- **Vercel Analytics**: Integrated for performance monitoring

---

## 🏗️ Architecture Decisions

### Why Next.js App Router?
- Server/client component separation
- Built-in routing with file system
- Optimized performance with RSC
- Better SEO capabilities

### Why Firebase?
- Real-time data synchronization
- Built-in authentication
- Scalable NoSQL database
- Integrated file storage
- Security rules for data protection

### Why Chakra UI?
- Accessible components out of the box
- Dark mode support
- Consistent design system
- TypeScript support
- Easy customization

### Why Service Layer Pattern?
- Centralized data access
- Consistent error handling
- Easier testing and mocking
- Type safety across app
- Single source of truth for data operations

---

## 🎓 Learning Path for New Developers

1. **Start Here**:
   - Read `@/README.md`
   - Review `@/.github/copilot-instructions.md`
   - Explore `@/contract_builder/src/app/layout.tsx`

2. **Understand Authentication**:
   - `@/lib/firebase.ts`
   - `@/context/AuthContext.tsx`
   - `@/context/PermissionProvider.tsx`

3. **Explore a Complete Feature**:
   - Dive Logging: `@/app/dives/log/` + `@/services/dives.ts`
   - Follow data flow from UI → Service → Firestore

4. **Study Permission System**:
   - `@/firestore.rules`
   - `@/components/shared/LayoutComponents/ProtectedRoute.tsx`
   - Admin user management: `@/app/admin/users/`

5. **Build Something**:
   - Add a new page following existing patterns
   - Create a service function
   - Add tests

---

## 🐛 Common Issues & Solutions

### Issue: Permission Denied Errors
**Solution**: Check user document has `permissions` field, verify Firestore rules deployed

### Issue: Hydration Errors
**Solution**: Ensure no invalid DOM nesting, remove `{" "}` in tables, check ColorModeScript placement

### Issue: Date Display Issues
**Solution**: Convert Firestore Timestamps to JS Date in service layer

### Issue: Navigation Not Working
**Solution**: Use `next/navigation` not `next/router`, ensure proper `'use client'` directive

### Issue: Dark Mode Styling Issues
**Solution**: Use `useColorModeValue` hook, avoid hardcoded colors

---

## 📞 Support & Maintenance

**Code Owner**: Sea Saba NV  
**License**: Proprietary - All rights reserved  
**Repository**: Private

For questions about specific modules or features, refer to the service file and related types for that domain.

---

**End of Project Map**

*This document is maintained alongside the codebase. Update when adding major features or restructuring.*
