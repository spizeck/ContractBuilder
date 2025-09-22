export interface Sighting {
  speciesId: string;
  count: number;
}

export interface Dive {
  id: string;
  date: Date;
  diveNumber: number;
  boatId: string;
  diveGuide: string; // or uid
  diveSiteId: string;
  maxDepth: number; // meters
  waterTemperature: number; // °C
  createdBy: string; // uid
  sightings: Sighting[];
}

export interface Species {
  id: string;
  name: string;
  scientificName?: string;
  category?: string;
  step?: number; // form grouping
  icon?: string;
  iucnStatus?: string;
}

export interface Site {
  id: string;
  name: string;
  region?: string;
  habitatType?: string;
  protectedArea?: boolean;
  depthRange?: string;
}

export interface Boat {
  id: string;
  name: string;
  capacity?: number;
  notes?: string;
}
