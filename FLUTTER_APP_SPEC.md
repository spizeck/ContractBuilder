# Sea Saba Mobile App - Flutter Specification

**Version:** 1.0  
**Date:** March 2026  
**Modules:** Dive Log & Maintenance Tracking  
**Platform:** iOS & Android (Flutter)

---

## Executive Summary

This specification defines the requirements for a Flutter mobile application that provides field-ready access to Sea Saba's dive logging and maintenance tracking systems. The app will integrate with the existing Firebase backend and provide offline-first functionality for dive guides and maintenance technicians.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication & Permissions](#authentication--permissions)
3. [Dive Log Module](#dive-log-module)
4. [Maintenance Module](#maintenance-module)
5. [Data Models](#data-models)
6. [API Integration](#api-integration)
7. [Offline Functionality](#offline-functionality)
8. [UI/UX Requirements](#uiux-requirements)
9. [Technical Stack](#technical-stack)

---

## Architecture Overview

### Backend Integration
- **Database:** Firebase Firestore (existing)
- **Authentication:** Firebase Auth (existing)
- **Storage:** Firebase Storage (for attachments)
- **Real-time Sync:** Firestore real-time listeners

### Mobile Architecture
- **Framework:** Flutter 3.x
- **State Management:** Riverpod or Provider
- **Local Storage:** Hive or Drift (SQLite)
- **Offline Support:** Firebase offline persistence + local cache
- **Navigation:** GoRouter or Auto Route

### Key Principles
- **Offline-First:** All features must work without internet connection
- **Auto-Sync:** Automatic synchronization when connection is restored
- **Conflict Resolution:** Last-write-wins with user notification
- **Performance:** Fast app startup and smooth animations

---

## Authentication & Permissions

### User Roles
The app supports the same role-based access control as the web application:

| Role | Dive Log Access | Maintenance Access |
|------|----------------|-------------------|
| **Admin** | Full (view/create/edit) | Full (view/create/edit) |
| **Hotel Staff** | Full (view/create/edit) | View + Create only |
| **Employee** | Based on permissions | Based on permissions |

### Permission Levels
- **View:** Read-only access to data
- **Create:** Can add new entries
- **Edit:** Can modify and delete entries

### Authentication Flow
1. Email/password login via Firebase Auth
2. Fetch user profile from Firestore `/users/{uid}`
3. Load permissions object: `{ diveLog: 'edit', maintenance: 'create' }`
4. Cache permissions locally for offline access
5. Redirect to appropriate home screen based on permissions

### Security Rules
- All Firestore security rules from the web app apply
- Archived users (`archived: true`) are blocked from all access
- Permission checks happen both client-side and server-side

---

## Dive Log Module

### Features Overview

#### 1. **Dive Logging (Create/Edit)**
Multi-step form for logging dive information with marine life sightings.

**Step 1: Dive Information**
- Date (DatePicker, default: today)
- Dive Time Slot (Dropdown)
  - 9am Dive
  - 11am Dive
  - 1pm Dive
  - 4pm Dive
  - Night Dive
- Boat (Dropdown from active boats)
- Dive Guide (Dropdown from active guides, default: current user)
- Dive Site (Dropdown from all sites, alphabetically sorted)
- Drift Dive (Checkbox)
- Max Depth (Number input with unit conversion)
- Water Temperature (Number input with unit conversion)

**Step 2-N: Species Sightings**
- Grouped by species category
- Multiple steps based on species groupings
- Number input for count per species
- Only active species shown
- Categories: Fish, Sharks, Rays, Turtles, Invertebrates, etc.

**Step Final: Confirmation**
- Review all entered data
- Submit button
- Validation before submission

**Validation Rules:**
- All required fields must be filled
- Duplicate dive check: Same date + time slot + boat + guide
- Depth warning: Alert if depth > 40m or < 5m
- Temperature warning: Alert if temp < 20°C or > 32°C
- Warnings can be overridden by user confirmation

**Unit Conversion:**
- Depth: Meters ↔ Feet (stored as meters)
- Temperature: Celsius ↔ Fahrenheit (stored as celsius)
- User preference stored in profile

#### 2. **Dive History (View)**
Scrollable list of all logged dives with:
- Date and time slot
- Dive site name
- Boat name
- Guide name
- Max depth (in user's preferred units)
- Water temperature (in user's preferred units)
- Drift indicator (icon)
- Tap to view full details

**Filtering:**
- Date range picker
- Dive site filter
- Boat filter
- Guide filter
- Search by site/guide name

**Sorting:**
- Date (newest first, default)
- Date (oldest first)
- Site name (A-Z)
- Depth (deepest first)

#### 3. **Dive Details View**
Full dive information display:
- All dive info fields
- Species sightings list with counts
- Edit button (if user has edit permission)
- Delete button (if user has edit permission)

#### 4. **Dashboard (Analytics)**
Visual insights into dive operations:

**Summary Cards:**
- Total Dives (current month)
- Total Divers (sum of all divers)
- Most Popular Site
- Average Depth

**Charts:**
- Dives per Site (Bar chart)
- Dives per Guide (Bar chart)
- Temperature Trend (Line chart, last 30 days)
- Species Sightings (Top 10, horizontal bar chart)

**7-Day Site Matrix:**
- Grid showing last 7 days
- Sites on Y-axis, dates on X-axis
- Color-coded cells for dive frequency

**Filters:**
- Date range selector
- Guide filter
- Boat filter

---

## Maintenance Module

### Features Overview

#### 1. **Maintenance Logging (Create/Edit)**
Form for recording maintenance activities on assets.

**Asset Selection (Cascading Dropdowns):**
1. Category (Dropdown)
   - Marine
   - Compressors
   - Vehicles
   - Scuba Equipment
   - Other
2. Parent Asset (Dropdown, filtered by category)
3. Sub-Asset (Dropdown, filtered by parent, optional)

**Maintenance Details:**
- Date (DatePicker, default: today)
- Maintenance Type (Dropdown)
  - Service
  - Unscheduled
  - Inspection
  - Note
- Summary (Text input, required)
- Details (Multi-line text, optional)
- Technician (Dropdown, optional)
- Cost (Number input, optional)

**Service Tracking (Conditional based on asset type):**

**For Hours-Tracked Assets:**
- Current Hours Reading (Number)
- Next Service Due Hours (Number)

**For Kilometers-Tracked Assets:**
- Current Kilometers Reading (Number)
- Next Service Due Kilometers (Number)

**For Date-Tracked Assets:**
- Next Service Due Date (DatePicker)

**Attachments:**
- Photo capture from camera
- Photo selection from gallery
- Multiple photos supported
- Stored in Firebase Storage

#### 2. **Maintenance Dashboard**
Overview of all maintenance activities and asset status.

**Summary Cards:**
- Total Assets
- Overdue Services (red)
- Upcoming Services (orange, due within 14 days)
- Logs This Month

**Asset List:**
- Grouped by category
- Parent-child hierarchy display
- Status indicator (OK/Due Soon/Overdue)
- Last service date
- Next service due (hours/km/date)
- Tap to view asset details

**Filters:**
- Category filter
- Status filter (All/Overdue/Due Soon/OK)
- Search by asset name
- Date range for logs

#### 3. **Asset Details View**
Detailed information about a specific asset:

**Asset Information:**
- Name
- Category
- Description
- Serial Number
- Location
- Service Tracking Type

**Current Status:**
- Current Hours/Kilometers (if applicable)
- Next Service Due
- Last Service Date
- Status indicator with color

**Maintenance History:**
- Chronological list of all maintenance logs
- Date, type, summary
- Technician name
- Cost
- Tap to view full log details

**Quick Actions:**
- Log Maintenance (button)
- Edit Asset (if admin/edit permission)

#### 4. **Maintenance Log Details View**
Full details of a specific maintenance log:
- Date
- Asset name
- Maintenance type
- Summary and details
- Technician name
- Readings (hours/km)
- Next service due
- Cost
- Attached photos (gallery view)
- Edit button (if user has edit permission)
- Delete button (if user has edit permission)

#### 5. **Technician Management**
List and manage maintenance technicians (admin/edit only):
- Name
- Role
- Certifications
- Active status
- Activity count (number of logs)
- Add/Edit/Archive technicians

---

## Data Models

### Dive Log Models

#### Dive
```dart
class Dive {
  final String id;
  final DateTime date;
  final DiveSlot diveSlot;
  final String boatId;
  final String diveGuide;
  final String diveSiteId;
  final double maxDepth; // meters
  final double waterTemperature; // celsius
  final bool isDrift;
  final List<Sighting> sightings;
  final String createdBy;
  final DateTime createdAt;
  
  // Computed properties
  String get boatName; // from boats collection
  String get siteName; // from sites collection
}

enum DiveSlot {
  am9('9am'),
  am11('11am'),
  pm1('1pm'),
  pm4('4pm'),
  night('night');
  
  final String label;
  const DiveSlot(this.label);
}
```

#### Sighting
```dart
class Sighting {
  final String speciesId;
  final int count;
}
```

#### Species
```dart
class Species {
  final String id;
  final String name;
  final bool active;
  final String? scientificName;
  final String? category;
  final int? step; // form grouping
  final String? icon;
  final String? iucnStatus;
}
```

#### Site
```dart
class Site {
  final String id;
  final String name;
  final bool active;
  final String? region;
  final String? habitatType;
  final bool? protectedArea;
  final String? depthRange;
}
```

#### Boat
```dart
class Boat {
  final String id;
  final String name;
  final bool active;
  final DateTime? createdAt;
}
```

#### Guide
```dart
class Guide {
  final String id;
  final String name;
  final bool active;
  final String? certifications;
  final String? email;
}
```

### Maintenance Models

#### Asset
```dart
class Asset {
  final String id;
  final String name;
  final AssetCategory category;
  final String? description;
  final String? serialNumber;
  final String? location;
  final bool active;
  
  // Hierarchy
  final String? parentAssetId;
  final String? parentAssetName;
  final List<String>? subAssetIds;
  
  // Service tracking
  final ServiceTracking serviceTracking;
  
  // Hours tracking (if applicable)
  final double? currentHours;
  final double? serviceIntervalHours;
  final double? nextServiceDueHours;
  
  // Kilometers tracking (if applicable)
  final double? currentKilometers;
  final double? serviceIntervalKilometers;
  final double? nextServiceDueKilometers;
  
  // Date tracking (if applicable)
  final int? serviceIntervalDays;
  final DateTime? nextServiceDueDate;
  
  final DateTime? lastServiceDate;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  
  // Computed
  AssetStatus get status; // OK, Due Soon, Overdue
}

enum AssetCategory {
  marine('Marine'),
  compressors('Compressors'),
  vehicles('Vehicles'),
  scubaEquipment('Scuba Equipment'),
  other('Other');
  
  final String label;
  const AssetCategory(this.label);
}

enum ServiceTracking {
  none,
  hours,
  kilometers,
  date
}

enum AssetStatus {
  ok,
  dueSoon,
  overdue
}
```

#### MaintenanceLog
```dart
class MaintenanceLog {
  final String id;
  final String assetId;
  final String assetName;
  final AssetCategory category;
  final MaintenanceLogKind kind;
  
  final DateTime date;
  final String summary;
  final String? details;
  
  final String? technicianId;
  final String? technicianName;
  
  // Readings
  final double? readingHours;
  final double? nextServiceDueHours;
  final double? readingKilometers;
  final double? nextServiceDueKilometers;
  final DateTime? nextServiceDueDate;
  
  final double? cost;
  final List<String>? attachments; // Firebase Storage URLs
  final String createdBy;
  final DateTime createdAt;
}

enum MaintenanceLogKind {
  service,
  unscheduled,
  inspection,
  note
}
```

#### Technician
```dart
class Technician {
  final String id;
  final String name;
  final String? role;
  final String? certifications;
  final bool active;
  final int? activityCount;
}
```

### User Models

#### UserProfile
```dart
class UserProfile {
  final String uid;
  final String email;
  final String displayName;
  final String role; // 'admin', 'hotel-staff', 'employee'
  final bool archived;
  final String? hotelId; // for hotel-staff
  final Permissions permissions;
  final UserPreferences? preferences;
}

class Permissions {
  final PermissionLevel? diveLog;
  final PermissionLevel? maintenance;
  final PermissionLevel? contracts;
}

enum PermissionLevel {
  view,
  create,
  edit
}

class UserPreferences {
  final UnitPreferences units;
}

class UnitPreferences {
  final DepthUnit depth;
  final TemperatureUnit temp;
  final PressureUnit pressure;
}

enum DepthUnit { meters, feet }
enum TemperatureUnit { celsius, fahrenheit }
enum PressureUnit { bar, psi }
```

---

## API Integration

### Firebase Collections

#### Read Operations
```
GET /dives - Get all dives (with pagination)
GET /dives/{id} - Get single dive
GET /boats - Get all boats
GET /sites - Get all sites
GET /species - Get all species
GET /guides - Get all guides

GET /assets - Get all assets
GET /maintenanceLogs - Get all maintenance logs
GET /maintenanceLogs?assetId={id} - Get logs for asset
GET /technicians - Get all technicians

GET /users/{uid} - Get user profile
```

#### Write Operations
```
POST /dives - Create new dive
PUT /dives/{id} - Update dive
DELETE /dives/{id} - Delete dive

POST /maintenanceLogs - Create maintenance log
PUT /maintenanceLogs/{id} - Update maintenance log
DELETE /maintenanceLogs/{id} - Delete maintenance log

POST /assets - Create asset (admin only)
PUT /assets/{id} - Update asset
DELETE /assets/{id} - Delete asset (admin only)

POST /technicians - Create technician
PUT /technicians/{id} - Update technician
DELETE /technicians/{id} - Delete technician
```

### Real-time Listeners
```dart
// Listen to dive updates
Stream<List<Dive>> watchDives() {
  return FirebaseFirestore.instance
    .collection('dives')
    .orderBy('date', descending: true)
    .snapshots()
    .map((snapshot) => snapshot.docs.map((doc) => 
      Dive.fromFirestore(doc)).toList());
}

// Listen to maintenance logs for an asset
Stream<List<MaintenanceLog>> watchLogsForAsset(String assetId) {
  return FirebaseFirestore.instance
    .collection('maintenanceLogs')
    .where('assetId', isEqualTo: assetId)
    .orderBy('date', descending: true)
    .snapshots()
    .map((snapshot) => snapshot.docs.map((doc) => 
      MaintenanceLog.fromFirestore(doc)).toList());
}
```

### Firestore Security Rules
All existing security rules from the web application apply:
- Users must be authenticated (`isSignedIn()`)
- Users must not be archived (`isActive()`)
- Permission checks via `hasPermission(module, level)`
- Admins bypass all permission checks
- Hotel staff can only access their assigned hotel data

---

## Offline Functionality

### Offline Strategy

#### Data Caching
1. **On App Launch:**
   - Load cached data from local storage
   - Display cached data immediately
   - Sync with Firestore in background

2. **Reference Data (Cached Indefinitely):**
   - Boats, Sites, Species, Guides
   - Assets, Technicians
   - User profile and permissions
   - Refresh on app startup if online

3. **Transaction Data (Cached with TTL):**
   - Dives (last 90 days)
   - Maintenance logs (last 90 days)
   - Sync when connection available

#### Offline Operations
1. **Create Operations:**
   - Save to local queue with pending status
   - Generate temporary ID
   - Display in UI immediately
   - Sync to Firestore when online
   - Update with server ID on success

2. **Update Operations:**
   - Apply changes locally
   - Queue update operation
   - Sync to Firestore when online
   - Handle conflicts (last-write-wins)

3. **Delete Operations:**
   - Mark as deleted locally
   - Queue delete operation
   - Sync to Firestore when online

#### Conflict Resolution
- **Strategy:** Last-write-wins
- **User Notification:** Show toast if local changes were overwritten
- **Retry Logic:** Exponential backoff for failed syncs
- **Error Handling:** Display sync errors with retry button

#### Sync Indicators
- **Status Bar Icon:** Cloud icon showing sync status
  - Green checkmark: All synced
  - Orange spinner: Syncing
  - Red exclamation: Sync errors
- **Pull-to-Refresh:** Manual sync trigger
- **Auto-Sync:** Every 5 minutes when online

---

## UI/UX Requirements

### Design System

#### Color Palette
```dart
// Primary Colors
primary: Color(0xFF00897B), // Teal
primaryDark: Color(0xFF00695C),
primaryLight: Color(0xFF4DB6AC),

// Secondary Colors
secondary: Color(0xFF1976D2), // Blue
secondaryDark: Color(0xFF0D47A1),
secondaryLight: Color(0xFF42A5F5),

// Status Colors
success: Color(0xFF4CAF50), // Green
warning: Color(0xFFFF9800), // Orange
error: Color(0xFFF44336), // Red
info: Color(0xFF2196F3), // Blue

// Neutral Colors
background: Color(0xFFF5F5F5),
surface: Color(0xFFFFFFFF),
textPrimary: Color(0xFF212121),
textSecondary: Color(0xFF757575),
divider: Color(0xFFBDBDBD),
```

#### Typography
```dart
// Headings
h1: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
h2: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
h3: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
h4: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),

// Body
bodyLarge: TextStyle(fontSize: 16),
bodyMedium: TextStyle(fontSize: 14),
bodySmall: TextStyle(fontSize: 12),

// Labels
labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
```

#### Spacing
```dart
// Consistent spacing scale
xs: 4.0,
sm: 8.0,
md: 16.0,
lg: 24.0,
xl: 32.0,
xxl: 48.0,
```

### Navigation Structure

#### Bottom Navigation Bar (Main Tabs)
1. **Dive Log** (Icon: Waves)
   - Dashboard (default)
   - Log Dive
   - History
   
2. **Maintenance** (Icon: Wrench)
   - Dashboard (default)
   - Log Maintenance
   - Assets
   - Technicians (if admin)

3. **Profile** (Icon: Person)
   - User info
   - Preferences
   - Logout

#### Navigation Patterns
- **Tab Navigation:** Bottom nav for main modules
- **Stack Navigation:** Push/pop for details and forms
- **Modal Navigation:** Full-screen for forms
- **Drawer Navigation:** Not used (keep it simple)

### Screen Templates

#### List Screen Template
- App bar with title and actions
- Search bar (if applicable)
- Filter chips (if applicable)
- Pull-to-refresh
- Scrollable list with cards
- Empty state illustration
- Loading shimmer effect
- Floating action button (for create)

#### Form Screen Template
- App bar with back button and title
- Scrollable form fields
- Validation messages inline
- Bottom action bar (Cancel/Save)
- Loading overlay during save
- Success/error snackbar

#### Details Screen Template
- App bar with back button and edit action
- Scrollable content
- Sectioned layout with cards
- Action buttons at bottom
- Delete confirmation dialog

### Responsive Design
- **Phone:** Single column layout
- **Tablet:** Two column layout where appropriate
- **Landscape:** Optimize for horizontal space
- **Adaptive:** Use Material Design adaptive components

### Accessibility
- **Screen Reader:** All interactive elements labeled
- **Contrast:** WCAG AA compliance
- **Touch Targets:** Minimum 48x48 dp
- **Text Scaling:** Support dynamic type
- **Keyboard Navigation:** Full keyboard support

---

## Technical Stack

### Core Dependencies
```yaml
dependencies:
  flutter: sdk: flutter
  
  # Firebase
  firebase_core: ^2.24.0
  firebase_auth: ^4.15.0
  firebase_firestore: ^4.13.0
  firebase_storage: ^11.5.0
  
  # State Management
  flutter_riverpod: ^2.4.0
  
  # Local Storage
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  
  # Navigation
  go_router: ^12.0.0
  
  # UI Components
  flutter_form_builder: ^9.1.0
  intl: ^0.18.0
  cached_network_image: ^3.3.0
  
  # Charts
  fl_chart: ^0.65.0
  
  # Image Handling
  image_picker: ^1.0.4
  
  # Utilities
  connectivity_plus: ^5.0.0
  uuid: ^4.2.0
  
dev_dependencies:
  flutter_test: sdk: flutter
  build_runner: ^2.4.0
  hive_generator: ^2.0.1
  flutter_lints: ^3.0.0
```

### Project Structure
```
lib/
├── main.dart
├── app/
│   ├── app.dart
│   ├── router.dart
│   └── theme.dart
├── core/
│   ├── auth/
│   │   ├── auth_provider.dart
│   │   └── auth_repository.dart
│   ├── permissions/
│   │   └── permissions_provider.dart
│   ├── sync/
│   │   ├── sync_manager.dart
│   │   └── sync_queue.dart
│   └── utils/
│       ├── formatters.dart
│       ├── validators.dart
│       └── converters.dart
├── features/
│   ├── dive_log/
│   │   ├── data/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   └── providers/
│   │   ├── presentation/
│   │   │   ├── screens/
│   │   │   ├── widgets/
│   │   │   └── providers/
│   │   └── domain/
│   │       └── usecases/
│   ├── maintenance/
│   │   ├── data/
│   │   ├── presentation/
│   │   └── domain/
│   └── profile/
│       ├── data/
│       └── presentation/
└── shared/
    ├── widgets/
    ├── constants/
    └── extensions/
```

### Development Guidelines

#### Code Style
- Follow official Dart style guide
- Use meaningful variable names
- Comment complex logic
- Keep functions small and focused
- Use const constructors where possible

#### Testing Strategy
- **Unit Tests:** All business logic and utilities
- **Widget Tests:** All custom widgets
- **Integration Tests:** Critical user flows
- **Coverage Target:** 80% minimum

#### Performance Optimization
- Use const widgets where possible
- Implement lazy loading for lists
- Cache network images
- Debounce search inputs
- Use pagination for large datasets
- Profile with DevTools regularly

#### Error Handling
- Try-catch all async operations
- Display user-friendly error messages
- Log errors to console (dev) / Crashlytics (prod)
- Provide retry mechanisms
- Handle network errors gracefully

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup and dependencies
- [ ] Firebase configuration
- [ ] Authentication flow
- [ ] Permission system
- [ ] Navigation structure
- [ ] Theme and design system
- [ ] Local storage setup

### Phase 2: Dive Log Module (Week 3-4)
- [ ] Dive logging form (all steps)
- [ ] Dive history list
- [ ] Dive details view
- [ ] Edit/delete functionality
- [ ] Offline support
- [ ] Unit conversion

### Phase 3: Dive Dashboard (Week 5)
- [ ] Summary cards
- [ ] Charts implementation
- [ ] 7-day site matrix
- [ ] Filters and date range
- [ ] Export functionality

### Phase 4: Maintenance Module (Week 6-7)
- [ ] Asset management
- [ ] Maintenance logging form
- [ ] Cascading asset selection
- [ ] Service tracking logic
- [ ] Photo attachments
- [ ] Offline support

### Phase 5: Maintenance Dashboard (Week 8)
- [ ] Summary cards
- [ ] Asset list with status
- [ ] Maintenance history
- [ ] Filters and search
- [ ] Technician management

### Phase 6: Polish & Testing (Week 9-10)
- [ ] Unit tests
- [ ] Widget tests
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] User acceptance testing

### Phase 7: Deployment (Week 11-12)
- [ ] App store preparation
- [ ] Beta testing
- [ ] Production release
- [ ] Documentation
- [ ] Training materials

---

## Success Criteria

### Functional Requirements
- ✅ All dive log features working offline
- ✅ All maintenance features working offline
- ✅ Data syncs automatically when online
- ✅ Permission system enforced correctly
- ✅ Unit conversions accurate
- ✅ Charts display correctly
- ✅ Photo attachments work reliably

### Performance Requirements
- ✅ App startup < 2 seconds
- ✅ Form submission < 1 second (offline)
- ✅ List scrolling at 60 FPS
- ✅ Image loading optimized
- ✅ Battery usage acceptable

### Quality Requirements
- ✅ 80%+ test coverage
- ✅ Zero critical bugs
- ✅ Accessible to screen readers
- ✅ Works on iOS 13+ and Android 8+
- ✅ Responsive on all screen sizes

---

## Appendix

### Glossary
- **FOC:** Free of Charge
- **Drift Dive:** Dive where current carries divers along
- **Service Tracking:** Method of tracking when maintenance is due
- **Asset Hierarchy:** Parent-child relationship between assets

### References
- Web Application: https://github.com/YOUR_ORG/sea-saba-business-app
- Firebase Console: https://console.firebase.google.com
- Firestore Security Rules: See `firestore.rules` in web app repo
- Design Mockups: [Link to Figma/Design files]

### Contact
- **Project Lead:** [Name]
- **Backend Team:** [Contact]
- **Mobile Team:** [Contact]
- **QA Team:** [Contact]

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Next Review:** After Phase 1 completion
