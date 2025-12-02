import { getDives } from './dives'
import { getBoats } from './boats'
import { getSites } from './sites'
import { getGuides } from './guides'
import { getSpecies } from './species'
import type {
  DiveDashboardData,
  DiveDashboardStats,
  DailySiteMatrix,
  BoatSiteEntry,
  TemperatureTrend,
  SiteVisitationData,
  SeasonalWildlifePattern,
  BoatDiveStats,
  GuideDiveStats
} from '@/types/dashboard'
import type { Dive, Boat, Guide, Site, Species } from '@/types/diveLogTypes'

export async function getDiveDashboardData(): Promise<DiveDashboardData> {
  const [dives, boats, sites, guides, species] = await Promise.all([
    getDives(),
    getBoats(),
    getSites(),
    getGuides(true),
    getSpecies()
  ])

  const stats = calculateDiveStats(dives, boats, guides)
  const siteMatrix = generateSiteMatrix(dives, boats, sites)
  const temperatureTrends = calculateTemperatureTrends(dives)
  const siteVisitation = calculateSiteVisitation(dives, sites)
  const seasonalPatterns = calculateSeasonalPatterns(dives, species)

  return {
    stats,
    siteMatrix,
    temperatureTrends,
    siteVisitation,
    seasonalPatterns
  }
}

function calculateDiveStats(
  dives: Dive[],
  boats: Boat[],
  guides: Guide[]
): DiveDashboardStats {
  const totalDives = dives.length
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const divesLast7Days = dives.filter(dive => {
    const diveDate = new Date(dive.date)
    return diveDate >= sevenDaysAgo
  }).length

  // Calculate dives by boat
  const boatsMap = new Map<string, BoatDiveStats>()
  boats.forEach(boat => {
    boatsMap.set(boat.id, { boat, diveCount: 0, percentage: 0 })
  })
  
  dives.forEach(dive => {
    const stats = boatsMap.get(dive.boatId)
    if (stats) stats.diveCount++
  })

  const divesByBoat = Array.from(boatsMap.values())
    .filter(stat => stat.diveCount > 0)
    .map(stat => ({
      ...stat,
      percentage: totalDives > 0 ? (stat.diveCount / totalDives) * 100 : 0
    }))
    .sort((a, b) => b.diveCount - a.diveCount)

  // Calculate dives by guide
  const guidesMap = new Map<string, GuideDiveStats>()
  guides.forEach(guide => {
    guidesMap.set(guide.name, { guide, diveCount: 0, percentage: 0 })
  })
  
  dives.forEach(dive => {
    const stats = guidesMap.get(dive.diveGuide)
    if (stats) stats.diveCount++
  })

  const divesByGuide = Array.from(guidesMap.values())
    .filter(stat => stat.diveCount > 0)
    .map(stat => ({
      ...stat,
      percentage: totalDives > 0 ? (stat.diveCount / totalDives) * 100 : 0
    }))
    .sort((a, b) => b.diveCount - a.diveCount)

  // Calculate average temperature
  const temperatures = dives.map(dive => dive.waterTemperature).filter(temp => temp != null)
  const averageTemperature = temperatures.length > 0 
    ? temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length 
    : 0

  return {
    totalDives,
    divesLast7Days,
    divesByBoat,
    divesByGuide,
    averageTemperature: Math.round(averageTemperature * 10) / 10
  }
}

function generateSiteMatrix(
  dives: Dive[],
  boats: Boat[],
  sites: Site[]
): DailySiteMatrix[] {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentDives = dives.filter(dive => {
    const diveDate = new Date(dive.date)
    return diveDate >= sevenDaysAgo
  })

  // Group dives by date and boat
  const dailyData = new Map<string, Map<string, Dive[]>>()
  
  recentDives.forEach(dive => {
    const dateKey = new Date(dive.date).toISOString().split('T')[0]
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, new Map())
    }
    
    const boatMap = dailyData.get(dateKey)!
    if (!boatMap.has(dive.boatId)) {
      boatMap.set(dive.boatId, [])
    }
    boatMap.get(dive.boatId)!.push(dive)
  })

  // Convert to matrix format
  const matrix: DailySiteMatrix[] = []
  const sortedDates = Array.from(dailyData.keys()).sort().reverse()

  sortedDates.forEach(date => {
    const boatMap = dailyData.get(date)!
    const boatSites: BoatSiteEntry[] = []

    boatMap.forEach((diveList, boatId) => {
      const boat = boats.find(b => b.id === boatId)
      if (!boat) return

      const uniqueSites = new Set(diveList.map(dive => dive.diveSiteId))
      const siteList = Array.from(uniqueSites)
        .map(siteId => sites.find(s => s.id === siteId))
        .filter((site): site is Site => site !== undefined)

      boatSites.push({
        boat,
        sites: siteList,
        dives: diveList
      })
    })

    matrix.push({
      date,
      boatSites: boatSites.sort((a, b) => a.boat.name.localeCompare(b.boat.name))
    })
  })

  return matrix
}

function calculateTemperatureTrends(dives: Dive[]): TemperatureTrend[] {
  const tempByDate = new Map<string, { temperatures: number[], count: number }>()

  dives.forEach(dive => {
    const dateKey = new Date(dive.date).toISOString().split('T')[0]
    if (!tempByDate.has(dateKey)) {
      tempByDate.set(dateKey, { temperatures: [], count: 0 })
    }
    
    const data = tempByDate.get(dateKey)!
    if (dive.waterTemperature != null) {
      data.temperatures.push(dive.waterTemperature)
    }
    data.count++
  })

  const trends: TemperatureTrend[] = []
  const sortedDates = Array.from(tempByDate.keys()).sort().slice(-30) // Last 30 days

  sortedDates.forEach(date => {
    const data = tempByDate.get(date)!
    const avgTemp = data.temperatures.length > 0
      ? data.temperatures.reduce((sum, temp) => sum + temp, 0) / data.temperatures.length
      : 0

    trends.push({
      date,
      temperature: Math.round(avgTemp * 10) / 10,
      diveCount: data.count
    })
  })

  return trends
}

function calculateSiteVisitation(dives: Dive[], sites: Site[]): SiteVisitationData[] {
  const siteStats = new Map<string, { count: number, lastVisited: Date }>()

  sites.forEach(site => {
    siteStats.set(site.id, { count: 0, lastVisited: new Date(0) })
  })

  dives.forEach(dive => {
    const stats = siteStats.get(dive.diveSiteId)
    if (stats) {
      stats.count++
      const diveDate = new Date(dive.date)
      if (diveDate > stats.lastVisited) {
        stats.lastVisited = diveDate
      }
    }
  })

  const totalVisits = dives.length
  const visitation: SiteVisitationData[] = []

  siteStats.forEach((stats, siteId) => {
    const site = sites.find(s => s.id === siteId)
    if (site && stats.count > 0) {
      visitation.push({
        site,
        visitCount: stats.count,
        lastVisited: stats.lastVisited,
        percentage: totalVisits > 0 ? (stats.count / totalVisits) * 100 : 0
      })
    }
  })

  return visitation.sort((a, b) => b.visitCount - a.visitCount)
}

function calculateSeasonalPatterns(
  dives: Dive[],
  species: Species[]
): SeasonalWildlifePattern[] {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const patterns = new Map<string, Map<string, { count: number, dives: number }>>()

  // Initialize all months
  monthNames.forEach(month => {
    patterns.set(month, new Map())
  })

  dives.forEach(dive => {
    const month = monthNames[new Date(dive.date).getMonth()]
    const monthPattern = patterns.get(month)!

    dive.sightings?.forEach(sighting => {
      if (sighting.count > 0) {
        if (!monthPattern.has(sighting.speciesId)) {
          monthPattern.set(sighting.speciesId, { count: 0, dives: 0 })
        }
        const stats = monthPattern.get(sighting.speciesId)!
        stats.count += sighting.count
        stats.dives++
      }
    })
  })

  const seasonalData: SeasonalWildlifePattern[] = []

  patterns.forEach((speciesMap, month) => {
    const monthSpecies: Species[] = []
    let totalSightings = 0
    let diveCount = 0

    speciesMap.forEach((stats, speciesId) => {
      const speciesData = species.find(s => s.id === speciesId)
      if (speciesData) {
        monthSpecies.push(speciesData)
        totalSightings += stats.count
        diveCount += stats.dives
      }
    })

    if (monthSpecies.length > 0) {
      seasonalData.push({
        month,
        species: monthSpecies.sort((a, b) => {
          const aCount = speciesMap.get(a.id)?.count || 0
          const bCount = speciesMap.get(b.id)?.count || 0
          return bCount - aCount
        }),
        totalSightings,
        diveCount
      })
    }
  })

  return seasonalData
}
