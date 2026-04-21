# Sea Saba Business App

A comprehensive business management platform for dive operations, contract creation, maintenance tracking, and business analytics.  
Designed for Sea Saba NV to streamline daily operations including dive logging, group contract management, equipment maintenance, and operational intelligence.

---

## Overview

The Sea Saba Business App is an integrated management system that combines multiple operational modules into a single, user-friendly platform. Built with modern web technologies, it provides real-time insights, automated workflows, and comprehensive reporting capabilities for dive shop operations.

---

## Core Features

### 🔐 **Advanced Permission System**
- **Granular Access Control**: Module-based permissions (diveLog, maintenance, contracts) with view/create/edit levels
- **Role-Based Access**: Admin, Hotel Staff, and Employee roles with hierarchical permissions
- **Hotel Assignment**: Hotel staff can be assigned to specific properties for localized access
- **User Archiving**: Disable user access while preserving data integrity
- **Real-Time Permissions**: Live permission updates via Firestore listeners
- **Admin User Management**: Complete user lifecycle management with permission assignment

### 🤿 **Dive Operations Management**
- **Dive Logging**: Record daily dives with detailed information including sites, guides, customers, and ocean conditions
- **Species Tracking**: Log marine life sightings to support research and enhance guest experiences
- **Dive History**: Complete searchable archive of all dive activities with filtering capabilities
- **Dive Dashboard**: Comprehensive analytics showing site utilization, guide performance, and operational metrics
- **7-Day Site Matrices**: Track dive patterns and optimize site rotation
- **Seasonal Wildlife Patterns**: Monitor temperature trends and marine life activity

### 📋 **Contract Management System**
- **Contract Wizard**: Step-by-step contract creation with automated calculations
- **Hotel Management**: Configure room types, seasonal rates, policies, and FOC rules
- **Dive Packages**: Manage diving options with seasonal pricing and group discounts
- **Meal Packages**: Hotel-specific meal options with commission tracking
- **FOC Logic**: Automatic Free of Charge calculations (7+1 diver rule for dives)
- **Commission Engine**: Multi-tier commission structure for different booking types
- **PDF Generation**: Professional contract documents with client confirmation sections
- **Hotel Price Sheet Generator**: Generate branded printable hotel price & info sheets with seasonal room rates, dive packages, and meal packages
- **Permission-Based Access**: Contract creation and management controlled by granular permissions
- **Checkfront Integration**: Two-way sync with Checkfront booking system for automated reservation management

### 🔧 **Maintenance & Asset Tracking**
- **Maintenance Dashboard**: Overview of all maintenance activities and upcoming services
- **Service Logs**: Complete maintenance history with costs and next service due dates
- **Asset Management**: Track company equipment, vehicles, and valuable assets
- **Technician Management**: Organize maintenance staff roles and assignments
- **Preventive Maintenance**: Automated reminders and scheduling for equipment service
- **Permission-Controlled Access**: Maintenance operations restricted by user permissions

### 📊 **Business Intelligence & Analytics**
- **Operational Insights**: Real-time metrics on dive activity and performance
- **Site Utilization Analysis**: Track popular dive sites and identify usage patterns
- **Guide Performance Metrics**: Monitor individual guide statistics and efficiency
- **Temperature Trend Analysis**: Track ocean conditions and seasonal patterns
- **Financial Reporting**: Revenue tracking, commission analysis, and cost monitoring
- **Custom Reports**: Generate detailed reports for management and stakeholders

---

## Technical Architecture

### **Frontend Stack**
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **UI Components**: Chakra UI + Tailwind CSS (hybrid approach)
- **Icons**: React Icons (Feather Icons)
- **State Management**: React Context + Local Storage for form persistence
- **Responsive Design**: Mobile-first approach with desktop optimization

### **Backend & Infrastructure**
- **Database**: Firebase Firestore (NoSQL document database)
- **Authentication**: Firebase Auth with role-based access control
- **Admin SDK**: Firebase Admin SDK for server-side operations with explicit credential support
- **File Storage**: Firebase Storage for PDFs and assets
- **API Layer**: Next.js API routes with Firebase integration
- **Server Actions**: Next.js Server Actions for secure backend operations
- **Real-time Updates**: Firestore real-time listeners for live data
- **External Integrations**: Checkfront API for booking synchronization

### **Development Tools**
- **Package Manager**: npm
- **Type Safety**: TypeScript throughout the application
- **Code Quality**: ESLint + Prettier configuration
- **Build System**: Next.js optimized build pipeline
- **Environment Management**: dotenv for configuration

---

## User Roles & Permissions

### **Granular Permission System**
The application uses a sophisticated permission system with module-based access control:

- **Modules**: `diveLog`, `maintenance`, `contracts`
- **Permission Levels**: `view`, `create`, `edit`
- **Permission Hierarchy**: `edit` > `create` > `view`

### **Admin Role**
- **Full Access**: All modules with `edit` permissions
- **User Management**: Create, edit, archive users and assign permissions
- **System Configuration**: Manage sites, boats, guides, species
- **Analytics**: Complete access to all business intelligence features
- **Hotel Management**: Full control over all hotels and properties

### **Hotel Staff Role**
- **Hotel-Specific Access**: Assigned to specific hotel properties
- **Contract Operations**: View/create/edit contracts for assigned hotel
- **Dive Logging**: Full dive log access and management
- **Maintenance**: View and create maintenance logs
- **Limited Admin**: Manage hotel-specific assets and configurations

### **Employee Role**
- **Basic Access**: Default permissions (configurable per user)
- **Dive History**: View dive logs and historical data
- **Maintenance Logs**: View and create maintenance entries
- **Limited Contract Access**: Based on assigned permissions
- **Profile Management**: Personal profile and preferences

### **User Archiving**
- **Archive Status**: Users can be archived to disable all access
- **Data Preservation**: Archived user data remains intact
- **Reversible**: Users can be unarchived to restore access
- **Security**: Archived users cannot access any system features

---

## Module Structure

```
src/app/
├── dives/
│   ├── log/           # Daily dive logging interface
│   ├── view/          # Dive history and search
│   ├── dashboard/     # Dive analytics and insights
│   └── edit/[id]/     # Edit existing dive records
├── contracts/
│   ├── page.tsx       # Contract listing and management
│   ├── [id]/view/     # Individual contract viewing
│   └── hotel-sheets/  # Hotel price & info sheet generator
├── hotels/            # Hotel and room management
├── dive-packages/     # Dive package configuration
├── maintenance/
│   ├── dashboard/     # Maintenance overview
│   ├── logs/          # Service records
│   ├── assets/        # Asset management
│   └── technicians/   # Staff management
└── admin/
    ├── boats/         # Fleet management
    ├── guides/        # Guide profiles
    ├── sites/         # Dive site database
    └── species/       # Marine life catalog
```

---

## Getting Started

### **Prerequisites**
- Node.js 18+ installed
- Firebase project configured
- Git for version control

### **1. Clone the Repository**
```bash
git clone https://github.com/YOUR_ORG/sea-saba-business-app.git
cd sea-saba-business-app
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Environment Configuration**
Create a `.env.local` file in the root directory:
```bash
# Firebase Configuration (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----\n"

# Checkfront API (Optional - for booking integration)
CHECKFRONT_API_KEY=cf_your_api_key
CHECKFRONT_API_SECRET=your_api_secret
CHECKFRONT_HOST=your_subdomain.checkfront.com
```

### **4. Run Development Server**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

---

## Development Guidelines

### **Code Standards**
- Use TypeScript for all new code
- Follow React functional component patterns
- Implement proper error boundaries and loading states
- Use Chakra UI components for consistency
- Use semantic color tokens from `theme.ts` (e.g. `textPrimary`, `textMuted`, `cardBg`, `warning`) — never hardcode hex or Chakra palette values
- Maintain responsive design principles

### **Firebase Integration**
- Always use `next/navigation` for routing (App Router)
- Implement real-time listeners for live data updates
- Use Firestore security rules for data protection
- Handle offline scenarios gracefully
- Implement proper error handling for Firebase operations

### **Permission System Guidelines**
- Always use `ProtectedRoute` component for route protection
- Check permissions before rendering sensitive components
- Use `usePermissions` hook for permission checks in components
- Implement proper fallback UI for unauthorized access
- Test all permission levels (view/create/edit) for each role

### **Server Actions & Firebase Admin**
- Use `'use server'` directive for server-only code
- Server Actions can bypass Firestore Security Rules using Firebase Admin SDK
- Admin SDK credentials configured via `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Admin SDK falls back to default credentials (GOOGLE_APPLICATION_CREDENTIALS) if env vars incomplete
- **Never import Admin SDK files in client components** - use only in Server Actions

### **External Integrations**
- Checkfront API integration uses Server Actions for secure credential handling
- API credentials (`CHECKFRONT_API_KEY`, `CHECKFRONT_API_SECRET`) stay server-side only
- Integration supports both create and update booking flows
- Failed bookings are logged to Firestore for debugging

---

## Recent Updates & Improvements

### **Checkfront Integration (Latest)**
- ✅ **Two-Way Booking Sync**: Automated contract-to-Checkfront booking synchronization
- ✅ **Dry-Run Testing**: Safe testing mode to validate mappings without creating bookings
- ✅ **Firebase Admin SDK**: Server-side Firestore access for Checkfront operations
- ✅ **Server Actions**: Secure `'use server'` actions for external API calls
- ✅ **Booking Lifecycle**: Create new bookings and update existing ones with history tracking
- ✅ **Error Logging**: Detailed sync logs stored in Firestore for troubleshooting
- ✅ **Room Category Caching**: Performance optimization to reduce Firestore round-trips

### **Permission System Overhaul**
- ✅ **Granular Access Control**: Implemented module-based permissions with view/create/edit levels
- ✅ **Real-Time Permission Updates**: Live permission updates via Firestore listeners
- ✅ **User Archiving**: Added user archiving functionality with access blocking
- ✅ **Hotel Assignments**: Hotel staff can be assigned to specific properties
- ✅ **Enhanced Security**: Updated Firestore security rules for granular permission enforcement
- ✅ **Admin User Management**: Complete user lifecycle management interface

### **UI/UX Improvements**
- ✅ **Responsive Design**: Mobile-optimized user management interface
- ✅ **Enhanced Navigation**: Restructured navigation with logical module grouping
- ✅ **Better Error Handling**: Improved permission denied messaging and fallbacks
- ✅ **Archive Status Display**: Visual indicators for archived users in management interface

### **Technical Enhancements**
- ✅ **TypeScript Integration**: Full type safety across permission system
- ✅ **Performance Optimizations**: Efficient real-time data loading and caching
- ✅ **Security Hardening**: Comprehensive Firestore security rules
- ✅ **Code Quality**: Improved error handling and logging

---

## Deployment

### **Firebase Deployment**
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy full application
firebase deploy
```

### **Production Considerations**
- Ensure all user documents have proper `permissions` field
- Verify Firestore security rules are deployed and working
- Test all user roles and permission levels
- Monitor Firebase console for any security rule violations

---

## Troubleshooting

### **Common Issues**
- **Access Denied**: Ensure user has proper permissions field in Firestore
- **Permission Errors**: Check Firestore security rules deployment status
- **Real-Time Updates**: Verify Firebase listeners are properly configured
- **User Management**: Ensure admin users have permissions field populated

### **Debug Mode**
For debugging permission issues, check browser console for detailed permission checking logs when accessing protected routes.
- Implement proper error handling for Firestore operations
- Use real-time listeners for live data updates
- Structure collections with proper indexing for performance

### **Component Architecture**
- Reusable components in `/src/components/`
- Page-specific components in respective `/components/` subdirectories
- Shared hooks and utilities in `/src/hooks/` and `/src/utils/`
- Type definitions in `/src/types/`

---

## Checkfront Integration

The application now integrates with [Checkfront](https://www.checkfront.com/) for automated booking management.

### **Features**
- **Automated Booking Sync**: Contracts automatically create or update Checkfront bookings
- **Dry-Run Testing**: Test contract-to-booking mappings without creating actual bookings
- **Item Mapping**: Room categories, dive packages, and meal packages map to Checkfront inventory items
- **Booking History**: Track all sync attempts with detailed logs in Firestore
- **Update Flow**: Revising a contract creates a new booking and marks the old one as superseded

### **File Structure**
```
src/
├── core/db/firebaseAdmin.ts           # Firebase Admin SDK initialization
├── lib/integrations/checkfront.ts     # Core Checkfront API client
└── app/(staff)/contracts/_lib/
    ├── checkfrontServerRepos.ts     # Server-safe Firestore repositories
    ├── checkfrontSyncAction.ts      # Server Action: sync to Checkfront
    └── checkfrontDryRunAction.ts    # Server Action: dry-run testing
```

### **Environment Variables**
```bash
# Required for Checkfront integration
CHECKFRONT_API_KEY="cf_your_key"           # From Checkfront: Manage > Setup > API
CHECKFRONT_API_SECRET="your_secret"        # API secret for authentication
CHECKFRONT_HOST="yoursite.checkfront.com"  # Your Checkfront subdomain

# Required for Firebase Admin (Server Actions)
FIREBASE_PROJECT_ID="your_project"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### **API Flow**
1. **Build Payload** (`buildCheckfrontPayloadFromContract`): Resolve room categories, dive packages, meal packages → Checkfront item IDs
2. **Rated Item Calls** (`getRatedItemSlip`): Get pricing/availability "slip" tokens for each item
3. **Booking Session** (`createBookingSession`): Combine slips into a booking session
4. **Create Booking** (`createBookingFromSession`): Finalize booking with customer name
5. **Update Flow**: Creates new booking, marks old as superseded with notes

### **Security**
- All Checkfront API calls use Server Actions (`'use server'`)
- API credentials never exposed to client
- Firebase Admin SDK bypasses Firestore Security Rules for server operations
- Sync logs stored in `groupContracts/{id}/syncLogs` subcollection

---

## Current Status & Roadmap

### **✅ Completed Features**
- Contract wizard with automated calculations
- Hotel and dive package management
- Hotel price & info sheet generator (printable)
- Contract revision history with data carry-forward
- Firebase authentication with role-based access
- Dive logging and history viewing
- Maintenance tracking system
- Asset and technician management
- Dive operations dashboard
- Real-time data synchronization
- **Checkfront booking integration** (NEW)
- **Firebase Admin SDK for server operations** (NEW)

### **🚀 In Development**
- Advanced reporting and export features
- Mobile app companion
- Multi-language support (English/Dutch)
- Enhanced notification system
- ~~Integration with external booking platforms~~ ✅ Completed (Checkfront)

### **📋 Planned Enhancements**
- AI-powered dive site recommendations
- Automated weather integration
- Customer relationship management
- Inventory management system
- Advanced financial analytics
- Additional API integrations (payment processors, email services)

---

## Support & Maintenance

### **Application Monitoring**
- Firebase Performance Monitoring for performance tracking
- Crashlytics for error reporting
- Custom analytics for user behavior tracking

### **Data Security**
- Role-based access control via Firestore Security Rules
- Encrypted data transmission
- Regular security audits
- Backup and recovery procedures

---

## Firestore Security Rules

The application enforces security at the database level through Firestore Security Rules (`firestore.rules`). These rules mirror the client-side permission system to ensure data cannot be accessed or modified outside of the application's intended access patterns.

### Helper Functions

| Function | Purpose |
|---|---|
| `isSignedIn()` | Requires Firebase Authentication |
| `isActive()` | Signed in AND not archived (`archived != true`) |
| `isAdmin()` | Active user with `role == 'admin'` |
| `isHotelStaff()` | Active user with `hotel-staff`, `manager`, or `hotel-manager` role |
| `hasPermission(module, level)` | Checks the user's `permissions` map against the required module and level. Admins bypass all checks. Uses the same hierarchy as the client: `edit (3) > create (2) > view (1)` |

### Collection Rules Summary

| Collection | Read | Create | Update | Delete |
|---|---|---|---|---|
| `users` | Own doc or admin | Admin only | Own profile (name/prefs) or admin | Never (use archiving) |
| `hotels` | Any active user | Admin only | Admin or assigned hotel-staff | Admin only |
| `roomCategories` | Any active user | Admin or contracts:edit | Admin or contracts:edit | Admin or contracts:edit |
| `roomTypes` | Any active user | Admin or contracts:edit | Admin or contracts:edit | Admin or contracts:edit |
| `seasons` | Any active user | Admin or contracts:edit | Admin or contracts:edit | Admin or contracts:edit |
| `rates` | Any active user | Admin or contracts:edit | Admin or contracts:edit | Admin or contracts:edit |
| `divePackages` | Any active user | Admin or contracts:edit | Admin or contracts:edit | Admin or contracts:edit |
| `mealPackages` | Any active user | Admin or contracts:edit | Admin or contracts:edit | Admin or contracts:edit |
| `groupContracts` | contracts:view | contracts:create | contracts:edit | Admin only |
| `groupContracts/{id}/notes` | contracts:view | contracts:create | N/A | Admin or contracts:edit |
| `payments` | contracts:view | contracts:create | contracts:edit | Admin or contracts:edit |
| `dives` | diveLog:view | diveLog:create | diveLog:edit | Admin or diveLog:edit |
| `boats` | diveLog:view | Admin only | Admin only | Admin only |
| `guides` | diveLog:view | Admin only | Admin only | Admin only |
| `sites` | diveLog:view | Admin only | Admin only | Admin only |
| `species` | diveLog:view | Admin only | Admin only | Admin only |
| `assets` | maintenance:view | maintenance:create | maintenance:edit | Admin or maintenance:edit |
| `maintenanceLogs` | maintenance:view | maintenance:create | maintenance:edit | Admin or maintenance:edit |
| `technicians` | maintenance:view | Admin or maintenance:edit | Admin or maintenance:edit | Admin or maintenance:edit |

### Key Design Decisions

- **Archived users are fully blocked**: The `isActive()` check gates every rule, so archived users have zero access regardless of their stored permissions.
- **No document deletion for users**: User documents are never deleted; the archiving pattern preserves data integrity and audit trails.
- **Hotel-staff scoping on hotels**: Hotel staff can only update their own assigned hotel (`getUserData().hotelId == hotelId`).
- **Reference data is admin-only for writes**: Boats, guides, sites, and species are lookup tables managed exclusively by admins.
- **Config collections are broadly readable**: Hotels, room types, seasons, rates, and packages are readable by any active user since they're needed for contract creation workflows.
- **Default deny**: A catch-all rule at the bottom denies access to any collection not explicitly listed.
- **Legacy role support**: The `isHotelStaff()` function accepts `manager` and `hotel-manager` roles for backward compatibility.

### Deploying Rules

```bash
firebase deploy --only firestore:rules
```

After deploying, verify in the Firebase Console under **Firestore > Rules** that the rules are active. Monitor the **Rules Playground** or **Usage** tab for any denied requests that may indicate a misconfiguration.

### **Performance Optimization**
- Lazy loading for large datasets
- Image optimization for faster loading
- Caching strategies for frequently accessed data
- Bundle size optimization

---

## License

Copyright © 2025 Sea Saba NV  

This software is proprietary and confidential.  
Unauthorized copying, distribution, modification, or use of this software, via any medium, is strictly prohibited without prior written consent from the owners.  

The source code and related assets are provided solely for internal business operations of Sea Saba NV.  
No part of this software may be reproduced or transmitted in any form or by any means without explicit permission.  

All rights reserved.
