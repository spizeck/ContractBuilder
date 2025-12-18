export interface CrewMember {
  id: string;
  name: string;
  roles: CrewRole[];
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CrewRole = 'captain' | 'instructor' | 'dive_guide' | 'surface_support';
