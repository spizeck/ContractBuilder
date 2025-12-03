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
  const statsLast30Days = calculateDiveStatsForPeriod(dives, boats, guides, 'last30days')
  const statsCurrentYear = calculateDiveStatsForPeriod(dives, boats, guides, 'currentYear')
  
  const siteMatrix = generateSiteMatrix(dives, boats, sites)
  const temperatureTrends = calculateTemperatureTrends(dives, 'all') // Get all data for client-side filtering
  const siteVisitation = calculateSiteVisitation(dives, sites, 'all') // Get all data for client-side filtering
  const seasonalPatterns = calculateSeasonalPatterns(dives, species)

  return {
    stats,
    statsLast30Days,
    statsCurrentYear,
    siteMatrix,
    temperatureTrends,
    siteVisitation,
    seasonalPatterns
  }
}

export async function getTemperatureTrends(period: 'all' | '30days' | '12months' | '24months' = 'all'): Promise<TemperatureTrend[]> {
  const dives = await getDives()
  return calculateTemperatureTrends(dives, period)
}

export async function getSiteVisitation(period: 'all' | '30days' | '90days' | '12months' = 'all'): Promise<SiteVisitationData[]> {
  const [dives, sites] = await Promise.all([getDives(), getSites()])
  return calculateSiteVisitation(dives, sites, period)
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

  // Calculate average temperature for last 14 days
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  
  const recentTemperatures = dives
    .filter(dive => {
      const diveDate = new Date(dive.date)
      return diveDate >= fourteenDaysAgo && dive.waterTemperature != null
    })
    .map(dive => dive.waterTemperature!)
  
  const averageTemperature = recentTemperatures.length > 0 
    ? recentTemperatures.reduce((sum, temp) => sum + temp, 0) / recentTemperatures.length 
    : 0

  return {
    totalDives,
    divesLast7Days,
    divesByBoat,
    divesByGuide,
    averageTemperature: Math.round(averageTemperature * 10) / 10
  }
}

function calculateDiveStatsForPeriod(
  dives: Dive[],
  boats: Boat[],
  guides: Guide[],
  period: 'last30days' | 'currentYear'
): DiveDashboardStats {
  let filteredDives: Dive[]
  
  if (period === 'last30days') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    filteredDives = dives.filter(dive => {
      const diveDate = new Date(dive.date)
      return diveDate >= thirtyDaysAgo
    })
  } else {
    const currentYear = new Date().getFullYear()
    filteredDives = dives.filter(dive => {
      const diveDate = new Date(dive.date)
      return diveDate.getFullYear() === currentYear
    })
  }
  
  return calculateDiveStats(filteredDives, boats, guides)
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

      // Sort dives by slot order
      const slotOrder = { "9am": 1, "11am": 2, "1pm": 3, "4pm": 4, "night": 5 }
      const sortedDives = diveList.sort((a, b) => {
        const aOrder = slotOrder[a.diveSlot] || 999
        const bOrder = slotOrder[b.diveSlot] || 999
        return aOrder - bOrder
      })

      // Group sites by dive slot and maintain order
      const sitesWithDives: { site: Site, dive: Dive }[] = []
      sortedDives.forEach(dive => {
        const site = sites.find(s => s.id === dive.diveSiteId)
        if (site && !sitesWithDives.find(item => item.site.id === site.id)) {
          sitesWithDives.push({ site, dive })
        }
      })

      boatSites.push({
        boat,
        sites: sitesWithDives.map(item => item.site),
        dives: sortedDives
      })
    })

    matrix.push({
      date,
      boatSites: boatSites.sort((a, b) => a.boat.name.localeCompare(b.boat.name))
    })
  })

  return matrix
}

function calculateTemperatureTrends(dives: Dive[], period: 'all' | '30days' | '12months' | '24months' = 'all'): TemperatureTrend[] {
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
  let sortedDates = Array.from(tempByDate.keys()).sort()

  // Filter by period
  const now = new Date()
  let cutoffDate: Date
  
  switch (period) {
    case '30days':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '12months':
      cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      break
    case '24months':
      cutoffDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())
      break
    default:
      cutoffDate = new Date(0) // All data
  }
  
  sortedDates = sortedDates.filter(date => new Date(date) >= cutoffDate)

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

function calculateSiteVisitation(dives: Dive[], sites: Site[], period: 'all' | '30days' | '90days' | '12months' = 'all'): SiteVisitationData[] {
  // Filter dives by period
  let filteredDives: Dive[] = dives
  
  if (period !== 'all') {
    const now = new Date()
    let cutoffDate: Date
    
    switch (period) {
      case '30days':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90days':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '12months':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        cutoffDate = new Date(0)
    }
    
    filteredDives = dives.filter(dive => new Date(dive.date) >= cutoffDate)
  }

  const siteStats = new Map<string, { count: number, lastVisited: Date }>()

  sites.forEach(site => {
    siteStats.set(site.id, { count: 0, lastVisited: new Date(0) })
  })

  filteredDives.forEach(dive => {
    const stats = siteStats.get(dive.diveSiteId)
    if (stats) {
      stats.count++
      const diveDate = new Date(dive.date)
      if (diveDate > stats.lastVisited) {
        stats.lastVisited = diveDate
      }
    }
  })

  const totalVisits = filteredDives.length
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
