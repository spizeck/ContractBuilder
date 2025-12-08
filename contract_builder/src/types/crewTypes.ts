export interface CrewMember {
  id: string;
  name: string;
  role: 'captain' | 'crew' | 'dive_master' | 'deckhand';
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
