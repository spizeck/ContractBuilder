import {celsiusToFahrenheit, metersToFeet,} from "@/utils/conversions";
import {UserPreferences} from "@/types/userTypes";
import {Boat, Dive, Site, FormattedDive} from "@/types/diveLogTypes";

export function formatDiveValue(
  dive: Dive,
  prefs: UserPreferences,
  boats: Boat[],
  sites: Site[]
): FormattedDive {
  let depthDisplay: string;
  let tempDisplay: string;

  if (prefs.units.depth === "feet") {
    depthDisplay = `${Math.round(metersToFeet(dive.maxDepth))} ft`;
  } else {
    depthDisplay = `${(Math.round(dive.maxDepth * 2) / 2).toFixed(1)} m`; // 0.5 increments
  }

  if (prefs.units.temp === "fahrenheit") {
    tempDisplay = `${Math.round(celsiusToFahrenheit(dive.waterTemperature))} °F`;
  } else {
    tempDisplay = `${(Math.round(dive.waterTemperature * 2) / 2).toFixed(1)} °C`;
  }


  return {
    ...dive,
    depthDisplay,
    tempDisplay,
    boatName: boats.find((b) => b.id === dive.boatId)?.name || "-",
    siteName: sites.find((s) => s.id === dive.diveSiteId)?.name || "-",
  };
}
