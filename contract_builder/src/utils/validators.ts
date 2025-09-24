import { UserProfile } from "@/types/userTypes";
import { metersToFeet, celsiusToFahrenheit } from "@/utils/conversions";

export function validateDive(
  maxDepth: number,          // stored in meters
  waterTemp: number,         // stored in °C
  prefs?: UserProfile["preferences"]
): string[] {
  const warnings: string[] = [];

  // Depth
  if (maxDepth > 60) {
    const display = prefs?.units.depth === "feet"
      ? `${Math.round(metersToFeet(maxDepth))} ft`
      : `${maxDepth} m`;
    warnings.push(`Depth exceeds safe limit: ${display}`);
  }

  if (maxDepth < 6) {
    const display = prefs?.units.depth === "feet"
      ? `${Math.round(metersToFeet(maxDepth))} ft`
      : `${maxDepth} m`;
    warnings.push(`Depth is unusually shallow: ${display}`);
  }

  // Temperature
  if (waterTemp < 10 || waterTemp > 35) {
    const display = prefs?.units.temp === "fahrenheit"
      ? `${Math.round(celsiusToFahrenheit(waterTemp))} °F`
      : `${waterTemp} °C`;
    warnings.push(`Temperature is outside normal range: ${display}`);
  }

  return warnings;
}
