# Sea Saba Business App

A comprehensive business management platform for dive operations, contract creation, maintenance tracking, and business analytics.  
Designed for Sea Saba NV to streamline daily operations including dive logging, group contract management, equipment maintenance, and operational intelligence.

---

## Overview

The Sea Saba Business App is an integrated management system that combines multiple operational modules into a single, user-friendly platform. Built with modern web technologies, it provides real-time insights, automated workflows, and comprehensive reporting capabilities for dive shop operations.

---

## Core Features

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

### 🔧 **Maintenance & Asset Tracking**
- **Maintenance Dashboard**: Overview of all maintenance activities and upcoming services
- **Service Logs**: Complete maintenance history with costs and next service due dates
- **Asset Management**: Track company equipment, vehicles, and valuable assets
- **Technician Management**: Organize maintenance staff roles and assignments
- **Preventive Maintenance**: Automated reminders and scheduling for equipment service

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
- **File Storage**: Firebase Storage for PDFs and assets
- **API Layer**: Next.js API routes with Firebase integration
- **Real-time Updates**: Firestore real-time listeners for live data

### **Development Tools**
- **Package Manager**: npm
- **Type Safety**: TypeScript throughout the application
- **Code Quality**: ESLint + Prettier configuration
- **Build System**: Next.js optimized build pipeline
- **Environment Management**: dotenv for configuration

---

## User Roles & Permissions

### **All Staff Members**
- View and create maintenance logs
- Access dive history and viewing interfaces
- View asset and technician information
- Basic dashboard access

### **Managers & Administrators**
- Full contract creation and management capabilities
- Hotel and dive package configuration
- Asset and technician editing permissions
- Administrative functions and system settings
- Advanced analytics and reporting access

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
│   └── [id]/view/     # Individual contract viewing
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
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
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
- Maintain responsive design principles

### **Firebase Integration**
- Always use `next/navigation` for routing (App Router)
- Implement proper error handling for Firestore operations
- Use real-time listeners for live data updates
- Structure collections with proper indexing for performance

### **Component Architecture**
- Reusable components in `/src/components/`
- Page-specific components in respective `/components/` subdirectories
- Shared hooks and utilities in `/src/hooks/` and `/src/utils/`
- Type definitions in `/src/types/`

---

## Current Status & Roadmap

### **✅ Completed Features**
- Contract wizard with automated calculations
- Hotel and dive package management
- Firebase authentication with role-based access
- Dive logging and history viewing
- Maintenance tracking system
- Asset and technician management
- Dive operations dashboard
- Real-time data synchronization

### **🚀 In Development**
- Advanced reporting and export features
- Mobile app companion
- Multi-language support (English/Dutch)
- Enhanced notification system
- Integration with external booking platforms

### **📋 Planned Enhancements**
- AI-powered dive site recommendations
- Automated weather integration
- Customer relationship management
- Inventory management system
- Advanced financial analytics
- API integrations with partners

---

## Support & Maintenance

### **Application Monitoring**
- Firebase Performance Monitoring for performance tracking
- Crashlytics for error reporting
- Custom analytics for user behavior tracking

### **Data Security**
- Role-based access control
- Encrypted data transmission
- Regular security audits
- Backup and recovery procedures

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
