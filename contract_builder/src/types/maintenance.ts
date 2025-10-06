// src/types/maintenance.ts
export interface Asset {
  id: string
  name: string
  category: 'Boat' | 'Compressor' | 'Vehicle' | 'Equipment' | 'Other'
  description?: string
  serialNumber?: string
  hours?: number
  lastServiceDate?: Date
  nextServiceDue?: number
  active: boolean
}

export interface Technician {
  id: string
  name: string
  role?: string
  certifications?: string
  active: boolean
}

export interface MaintenanceLog {
  id: string
  assetId: string
  assetName: string
  category: string
  date: Date
  technicianId: string
  technicianName: string
  summary: string
  details: string
  hoursAtService?: number
  nextServiceDue?: number
  cost?: number
  attachments?: string[]
  createdBy: string
  createdAt: Date
}
