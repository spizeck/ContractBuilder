'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Select,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  DivePackage,
  Hotel,
  HotelSheetConfig,
  MealPackage,
  Season,
  defaultHotelSheetConfig,
} from '../../_types'
import { formatDateRange } from '@shared/utils/formatters'

interface HotelSheetFormProps {
  hotels: Hotel[]
  seasons: Season[]
  divePackages: DivePackage[]
  mealPackages: MealPackage[]
  config: HotelSheetConfig
  onConfigChange: (config: HotelSheetConfig) => void
  onLoadHotelData: (hotelId: string) => void
  onPrint: () => void
}

export default function HotelSheetForm({
  hotels,
  seasons,
  divePackages,
  mealPackages,
  config,
  onConfigChange,
  onLoadHotelData,
  onPrint,
}: HotelSheetFormProps) {
  // Local toggle state for all dive packages / meal packages selected
  const allDiveSelected = useMemo(
    () => divePackages.length > 0 && divePackages.every(p => config.divePackageIds.includes(p.id)),
    [divePackages, config.divePackageIds]
  )
  const allMealSelected = useMemo(
    () => mealPackages.length > 0 && mealPackages.every(p => config.mealPackageIds.includes(p.id)),
    [mealPackages, config.mealPackageIds]
  )

  const handleHotelChange = (hotelId: string) => {
    // Reset hotel-specific selections when hotel changes
    onConfigChange({
      ...config,
      hotelId,
      seasonIds: [],
      mealPackageIds: [],
    })
    if (hotelId) onLoadHotelData(hotelId)
  }

  const handleSeasonToggle = (seasonId: string) => {
    const next = config.seasonIds.includes(seasonId)
      ? config.seasonIds.filter(id => id !== seasonId)
      : [...config.seasonIds, seasonId]
    onConfigChange({ ...config, seasonIds: next })
  }

  const handleDivePackageToggle = (pkgId: string) => {
    const next = config.divePackageIds.includes(pkgId)
      ? config.divePackageIds.filter(id => id !== pkgId)
      : [...config.divePackageIds, pkgId]
    onConfigChange({ ...config, divePackageIds: next })
  }

  const handleMealPackageToggle = (pkgId: string) => {
    const next = config.mealPackageIds.includes(pkgId)
      ? config.mealPackageIds.filter(id => id !== pkgId)
      : [...config.mealPackageIds, pkgId]
    onConfigChange({ ...config, mealPackageIds: next })
  }

  const handleSelectAllDive = () => {
    onConfigChange({
      ...config,
      divePackageIds: allDiveSelected ? [] : divePackages.map(p => p.id),
    })
  }

  const handleSelectAllMeal = () => {
    onConfigChange({
      ...config,
      mealPackageIds: allMealSelected ? [] : mealPackages.map(p => p.id),
    })
  }

  const handleToggleOption = (key: keyof Pick<
    HotelSheetConfig,
    | 'includeDescription'
    | 'includeContactInfo'
    | 'includeAmenities'
    | 'includePolicies'
    | 'includeRestrictions'
    | 'includeLogo'
    | 'includeMealCommissionInfo'
  >) => {
    onConfigChange({ ...config, [key]: !config[key] })
  }

  const handleReset = () => {
    onConfigChange({ ...defaultHotelSheetConfig })
  }

  return (
    <VStack align="stretch" spacing={6}>
      {/* ── Hotel selection ── */}
      <FormControl isRequired>
        <FormLabel fontWeight="semibold">Hotel</FormLabel>
        <Select
          placeholder="Select a hotel…"
          value={config.hotelId}
          onChange={e => handleHotelChange(e.target.value)}
        >
          {hotels.map(h => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </Select>
      </FormControl>

      {/* ── Season multi-select ── */}
      <FormControl isRequired>
        <FormLabel fontWeight="semibold">Seasons</FormLabel>
        {!config.hotelId ? (
          <Text fontSize="sm" color="textMuted">
            Select a hotel first.
          </Text>
        ) : seasons.length === 0 ? (
          <Text fontSize="sm" color="warning">
            No seasons found for this hotel.
          </Text>
        ) : (
          <Stack spacing={2}>
            {seasons.map(season => (
              <Checkbox
                key={season.id}
                isChecked={config.seasonIds.includes(season.id)}
                onChange={() => handleSeasonToggle(season.id)}
                colorScheme="teal"
              >
                <Text fontSize="sm">
                  <strong>{season.name}</strong>{' '}
                  <Text as="span" color="gray.500">
                    ({formatDateRange(season.startDate, season.endDate)})
                  </Text>
                </Text>
              </Checkbox>
            ))}
          </Stack>
        )}
      </FormControl>

      <Divider />

      {/* ── Dive package multi-select ── */}
      <FormControl>
        <FormLabel fontWeight="semibold">Dive Packages</FormLabel>
        {divePackages.length === 0 ? (
          <Text fontSize="sm" color="textMuted">
            No dive packages available.
          </Text>
        ) : (
          <Stack spacing={2}>
            <Checkbox
              isChecked={allDiveSelected}
              isIndeterminate={config.divePackageIds.length > 0 && !allDiveSelected}
              onChange={handleSelectAllDive}
              colorScheme="teal"
              fontWeight="medium"
              fontSize="sm"
            >
              Select all
            </Checkbox>
            <Divider />
            {divePackages.map(pkg => (
              <Checkbox
                key={pkg.id}
                isChecked={config.divePackageIds.includes(pkg.id)}
                onChange={() => handleDivePackageToggle(pkg.id)}
                colorScheme="teal"
              >
                <Text fontSize="sm">{pkg.name}</Text>
              </Checkbox>
            ))}
          </Stack>
        )}
      </FormControl>

      <Divider />

      {/* ── Meal package multi-select ── */}
      <FormControl>
        <FormLabel fontWeight="semibold">Meal Packages</FormLabel>
        {!config.hotelId ? (
          <Text fontSize="sm" color="textMuted">
            Select a hotel first.
          </Text>
        ) : mealPackages.length === 0 ? (
          <Text fontSize="sm" color="textMuted">
            No meal packages for this hotel.
          </Text>
        ) : (
          <Stack spacing={2}>
            <Checkbox
              isChecked={allMealSelected}
              isIndeterminate={config.mealPackageIds.length > 0 && !allMealSelected}
              onChange={handleSelectAllMeal}
              colorScheme="teal"
              fontWeight="medium"
              fontSize="sm"
            >
              Select all
            </Checkbox>
            <Divider />
            {mealPackages.map(pkg => (
              <Checkbox
                key={pkg.id}
                isChecked={config.mealPackageIds.includes(pkg.id)}
                onChange={() => handleMealPackageToggle(pkg.id)}
                colorScheme="teal"
              >
                <Text fontSize="sm">{pkg.name}</Text>
              </Checkbox>
            ))}
          </Stack>
        )}
      </FormControl>

      <Divider />

      {/* ── Display options ── */}
      <Box>
        <Heading as="h4" size="sm" mb={3}>
          Display Options
        </Heading>
        <Stack spacing={2}>
          <Checkbox
            isChecked={config.includeLogo}
            onChange={() => handleToggleOption('includeLogo')}
            colorScheme="teal"
          >
            <Text fontSize="sm">Include hotel logo</Text>
          </Checkbox>
          <Checkbox
            isChecked={config.includeDescription}
            onChange={() => handleToggleOption('includeDescription')}
            colorScheme="teal"
          >
            <Text fontSize="sm">Include description</Text>
          </Checkbox>
          <Checkbox
            isChecked={config.includeContactInfo}
            onChange={() => handleToggleOption('includeContactInfo')}
            colorScheme="teal"
          >
            <Text fontSize="sm">Include contact info</Text>
          </Checkbox>
          <Checkbox
            isChecked={config.includeAmenities}
            onChange={() => handleToggleOption('includeAmenities')}
            colorScheme="teal"
          >
            <Text fontSize="sm">Include amenities</Text>
          </Checkbox>
          <Checkbox
            isChecked={config.includePolicies}
            onChange={() => handleToggleOption('includePolicies')}
            colorScheme="teal"
          >
            <Text fontSize="sm">Include policies</Text>
          </Checkbox>
          <Checkbox
            isChecked={config.includeRestrictions}
            onChange={() => handleToggleOption('includeRestrictions')}
            colorScheme="teal"
          >
            <Text fontSize="sm">Include restrictions</Text>
          </Checkbox>
          <Checkbox
            isChecked={config.includeMealCommissionInfo}
            onChange={() => handleToggleOption('includeMealCommissionInfo')}
            colorScheme="teal"
          >
            <Text fontSize="sm">
              Show meal commission info{' '}
              <Text as="span" color="textMuted" fontSize="xs">
                (internal only)
              </Text>
            </Text>
          </Checkbox>
        </Stack>
      </Box>

      <Divider />

      {/* ── Actions ── */}
      <Stack spacing={3}>
        <Button
          colorScheme="teal"
          onClick={onPrint}
          isDisabled={!config.hotelId || config.seasonIds.length === 0}
        >
          Print / Save PDF
        </Button>
        <Button variant="outline" colorScheme="gray" onClick={handleReset}>
          Reset
        </Button>
      </Stack>
    </VStack>
  )
}
