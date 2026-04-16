'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import ProtectedPage from '@shared/components/LayoutComponents/ProtectedPage'
import {
  DivePackage,
  Hotel,
  HotelSheetConfig,
  MealPackage,
  Rate,
  RoomCategory,
  RoomType,
  Season,
  defaultHotelSheetConfig,
} from '../_types'
import { getHotels } from '../_lib/hotelsRepo'
import { getSeasons } from '../_lib/seasonsRepo'
import { getRates } from '../_lib/ratesRepo'
import { getRoomCategories } from '../_lib/roomCategoriesRepo'
import { getRoomTypes } from '../_lib/roomTypesRepo'
import { getDivePackages } from '../_lib/divePackagesRepo'
import { getMealPackages } from '../_lib/mealPackagesRepo'
import { buildHotelSheetViewModel } from './utils/buildHotelSheetViewModel'
import HotelSheetForm from './components/HotelSheetForm'
import HotelSheetPreview from './components/HotelSheetPreview'

export default function HotelSheetsPage() {
  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager']}>
      <HotelSheetsContent />
    </ProtectedPage>
  )
}

function HotelSheetsContent() {
  // ── Global data ──────────────────────────────────────────────────────────
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [divePackages, setDivePackages] = useState<DivePackage[]>([])
  const [loadingGlobal, setLoadingGlobal] = useState(true)

  // ── Hotel-specific data (loaded on hotel selection) ───────────────────────
  const [seasons, setSeasons] = useState<Season[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [mealPackages, setMealPackages] = useState<MealPackage[]>([])
  const [loadingHotel, setLoadingHotel] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ── Config state ──────────────────────────────────────────────────────────
  const [config, setConfig] = useState<HotelSheetConfig>(defaultHotelSheetConfig)

  // Load hotels and dive packages on mount (not hotel-specific)
  useEffect(() => {
    const load = async () => {
      try {
        const [hotelData, diveData] = await Promise.all([
          getHotels(),
          getDivePackages(),
        ])
        // Exclude archived records client-side
        setHotels(hotelData.filter(h => !h.archived))
        setDivePackages(diveData.filter(p => !p.archived))
      } catch (err) {
        console.error('Failed to load hotel/dive package data:', err)
        setLoadError('Failed to load data. Please refresh the page.')
      } finally {
        setLoadingGlobal(false)
      }
    }
    load()
  }, [])

  // Load hotel-specific data when a hotel is selected
  const loadHotelData = useCallback(async (hotelId: string) => {
    setLoadingHotel(true)
    setLoadError(null)
    setSeasons([])
    setRates([])
    setRoomCategories([])
    setRoomTypes([])
    setMealPackages([])
    try {
      const [seasonData, rateData, categoryData, roomTypeData, mealData] = await Promise.all([
        getSeasons(hotelId),
        getRates(hotelId),
        getRoomCategories(hotelId),
        getRoomTypes(hotelId),
        getMealPackages(hotelId),
      ])
      // getSeasons already filters archived via its query
      // getRoomTypes already filters archived client-side
      setSeasons(seasonData)
      setRates(rateData.filter(r => !r.archived))
      setRoomCategories(categoryData.filter(c => !c.archived))
      setRoomTypes(roomTypeData)
      setMealPackages(mealData.filter(p => !p.archived))
    } catch (err) {
      console.error('Failed to load hotel data:', err)
      setLoadError('Failed to load hotel data. Please try selecting the hotel again.')
    } finally {
      setLoadingHotel(false)
    }
  }, [])

  // Build view model reactively whenever config or data changes
  const viewModel = useMemo(() => {
    if (!config.hotelId || config.seasonIds.length === 0) return null
    return buildHotelSheetViewModel(
      config,
      hotels,
      seasons,
      rates,
      roomCategories,
      roomTypes,
      divePackages,
      mealPackages
    )
  }, [config, hotels, seasons, rates, roomCategories, roomTypes, divePackages, mealPackages])

  const handlePrint = () => window.print()

  if (loadingGlobal) {
    return (
      <VStack spacing={4} p={10} align="center">
        <Spinner size="xl" color="info" />
        <Text>Loading hotel data…</Text>
      </VStack>
    )
  }

  if (loadError && !loadingGlobal && hotels.length === 0) {
    return (
      <VStack spacing={4} p={10} align="center">
        <Text color="red.500">{loadError}</Text>
      </VStack>
    )
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1400px" mx="auto">
      <Box className="no-print">
        <Heading as="h1" size="xl" mb={2}>
          Hotel Price &amp; Info Sheet Generator
        </Heading>
        <Text color="textMuted" mb={6} fontSize="sm">
          Configure and preview a printable hotel price sheet.
        </Text>
      </Box>

      {/* 2-column layout on desktop, stacked on mobile */}
      <Grid
        templateColumns={{ base: '1fr', lg: '360px 1fr' }}
        gap={8}
        alignItems="start"
      >
        {/* ── Left: configuration form ── */}
        <GridItem>
          <Box
            p={6}
            borderWidth="1px"
            borderRadius="md"
            position={{ base: 'static', lg: 'sticky' }}
            top="20px"
            className="no-print"
          >
            <Heading as="h2" size="md" mb={4}>
              Configuration
            </Heading>
            {loadingHotel && (
              <Box mb={4} display="flex" alignItems="center" gap={2}>
                <Spinner size="sm" color="info" />
                <Text fontSize="sm" color="textMuted">Loading hotel data…</Text>
              </Box>
            )}
            {loadError && !loadingHotel && (
              <Box mb={4}>
                <Text fontSize="sm" color="red.500">{loadError}</Text>
              </Box>
            )}
            <HotelSheetForm
              hotels={hotels}
              seasons={seasons}
              divePackages={divePackages}
              mealPackages={mealPackages}
              config={config}
              onConfigChange={setConfig}
              onLoadHotelData={loadHotelData}
              onPrint={handlePrint}
            />
          </Box>
        </GridItem>

        {/* ── Right: live preview ── */}
        <GridItem>
          <HotelSheetPreview
            viewModel={viewModel}
            isReady={!loadingHotel && !!config.hotelId && config.seasonIds.length > 0}
          />
        </GridItem>
      </Grid>
    </Box>
  )
}
