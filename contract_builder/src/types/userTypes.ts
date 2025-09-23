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
  role: "admin" | "guide" | "customer"; // adjust for your roles
  createdAt: string; // ISO date
  preferences: UserPreferences; // optional in case older users don’t have it
}
