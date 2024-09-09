This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Roadmap

### 1. **Group Contract Page Workflow**

#### a. **View/Edit Existing Contract or Create New Contract**
- **View/Edit Option**: Display a list of contracts (with filtering by group name, hotel, and date).
- **Create New Contract Option**:
  - **Step 1**: Collect basic group information:
    - Group name (text input)
    - Dates (date picker)
    - Hotel (dropdown list of hotels)
    - Booking type (dropdown: tour operator or dive shop)
  - **Step 2**: Room selection:
    - Dynamically load room types available for the selected hotel and season.
    - Allow the user to specify the number of rooms and occupancy (single, double, etc.).
  - **Step 3**: Dive package selection:
    - Load available dive packages based on the selected season.
    - Include a field to enter the number of divers (since some group members may not be divers).
  - **Step 4**: Meal package selection:
    - Select from available meal packages for the chosen hotel and season.
  - **Step 5**: Total cost calculation and PDF generation:
    - Calculate the total cost based on the selected options.
    - Insert terms and conditions based on the hotel and season.
    - Save the contract to Firestore.
    - Generate the PDF with the contract details, ready for customer confirmation.

---

### 2. **View/Edit Hotel Data**

#### a. **List of Hotels**
- **Add New Hotel**: Button to add a new hotel if not already in the list.
- **View/Edit Hotel**: For each hotel, display and allow editing of:
  - **Room types**: Add/edit room types and occupancy options (e.g., single, double occupancy).
  - **Meal package options**: Add/edit meal packages offered by the hotel.
  - **Seasons**: Display a list of seasons, and for each season:
    - Enter start and end dates for the season.
    - Add room rates for the season, including different occupancy rates.
    - Add season-specific terms and conditions.
    - Define the comp policy (e.g., "every 7th guest receives a $X discount").
  - **Dive Packages**: Will be handled separately (outside this form).

---

### 3. **Contract Selection from List**

- Display contracts in a list, filtered by:
  - Group name
  - Hotel
  - Dates (start and end)
- Users can click to view or edit the contract details, which opens a form similar to the "Create New Contract" workflow, but pre-filled with existing contract data for editing.

---

### 4. **Contract Summary and PDF Generation**

- **Summary**: Once the contract has been built, display a summary page that shows:
  - Group name
  - Dates
  - Hotel name
  - Room selections
  - Dive package (number of divers and total price)
  - Meal package
  - Total cost
  - Terms and conditions
- **Generate PDF**: A button to generate a PDF from this summary. The PDF will include:
  - Contract details
  - Space for customer confirmation (signature, date, etc.)

---

### 5. **Dive Packages with Seasonal Pricing and Discounts**

Dive packages will be managed separately. For each dive package:
- **Seasonal pricing**: Pricing will change based on the selected season (loaded dynamically).
- **Discounts**: The comp policy will be based on the number of divers (e.g., "$X discount for every 7th diver").

---

### Steps for Building

#### **Phase 1: Group Contract Form**
1. Build the "Create New Contract" form with the necessary fields.
2. Implement dynamic loading of hotel-specific data (rooms, dive packages, meal packages) based on the selected hotel and season.
3. Implement total cost calculation.
4. Build the summary page with a PDF generation feature.

#### **Phase 2: View/Edit Hotel Data**
1. Create a list of hotels with the ability to add/edit hotels.
2. Implement forms to manage room types, meal packages, and seasonal data (occupancy rates, comp policies, etc.).

#### **Phase 3: Contract Selection and Filtering**
1. Build a list page for viewing contracts, with filtering options (group name, hotel, date).
2. Implement a form to edit existing contracts.

#### **Phase 4: Dive Packages Management**
1. Build a form to manage universal dive packages, with seasonal pricing and discount rules.
