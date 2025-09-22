# Group Contract Builder

A web application for creating, managing, and exporting **group contracts** for hotels, dive packages, and meal packages.  
Designed for dive shops, tour operators, and travel partners to streamline the process of building contracts, applying commission rules, and generating printable PDFs.

---

## Features

- **User Authentication**  
  - Secure login with Firebase (in progress).  
  - Role-based access so users only see what they’re allowed to.

- **Contract Creation Wizard**  
  - Guided step-by-step process to build a contract:
    1. Enter group details (name, dates, hotel, booking type).  
    2. Select room types and quantities.  
    3. Add dive packages (seasonal pricing, FOC rules, 7+1 diver discount).  
    4. Add meal packages (hotel-specific, commissionable).  
    5. Review totals, commissions, and policies.  

- **Hotel Data Management**  
  - Add/edit hotel profiles.  
  - Configure room categories, occupancy options, seasonal rates, policies, and FOC (Free of Charge) rules.  
  - Define meal package options and commission rates.

- **Contract Management**  
  - View, filter, and search saved contracts by group name, hotel, or date.  
  - Edit contracts — old versions are auto-archived.  
  - Printable contract view with hotel info, amenities, and acceptance/signature section.  

- **FOC & Commission Logic**  
  - Room, dive, and meal packages automatically adjust for Free of Charge rules.  
  - Commissions calculated by booking type (`diveShop10`, `diveShop15`, `tourOperator20`, `tourOperator25`).  
  - Meal commissions are hotel-specific.  
  - Dive FOC always applies as 7 paid + 1 free.  

- **PDF Generation**  
  - Auto-generated PDFs with summary tables and customer confirmation section.

---

## Tech Stack

- **Frontend:** Next.js + React + TypeScript  
- **Styling:** Chakra UI + Tailwind (hybrid components)  
- **Database:** Firebase Firestore  
- **Authentication:** Firebase Auth (in progress)  
- **PDFs:** jsPDF / react-pdf  
- **State Management:** React Context + Local Storage (for form persistence)  

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_ORG/contract-builder.git
cd contract-builder
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
Create a `.env.local` file in the root with your Firebase credentials:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxx
```

### 4. Run the development server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## Usage

- **Creating a New Contract** – Navigate to Contracts > New Contract. Follow the wizard to add details.  
- **Viewing Contracts** – Navigate to Contracts > View Contracts. Search and filter by hotel, group, or date.  
- **Editing Contracts** – Select a contract and click Edit. The previous version is archived automatically.  
- **Managing Hotels** – Navigate to Hotels > View/Edit to manage hotel data, seasons, rates, and packages.  


## Roadmap

- ✅ Contract wizard with auto-calculation
- ✅ Hotel/room/dive/meal package database
- ✅ PDF export with acceptance signature
- ✅ Firebase Auth login & role permissions
- 🔄 Migrate Divelog
- 🔄 Multi-language support (English/Dutch)
- 🔄 Export to Excel

## License

Copyright © 2025 Sea Saba NV  

This software is proprietary and confidential.  
Unauthorized copying, distribution, modification, or use of this software, via any medium, is strictly prohibited without prior written consent from the owners.  

The source code and related assets are provided solely for internal business operations of Sea Saba NV.  
No part of this software may be reproduced or transmitted in any form or by any means without explicit permission.  

All rights reserved.
