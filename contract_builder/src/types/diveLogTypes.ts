export interface Sighting {
  speciesId: string;
  count: number;
}

export interface Dive {
  id: string;
  date: any; // YYYY-MM-DD (string to avoid UTC shift issues)
  diveSlot: DiveSlot; // replaces diveNumber
  boatId: string;
  diveGuide: string;
  diveSiteId: string;
  maxDepth: number; // meters
  waterTemperature: number; // celsius
  sightings: Sighting[];
  createdBy: string;
  createdAt?: Date;
}

export interface Species {
  id: string;
  name: string;
  active: boolean;
  scientificName?: string;
  category?: string;
  step?: number; // form grouping
  icon?: string;
  iucnStatus?: string;
}

export interface Site {
  id: string;
  name: string;
  active: boolean;
  region?: string;
  habitatType?: string;
  protectedArea?: boolean;
  depthRange?: string;
}

export interface Boat {
  id: string;
  name: string;
  active: boolean;
  createdAt?: any
}

export interface FormattedDive extends Dive {
  boatName: string;
  siteName: string;
  depthDisplay: string;
  tempDisplay: string;
}

export interface Guide {
  id: string;
  name: string;
  active: boolean;
}

export type DiveSlot =
  | "9am"
  | "11am"
  | "1pm"
  | "4pm"
  | "night";