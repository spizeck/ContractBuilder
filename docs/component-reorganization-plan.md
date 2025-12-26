# Component Reorganization Plan

## Current Structure Issues
- Inconsistent organization: some features have components folders, others don't
- Components scattered across app directory
- Mixed patterns (centralized vs co-located)

## Target Structure (Next.js App Router Convention)
```
src/app/
├── admin/
│   ├── components/
│   │   ├── AddEditBoatForm.tsx
│   │   ├── AddEditSiteForm.tsx
│   │   └── AddEditSpeciesForm.tsx
│   ├── boats/page.tsx
│   ├── guides/page.tsx
│   └── species/page.tsx
├── contracts/
│   ├── components/
│   │   ├── DivePackageSelectionForm.tsx
│   │   ├── GroupContractForm.tsx
│   │   ├── GroupContractWizard.tsx
│   │   └── ... (other contract components)
│   └── page.tsx
├── dives/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── ChartHeader.tsx
│   │   │   ├── SeasonalWildlifePatterns.tsx
│   │   │   └── ... (other dashboard components)
│   │   └── page.tsx
│   ├── components/
│   │   ├── DiveLogForm.tsx
│   │   └── DiveView.tsx
│   └── log/page.tsx
├── hotels/
│   ├── components/
│   │   ├── AddEditMealPackageForm.tsx
│   │   ├── AddEditRateForm.tsx
│   │   └── ... (other hotel components)
│   └── page.tsx
├── maintenance/
│   ├── components/
│   │   ├── MaintenanceLogForm.tsx
│   │   └── ... (other maintenance components)
│   └── page.tsx
└── components/
    ├── LogoutButton.tsx
    ├── NavLinks.tsx
    ├── ProtectedPage.tsx
    ├── ThemeToggle.tsx
    └── shared/
        ├── FormComponents/
        ├── ChartComponents/
        └── LayoutComponents/
```

## Migration Strategy

### Phase 1: Create Missing Component Folders
1. Create `src/app/admin/components/`
2. Create `src/app/hotels/components/`
3. Create `src/app/maintenance/components/`
4. Create `src/app/dives/components/` (separate from dashboard)
5. Create `src/components/shared/` subfolders

### Phase 2: Move Components by Feature
**Admin Components (High Priority)**
- Move `app/admin/boats/AddEditBoatForm.tsx` → `app/admin/components/`
- Move `app/admin/sites/AddEditSiteForm.tsx` → `app/admin/components/`
- Move `app/admin/species/AddEditSpeciesForm.tsx` → `app/admin/components/`

**Contract Components (High Priority)**
- Already well organized in `app/contracts/components/`
- Verify all components are properly placed

**Dive Components (Medium Priority)**
- Keep `app/dives/dashboard/components/` as-is
- Create `app/dives/components/` for non-dashboard dive components
- Move any scattered dive forms here

**Hotel Components (Medium Priority)**
- Move all hotel form components to `app/hotels/components/`
- Group related forms together

**Maintenance Components (Medium Priority)**
- Move maintenance components to `app/maintenance/components/`
- Organize by functionality

### Phase 3: Update Import Paths
For each moved component:
1. Use IDE "Find All References" to locate imports
2. Update import paths systematically
3. Test the affected pages
4. Commit changes per feature

### Phase 4: Organize Shared Components
1. Move truly reusable components to `src/components/shared/`
2. Create subcategories:
   - `FormComponents/` (forms, inputs, validation)
   - `ChartComponents/` (charts, data visualization)
   - `LayoutComponents/` (navigation, layout, common UI)

## Files to Move (39 total)

### Admin Forms (3 files)
- `app/admin/boats/AddEditBoatForm.tsx`
- `app/admin/sites/AddEditSiteForm.tsx`
- `app/admin/species/AddEditSpeciesForm.tsx`

### Contract Components (8 files) - Already organized
- `app/contracts/components/*` - No action needed

### Dive Components (6 files)
- `app/dives/dashboard/components/*` - Keep as-is
- Any other scattered dive forms

### Hotel Components (15 files)
- `app/hotels/AddEditMealPackageForm.tsx`
- `app/hotels/AddEditRateForm.tsx`
- `app/hotels/AddEditRoomCategoryForm.tsx`
- `app/hotels/AddEditRoomTypeForm.tsx`
- `app/hotels/AddEditSeasonForm.tsx`
- `app/hotels/AddHotelForm.tsx`
- `app/hotels/HotelDetails.tsx`
- `app/hotels/HotelPageContent.tsx`
- And other hotel components...

### Maintenance Components (18 files)
- All maintenance-related components
- Organize by functionality

### Shared Components (4 files)
- `src/components/LogoutButton.tsx`
- `src/components/NavLinks.tsx`
- `src/components/ProtectedPage.tsx`
- `src/components/ThemeToggle.tsx`

## Import Path Updates

### Before
```typescript
import AddEditBoatForm from '@/app/admin/boats/AddEditBoatForm'
```

### After
```typescript
import AddEditBoatForm from '@/app/admin/components/AddEditBoatForm'
```

## Testing Strategy
1. Test each feature after moving its components
2. Verify all imports resolve correctly
3. Check for any broken references
4. Run full application test after all moves

## Benefits
- Consistent organization across all features
- Follows Next.js app router conventions
- Easier to locate and maintain components
- Clear separation between pages and components
- Better scalability for future development
