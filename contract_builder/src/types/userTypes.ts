export interface UserPreferences {
  units: {
    depth: "meters" | "feet";
    temp: "celsius" | "fahrenheit";
    pressure: "bar" | "psi";
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "hotel-manager" | "hotel-staff" | "viewer"; // actual roles from auth context
  hotelId?: string; // Assigned hotel for staff/manager roles
  createdAt: string; // ISO date
  preferences: UserPreferences; // optional in case older users don't have it
}
