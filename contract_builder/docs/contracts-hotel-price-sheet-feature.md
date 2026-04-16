# Hotel Price & Info Sheet Generator (Contracts Module)

## Overview

Add a new feature to the Contracts module that allows Sea Saba staff to generate a printable hotel-specific price and information sheet.

This feature is intended to be a read-only reporting / print tool, not a contract record. It should use existing hotel, season, room rate, dive package, and meal package data to build a clean print preview that can be printed or saved as PDF.

The sheet should allow the user to:

- Select a hotel
- Select one or more seasons for that hotel
- Select which dive packages to include
- Select which meal packages to include
- Toggle which hotel info sections are shown
- Preview the sheet live
- Print / Save as PDF

---

## Goals

### Primary goal

Generate a clean printable hotel sheet that includes:

1. Hotel info at the top
2. Seasonal room rates
3. Selected dive packages
4. Selected meal packages

### Important note

This feature should use the existing data model as-is.

- Room rates are already seasonal via `Rate`
- Dive packages currently have a single fixed `price`
- Meal packages currently have a single fixed `price`

That means:

- Room rates should be displayed by selected season
- Dive packages should be displayed with their flat price
- Meal packages should be displayed with their flat price

---

## Existing Types Used

This feature should use the existing interfaces already in the contracts module:

- `Hotel`
- `Season`
- `Rate`
- `RoomCategory`
- `DivePackage`
- `MealPackage`

### Relevant existing fields

#### Hotel
- `id`
- `name`
- `location`
- `description`
- `contactInfo`
- `amenities`
- `policies`
- `restrictions`
- `logoUrl`

#### Season
- `id`
- `hotelId`
- `name`
- `startDate`
- `endDate`

#### Rate
- `id`
- `hotelId`
- `categoryId`
- `seasonId`
- `occupancyType`
- `price`

#### RoomCategory
- `id`
- `hotelId`
- `name`
- `occupancyTypes`

#### DivePackage
- `id`
- `name`
- `description`
- `price`

#### MealPackage
- `id`
- `hotelId`
- `name`
- `description`
- `price`
- `commissionRate`

---

## New Route

Create a new page in the Contracts module:

- Recommended route: `/contracts/hotel-sheets`

Alternative acceptable route:

- `/contracts/hotel-price-sheets`

This page should be available from the Contracts module navigation.

---

## Feature Scope (V1)

### In scope

- Hotel selection
- Season multi-select (hotel-specific)
- Dive package multi-select
- Meal package multi-select (hotel-specific)
- Hotel info section at the top of the sheet
- Seasonal room rate tables
- Dive package section
- Meal package section
- Live preview
- Print / Save as PDF
- Print-friendly layout and CSS
- Toggleable hotel info sections

### Out of scope for V1

- Saving generated sheets as database records
- Editing hotel/package data from this screen
- Seasonal dive package pricing
- Seasonal meal package pricing
- Email sending
- Rich text editing of the generated sheet
- Reordering sections by drag-and-drop

---

## UX / Layout

### Page layout

Use a 2-column layout on desktop:

- Left column: configuration panel
- Right column: live preview panel

On smaller screens, stack vertically.

### Suggested structure

- Page title
- Actions row
- Left configuration form
- Right preview

---

## Configuration Panel Requirements

### 1. Hotel selection

Required field.

- Use a searchable select if available
- Load all non-archived hotels
- After selecting a hotel:
  - load seasons for that hotel
  - load room categories for that hotel
  - load rates for that hotel
  - load meal packages for that hotel

### 2. Season selection

Required field.

- Multi-select
- Only show non-archived seasons for the selected hotel
- Display:
  - season name
  - date range
- At least one season must be selected

### 3. Dive package selection

Optional, but normally expected.

- Multi-select
- Load all non-archived dive packages
- Show:
  - name
  - optional price in selector if helpful

### 4. Meal package selection

Optional.

- Multi-select
- Load non-archived meal packages for the selected hotel
- Show:
  - name
  - optional price in selector if helpful

### 5. Display options

Boolean toggles:

- Include hotel description
- Include contact info
- Include amenities
- Include policies
- Include restrictions
- Include hotel logo
- Include meal commission info (internal use only)

Recommended defaults:

- description: true
- contact info: true
- amenities: true
- policies: true
- restrictions: false
- logo: true
- meal commission: false

### 6. Actions

Buttons:

- Preview (optional if preview is live)
- Print / Save PDF
- Reset

---

## Print Preview Requirements

The right-side preview should render a print-friendly document.

### Top of sheet

Render:

- Sea Saba branding / page title
- generated date
- hotel name

### Hotel info section (top of content)

Render hotel info at the top in this general order:

1. Hotel name
2. Location
3. Logo (if enabled and present)
4. Description (if enabled)
5. Contact info (if enabled)
6. Amenities (if enabled)
7. Policies (if enabled)
8. Restrictions (if enabled)

### Seasonal room rates section

For each selected season:

- Render season name
- Render season date range
- Render room rates table

#### Room rates table columns

- Room Category
- Occupancy
- Price

Rows should be built by joining:

- selected `Season`
- matching `Rate` records for that season
- `RoomCategory` by `categoryId`

#### Sort order recommendation

Sort rates by:

1. Room category name
2. Occupancy type

### Dive packages section

Render only selected dive packages.

For each selected package:

- name
- description
- flat price

Important:
Dive packages currently use a single `price` field, so in V1 they should not be shown by season.

### Meal packages section

Render only selected meal packages.

For each selected package:

- name
- description
- flat price

Optional:
If `includeMealCommissionInfo` is enabled, show commission rate.

Important:
Meal packages currently use a single `price` field, so in V1 they should not be shown by season.

---

## Data Model for Local Page State

Create a local config type for the generator.

```ts
export interface HotelSheetConfig {
  hotelId: string;
  seasonIds: string[];
  divePackageIds: string[];
  mealPackageIds: string[];
  includeDescription: boolean;
  includeContactInfo: boolean;
  includeAmenities: boolean;
  includePolicies: boolean;
  includeRestrictions: boolean;
  includeLogo: boolean;
  includeMealCommissionInfo: boolean;
}
```

Recommended default state:

```ts
const defaultHotelSheetConfig: HotelSheetConfig = {
  hotelId: '',
  seasonIds: [],
  divePackageIds: [],
  mealPackageIds: [],
  includeDescription: true,
  includeContactInfo: true,
  includeAmenities: true,
  includePolicies: true,
  includeRestrictions: false,
  includeLogo: true,
  includeMealCommissionInfo: false,
};
```

---

## View Model for Preview Rendering

Do not render the preview directly from raw collections. Build a derived view model first.

```ts
export interface HotelSheetSeasonRates {
  seasonId: string;
  seasonName: string;
  startDate: string;
  endDate: string;
  rates: {
    categoryId: string;
    categoryName: string;
    occupancyType: string;
    price: number;
  }[];
}

export interface HotelSheetViewModel {
  hotel: Hotel | null;
  seasons: HotelSheetSeasonRates[];
  divePackages: DivePackage[];
  mealPackages: MealPackage[];
  generatedAt: string;
  options: {
    includeDescription: boolean;
    includeContactInfo: boolean;
    includeAmenities: boolean;
    includePolicies: boolean;
    includeRestrictions: boolean;
    includeLogo: boolean;
    includeMealCommissionInfo: boolean;
  };
}
```

---

## Data Loading Requirements

### Collections needed

Load from existing data sources / hooks / services used in the Contracts module:

- hotels
- seasons
- rates
- roomCategories
- divePackages
- mealPackages

### Filtering rules

- Hotels: exclude archived
- Seasons: exclude archived, filter by `hotelId`
- Rates: exclude archived, filter by `hotelId`
- Room categories: exclude archived, filter by `hotelId`
- Dive packages: exclude archived
- Meal packages: exclude archived, filter by `hotelId`

---

## Component Breakdown (Recommended)

Recommended components:

- `HotelSheetPage`
- `HotelSheetForm`
- `HotelSheetPreview`
- `HotelInfoSection`
- `SeasonRatesSection`
- `DivePackagesSection`
- `MealPackagesSection`

### Suggested file structure

```text
contracts/
  hotel-sheets/
    page.tsx
    components/
      HotelSheetForm.tsx
      HotelSheetPreview.tsx
      HotelInfoSection.tsx
      SeasonRatesSection.tsx
      DivePackagesSection.tsx
      MealPackagesSection.tsx
    utils/
      buildHotelSheetViewModel.ts
      formatCurrency.ts
      formatDateRange.ts
```

If the project structure differs, follow the existing conventions in the contracts module.

---

## Print Behavior

### Requirements

When the user clicks Print / Save PDF:

- Print only the preview content
- Hide app navigation and configuration panel
- Preserve readable spacing
- Avoid breaking section headers from their content
- Ensure tables remain readable on Letter / A4

### CSS requirements

Use print-specific styles:

- `@media print`
- Hide left configuration panel
- Hide buttons / controls
- Hide page chrome if possible
- Set preview width to full printable width
- Use `break-inside: avoid` on cards/sections where possible
- Use `page-break-inside: avoid` for compatibility where needed

### Important print rules

Try to avoid splitting:

- hotel info section
- each season header from its rate table
- individual dive package cards
- individual meal package cards

---

## Validation Rules

Prevent or warn when:

- no hotel selected
- no seasons selected
- selected hotel has no room categories
- selected hotel has no rates for one or more selected seasons

### Missing data behavior

If data is missing:

- Missing hotel section field: hide that subsection
- Missing room rates for a selected season: show a warning in preview and optionally render “No rates found”
- No selected dive packages: omit section
- No selected meal packages: omit section

---

## Sorting Recommendations

### Seasons

Sort by `startDate` ascending.

### Room rates within each season

Sort by:

1. room category name ascending
2. occupancy type ascending

### Packages

Sort by package name unless user selection order is intentionally preserved.

---

## Acceptance Criteria

This feature is complete when:

- User can open the Hotel Sheets page
- User can select a hotel
- User can select one or more seasons for that hotel
- User can select zero or more dive packages
- User can select zero or more meal packages for that hotel
- Hotel information appears at the top of the preview
- Room rates render correctly grouped by selected season
- Dive packages render with name, description, and flat price
- Meal packages render with name, description, and flat price
- Optional hotel sections can be toggled on/off
- Print view is clean and usable
- User can save as PDF via browser print dialog

---

## Recommended Implementation Order

### Step 1
Create the new route and page shell.

### Step 2
Build the config state and form UI.

### Step 3
Load the required collections and filter by selected hotel.

### Step 4
Create `buildHotelSheetViewModel.ts` to join:

- hotel
- selected seasons
- rates
- room categories
- selected dive packages
- selected meal packages

### Step 5
Build the preview components.

### Step 6
Add print button and print CSS.

### Step 7
Polish empty states, warnings, and formatting.

---

## Future Enhancements (Not V1)

Potential future improvements:

- Save / load sheet templates
- Client-facing vs internal output modes
- Seasonal dive package pricing
- Seasonal meal package pricing
- Export to generated PDF file (instead of browser print only)
- Include room type quantity or FOC indicators if desired
- Add custom notes block per generated sheet

### Future schema suggestion for seasonal package pricing

If seasonal package pricing is needed later, add separate rate collections instead of changing the existing package interfaces directly.

Example:

```ts
export interface DivePackageRate {
  id: string;
  divePackageId: string;
  seasonId: string;
  price: number;
  archived?: boolean;
}

export interface MealPackageRate {
  id: string;
  mealPackageId: string;
  seasonId: string;
  price: number;
  archived?: boolean;
}
```

This keeps package metadata separate from seasonal pricing.