import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, UserPreferences } from "@/types/userTypes";

const defaultPrefs: UserPreferences = {
  units: { depth: "meters", temp: "celsius", pressure: "bar" },
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;

  const data = snap.data() as Partial<UserProfile>;
  return {
    ...(data as UserProfile),
    preferences: {
      ...defaultPrefs,
      ...data.preferences,
      units: {
        depth: (data.preferences?.units.depth as "meters" | "feet") ?? "meters",
        temp: (data.preferences?.units.temp as "celsius" | "fahrenheit") ?? "celsius",
        pressure: (data.preferences?.units.pressure as "bar" | "psi") ?? "bar",
      },
    },
  };
}

export async function updateUserProfile(uid: string, profile: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  return updateDoc(userRef, profile);
}