import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  HStack,
  Text,
  VStack,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Input,
} from "@chakra-ui/react";
import {
  ContractData,
  DivePackage,
  GroupContract,
  Hotel,
  MealPackage,
  RoomCategory,
  RoomType,
  Season,
  defaultCheckfrontSync,
} from "@/app/(staff)/contracts/_types";
import { getSeasons } from "@/app/(staff)/contracts/_lib/seasonsRepo";
import { getRates } from "@/app/(staff)/contracts/_lib/ratesRepo";
import { getDivePackageById } from "@/app/(staff)/contracts/_lib/divePackagesRepo";
import { getMealPackageById } from "@/app/(staff)/contracts/_lib/mealPackagesRepo";
import { getHotelById } from "@/app/(staff)/contracts/_lib/hotelsRepo";
import { getRoomCategories } from "@/app/(staff)/contracts/_lib/roomCategoriesRepo";
import {
  addGroupContract,
  archiveGroupContract,
  formatBookingType,
  getGroupContractById,
} from "@/app/(staff)/contracts/_lib/groupContractsRepo";
import { cloneContractDataForRevision } from "@/app/(staff)/contracts/_lib/paymentsRepo";
import {
  calculateNumberOfNights,
  calculateTotalCost,
  determineSeason,
  getCommissionRate,
  getOccupancyNumber,
} from "@/app/(staff)/contracts/_lib/contractCalculations";
import { formatCurrency, formatDate, parseFocRule } from "@shared/utils/formatters";
import { getRoomTypes } from "@/app/(staff)/contracts/_lib/roomTypesRepo";

export default function TotalCostCalculation({
  contractData,
  onUpdateContractData,
  onConfirm,
  onBack,
  onEditStep,
  onCancel,
}: {
  contractData: ContractData;
  onUpdateContractData?: (patch: Partial<ContractData>) => void;
  onConfirm: () => void;
  onBack: () => void;
  onCancel: () => void;
  onEditStep?: (step: number) => void; // 👈 allow jumping back into a specific step
}) {
  const [season, setSeason] = useState<Season | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [divePackage, setDivePackage] = useState<DivePackage | null>(null);
  const [mealPackage, setMealPackage] = useState<MealPackage | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [results, setResults] = useState<ReturnType<
    typeof calculateTotalCost
  > | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Custom room rates state
  const [customRates, setCustomRates] = useState<Record<number, number>>({});
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [tempRates, setTempRates] = useState<Record<number, number | undefined>>({});
  const [originalRates, setOriginalRates] = useState<Record<number, number>>({});
  const [focOverrideIndex, setFocOverrideIndex] = useState<number | null>(null);

  // Handler functions for rate editing
  const handleStartEditingRates = () => {
    if (results && results.roomCosts) {
      const rates: Record<number, number> = {};
      results.roomCosts.forEach((rc, idx) => {
        // Extract rate from description string
        const rateMatch = rc.description.match(/@ \$(\d+\.\d+)\/night/);
        if (rateMatch) {
          rates[idx] = parseFloat(rateMatch[1]);
        }
      });
      setTempRates(rates);
      setOriginalRates(rates);
      setIsEditingRates(true);
    }
  };

  const handleSaveRates = () => {
    const cleanedRates = Object.entries(tempRates).reduce<Record<number, number>>(
      (acc, [k, v]) => {
        if (typeof v === "number" && !Number.isNaN(v)) {
          acc[Number(k)] = v;
        }
        return acc;
      },
      {}
    );

    const hasValidRates = Object.keys(cleanedRates).length > 0;

    setCustomRates(cleanedRates);
    setIsEditingRates(false);

    if (onUpdateContractData) {
      onUpdateContractData({
        customRates: hasValidRates ? cleanedRates : undefined,
        hasCustomRates: hasValidRates ? true : undefined,
        focOverrideIndex: focOverrideIndex,
      });
    }

    // Recalculate costs with new rates (or allow parent update to trigger full recalculation)
    if (hasValidRates) {
      recalculateWithCustomRates(cleanedRates);
    }
  };

  const handleCancelEditingRates = () => {
    setTempRates(originalRates);
    setIsEditingRates(false);
  };

  const handleRateChange = (idx: number, value: string) => {
    // Allow empty value or valid number input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (value === "") {
        setTempRates((prev) => {
          const next = { ...prev };
          delete next[idx];
          return next;
        });
        return;
      }

      const parsed = parseFloat(value);
      setTempRates((prev) => ({
        ...prev,
        [idx]: Number.isNaN(parsed) ? undefined : parsed,
      }));
    }
  };

  const handleClearCustomRates = () => {
    if (!window.confirm("Remove all custom room rates and revert to default rates?")) {
      return;
    }

    setCustomRates({});
    setTempRates({});
    setOriginalRates({});
    setIsEditingRates(false);
    setFocOverrideIndex(null);

    if (onUpdateContractData) {
      onUpdateContractData({ customRates: undefined, hasCustomRates: undefined, focOverrideIndex: null });
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleFocOverrideChange = (idx: number) => {
    const newOverrideIndex = focOverrideIndex === idx ? null : idx;
    setFocOverrideIndex(newOverrideIndex);

    // Recalculate with the new FOC override immediately
    if (Object.keys(tempRates).length > 0) {
      const recalculationRates = Object.entries(tempRates).reduce<Record<number, number>>(
        (acc, [k, v]) => {
          if (typeof v === "number" && !Number.isNaN(v)) {
            acc[Number(k)] = v;
          }
          return acc;
        },
        {}
      );

      recalculateWithCustomRates(
        recalculationRates,
        newOverrideIndex
      );
    }
  };

  const sortRoomCosts = (roomCosts: any[]) => {
    return [...roomCosts].sort((a, b) => {
      // Extract room type and category from description
      const aMatch = a.description.match(
        /(\d+) x (\w+) rooms in category (\w+)/
      );
      const bMatch = b.description.match(
        /(\d+) x (\w+) rooms in category (\w+)/
      );

      if (!aMatch || !bMatch) return 0;

      const [, , aType, aCategory] = aMatch;
      const [, , bType, bCategory] = bMatch;

      // Priority order: Single first, then Double, then others
      const getTypePriority = (type: string) => {
        const typeLower = type.toLowerCase();
        if (typeLower === "single") return 1;
        if (typeLower === "double") return 2;
        if (typeLower === "triple") return 3;
        if (typeLower === "quad") return 4;
        return 5;
      };

      const aPriority = getTypePriority(aType);
      const bPriority = getTypePriority(bType);

      const categoryCompare = aCategory.localeCompare(bCategory);
      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return aPriority - bPriority;
    });
  };

  const recalculateWithCustomRates = (rates: Record<number, number>, overrideIndex?: number | null) => {
    if (results && season && hotel) {
      // Use provided overrideIndex if given, otherwise fall back to state
      const effectiveOverrideIndex = overrideIndex !== undefined ? overrideIndex : focOverrideIndex;

      // Create a copy of results with updated rates
      const updatedRoomCosts = results.roomCosts.map((rc, idx) => {
        if (rates[idx] !== undefined) {
          const nightsMatch = rc.description.match(/for (\d+) nights/);
          const roomsMatch = rc.description.match(/(\d+) x/);
          const nights = nightsMatch ? parseInt(nightsMatch[1]) : 1;
          const numRooms = roomsMatch ? parseInt(roomsMatch[1]) : 1;
          const newRate = rates[idx];
          const gross = numRooms * nights * newRate;
          const commissionRate = getCommissionRate(
            contractData.bookingType || ""
          );
          const commission = gross * commissionRate;
          const net = gross - commission;

          // Update description with new rate
          const newDescription = rc.description.replace(
            /@ \$[\d.]+\/night/,
            `@ $${newRate.toFixed(2)}/night`
          );

          return {
            ...rc,
            description: newDescription,
            gross,
            commission,
            net,
          };
        }
        return rc;
      });

      // Recalculate totals
      const newRoomTotals = updatedRoomCosts.reduce(
        (acc, rc) => ({
          gross: acc.gross + rc.gross,
          foc: acc.foc + (rc.foc || 0),
          commission: acc.commission + rc.commission,
          net: acc.net + rc.net,
        }),
        { gross: 0, foc: 0, commission: 0, net: 0 }
      );

      // Add hotel addons to gross room cost
      const hotelAddonTotal = (contractData.hotelAddons || []).reduce((sum, addon) => sum + addon.amount, 0);
      const grossRoomCostWithAddons = newRoomTotals.gross + hotelAddonTotal;

      // FOC calculation - use override if selected, otherwise use original FOC
      let focDeduction = results.roomTotals?.foc || 0;

      if (effectiveOverrideIndex !== null && rates[effectiveOverrideIndex] !== undefined) {
        // Calculate FOC using the selected override rate
        const focRule = parseFocRule(hotel.focRule || "0+0");
        const totalGuests =
          contractData.rooms?.reduce((sum, room) => {
            if (room.numRooms > 0 && room.occupancyType) {
              const occNum = getOccupancyNumber(room.occupancyType);
              return sum + occNum * room.numRooms;
            }
            return sum;
          }, 0) || 0;

        const overrideRate = rates[effectiveOverrideIndex];
        const perGuestPerNight = overrideRate / 2; // assume double occupancy
        const nights = calculateNumberOfNights(
          contractData.startDate!,
          contractData.endDate!
        );
        const focGroupSize = focRule.paid + focRule.free;
        const freeGuests =
          focGroupSize > 0 ? Math.floor(totalGuests / focGroupSize) * focRule.free : 0;
        focDeduction = freeGuests * perGuestPerNight * nights;
      }

      const adjustedGross = grossRoomCostWithAddons - focDeduction;
      const commissionRate = getCommissionRate(contractData.bookingType || "");
      const finalRoomTotals = {
        gross: grossRoomCostWithAddons,
        foc: focDeduction,
        commission: adjustedGross * commissionRate,
        net: adjustedGross * (1 - commissionRate),
      };

      // Update overall totals
      const newOverall = {
        gross:
          finalRoomTotals.gross +
          (results.diveTotals?.gross || 0) +
          (results.mealTotals?.gross || 0),
        foc: (finalRoomTotals.foc || 0) + (results.diveTotals?.foc || 0),
        commission:
          finalRoomTotals.commission +
          (results.diveTotals?.commission || 0) +
          (results.mealTotals?.commission || 0),
        net:
          finalRoomTotals.net +
          (results.diveTotals?.net || 0) +
          (results.mealTotals?.net || 0),
      };

      setResults({
        ...results,
        roomCosts: sortRoomCosts(updatedRoomCosts),
        roomTotals: finalRoomTotals,
        overall: newOverall,
      });
    }
  };

  const handleConfirm = async () => {
    try {
      let revisionOfContractId: string | undefined;
      let rootContractId: string | undefined;
      let revisionNumber: number | undefined;
      let existingCheckfrontSync = defaultCheckfrontSync;

      if (contractData.id) {
        const previousContract = await getGroupContractById(contractData.id);
        revisionOfContractId = contractData.id;
        rootContractId = previousContract?.rootContractId || contractData.id;
        revisionNumber = (previousContract?.revisionNumber || 0) + 1;
        // Preserve existing Checkfront sync data when editing (revising) a contract
        if (previousContract?.checkfrontSync?.bookingId) {
          existingCheckfrontSync = {
            ...previousContract.checkfrontSync,
            status: previousContract.checkfrontSync.status || 'linked',
          };
        }
      }

      // Clean customRates data
      let cleanedRates: any = null;
      let hasValidRates = false;
      
      if (customRates && Object.keys(customRates).length > 0) {
        if (Array.isArray(customRates)) {
          // Handle sparse arrays
          const tempRates: Record<number, number> = {};
          customRates.forEach((value, index) => {
            if (value !== undefined && value !== null) {
              tempRates[index] = value;
              hasValidRates = true;
            }
          });
          cleanedRates = hasValidRates ? tempRates : null;
        } else {
          // Handle objects
          cleanedRates = Object.fromEntries(
            Object.entries(customRates).filter(([_, v]) => v !== undefined && v !== null)
          );
          hasValidRates = Object.keys(cleanedRates).length > 0;
        }
      }

      const groupContract: Omit<GroupContract, "id"> = {
        archived: false,
        ...(revisionOfContractId && { revisionOfContractId }),
        ...(rootContractId && { rootContractId }),
        ...(revisionNumber !== undefined && { revisionNumber }),
        groupName: contractData.groupName!,
        startDate: contractData.startDate!,
        endDate: contractData.endDate!,
        hotelId: hotel!.id,
        hotelName: hotel!.name,
        seasonId: season!.id,
        seasonName: season!.name,
        bookingType: contractData.bookingType!,
        roomTotals: results?.roomTotals,
        diveTotals: results?.diveTotals,
        mealTotals: results?.mealTotals,
        overall: results?.overall,
        rooms: contractData.rooms || [],
        roomCosts:
          results?.roomCosts.map((rc) => ({
            description: rc.description,
            cost: rc.gross,
          })) || [],
        totalRoomCost: results?.roomTotals.net || 0,
        totalGuests: results?.totalGuests || 0,
        numDivers: contractData.numDivers!,
        totalNonDivers:
          (results?.totalGuests || 0) - (contractData.numDivers || 0),
        ...(contractData.divePackageId && {
          divePackageId: contractData.divePackageId,
          divePackageName: divePackage?.name ?? null,
          divePackageCost: results?.diveTotals.net ?? null,
        }),
        ...(contractData.mealPackageId && {
          mealPackageId: contractData.mealPackageId,
          mealPackageName: mealPackage?.name ?? null,
          mealPackageCost: results?.mealTotals.net ?? null,
          mealCommissionRate: mealPackage?.commissionRate ?? 0,
        }),
        totalCost: results?.overall.net || 0,
        createdAt: new Date(),
        // Only include customRates if it has valid data
        ...(cleanedRates && { customRates: cleanedRates }),
        hasCustomRates: hasValidRates,
        // Add addon arrays to contract data
        hotelAddons: contractData.hotelAddons || [],
        diveAddons: contractData.diveAddons || [],
        mealAddons: contractData.mealAddons || [],
        // Checkfront integration: preserve existing sync for edits, default for new
        checkfrontSync: existingCheckfrontSync,
      };

      const newContractId = await addGroupContract(groupContract);

      if (contractData.id) {
        await cloneContractDataForRevision(contractData.id, newContractId);
        await archiveGroupContract(contractData.id);
      }

      // TODO: Phase 2 - Trigger Checkfront sync after successful contract save
      // This is a non-blocking stub that will be implemented in Phase 2
      // if (groupContract.checkfrontSync?.bookingId) {
      //   // Future: Update linked Checkfront booking
      //   console.log('[Checkfront] Would update booking:', groupContract.checkfrontSync.bookingId);
      // } else {
      //   // Future: Create Checkfront booking and save returned bookingId
      //   console.log('[Checkfront] Would create new booking for contract:', newContractId);
      // }

      alert("Contract saved successfully!");
      onConfirm();
    } catch (error) {
      console.error("Error saving contract:", error);
      setError("An error occurred while saving the contract.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        if (
          !contractData.hotelId ||
          !contractData.startDate ||
          !contractData.endDate
        ) {
          setError("Missing required contract data.");
          return;
        }

        const hotelData = await getHotelById(contractData.hotelId!);
        setHotel(hotelData);

        const categories = await getRoomCategories(contractData.hotelId);
        const roomTypesData = await getRoomTypes(contractData.hotelId);
        setRoomTypes(roomTypesData);
        setRoomCategories(categories);

        const seasons = await getSeasons(contractData.hotelId!);
        const seasonResult = determineSeason(
          contractData.startDate!,
          contractData.endDate!,
          seasons
        );
        setSeason(seasonResult);

        const ratesData = await getRates(contractData.hotelId!);
        setRates(ratesData);

        let divePkg: DivePackage | null = null;
        if (contractData.divePackageId) {
          divePkg = await getDivePackageById(contractData.divePackageId);
          setDivePackage(divePkg);
        }

        let mealPkg: MealPackage | null = null;
        if (contractData.mealPackageId) {
          mealPkg = await getMealPackageById(contractData.mealPackageId);
          setMealPackage(mealPkg);
        }

        if (!hotelData) {
          setError("Hotel data missing");
          return;
        }

        const calc = calculateTotalCost(
          contractData,
          seasonResult,
          ratesData,
          divePkg,
          mealPkg,
          categories,
          roomTypesData,
          hotelData
        );

        // Apply custom rates if they exist
        if (
          contractData.customRates &&
          contractData.hasCustomRates &&
          calc.roomCosts
        ) {
          const updatedRoomCosts = calc.roomCosts.map((rc, idx) => {
            if (contractData.customRates![idx] !== undefined) {
              const nightsMatch = rc.description.match(/for (\d+) nights/);
              const roomsMatch = rc.description.match(/(\d+) x/);
              const nights = nightsMatch ? parseInt(nightsMatch[1]) : 1;
              const numRooms = roomsMatch ? parseInt(roomsMatch[1]) : 1;
              const newRate = contractData.customRates![idx];
              const gross = numRooms * nights * newRate;
              const commissionRate = getCommissionRate(
                contractData.bookingType || ""
              );
              const commission = gross * commissionRate;
              const net = gross - commission;

              const newDescription = rc.description.replace(
                /@ \$\d+\.\d+\/night/,
                `@ $${newRate.toFixed(2)}/night`
              );

              return {
                ...rc,
                description: newDescription,
                gross,
                commission,
                net,
              };
            }
            return rc;
          });

          // Recalculate totals with custom rates
          const newRoomTotals = updatedRoomCosts.reduce(
            (acc, rc) => ({
              gross: acc.gross + rc.gross,
              foc: acc.foc + (rc.foc || 0),
              commission: acc.commission + rc.commission,
              net: acc.net + rc.net,
            }),
            { gross: 0, foc: 0, commission: 0, net: 0 }
          );

          // Add hotel addons to gross room cost
          const hotelAddonTotal = (contractData.hotelAddons || []).reduce((sum, addon) => sum + addon.amount, 0);
          const grossRoomCostWithAddons = newRoomTotals.gross + hotelAddonTotal;

          // FOC calculation with custom rates
          const focRule = parseFocRule(hotelData.focRule || "0+0");
          let focDeduction = 0;
          const savedOverrideIndex = contractData.focOverrideIndex;

          if (contractData.rooms) {
            const totalGuests = contractData.rooms.reduce((sum, room) => {
              if (room.numRooms > 0 && room.occupancyType) {
                const occNum = getOccupancyNumber(room.occupancyType);
                return sum + occNum * room.numRooms;
              }
              return sum;
            }, 0);

            let focBasePrice: number | null = null;

            if (savedOverrideIndex != null && contractData.customRates![savedOverrideIndex] !== undefined) {
              // User selected a specific room as FOC base — use its custom rate
              // Assume double occupancy (divide by 2) for per-guest rate
              focBasePrice = contractData.customRates![savedOverrideIndex];
            } else {
              // Fall back to hotel's isFocBase room type
              const focRoomType = roomTypesData.find(
                (rt: RoomType) => rt.hotelId === hotelData.id && rt.isFocBase
              );

              if (focRoomType) {
                // Check if the FOC base room type has a custom rate applied
                const focRoomCost = updatedRoomCosts.find((rc) => {
                  const match = rc.description.match(
                    /(\d+) x (\w+) rooms in category (\w+)/
                  );
                  if (!match) return false;
                  const [, , occupancyType, categoryName] = match;
                  const focBaseCategory = categories.find(
                    (rc: RoomCategory) => rc.id === focRoomType.categoryId
                  );
                  return (
                    focBaseCategory?.name.toLowerCase() ===
                      categoryName.toLowerCase() &&
                    occupancyType.toLowerCase() === "double"
                  );
                });

                if (focRoomCost) {
                  const rateMatch = focRoomCost.description.match(
                    /@ \$(\d+\.\d+)\/night/
                  );
                  if (rateMatch) {
                    focBasePrice = parseFloat(rateMatch[1]);
                  }
                }

                // Fallback to original rate if no custom rate found
                if (focBasePrice === null) {
                  const baseRate = ratesData.find(
                    (r) =>
                      r.categoryId === focRoomType.categoryId &&
                      r.seasonId === seasonResult.id &&
                      r.occupancyType.toLowerCase() === "double"
                  );
                  if (baseRate) {
                    focBasePrice = baseRate.price;
                  }
                }
              }
            }

            if (focBasePrice !== null) {
              const perGuestPerNight = focBasePrice / 2; // double occupancy
              const nights = calculateNumberOfNights(
                contractData.startDate!,
                contractData.endDate!
              );
              const focGroupSize = focRule.paid + focRule.free;
              const freeGuests =
                focGroupSize > 0
                  ? Math.floor(totalGuests / focGroupSize) * focRule.free
                  : 0;
              focDeduction = freeGuests * perGuestPerNight * nights;
            }
          }

          const adjustedGross = grossRoomCostWithAddons - focDeduction;
          const commissionRate = getCommissionRate(
            contractData.bookingType || ""
          );
          const finalRoomTotals = {
            gross: grossRoomCostWithAddons,
            foc: focDeduction,
            commission: adjustedGross * commissionRate,
            net: adjustedGross * (1 - commissionRate),
          };

          const newOverall = {
            gross:
              finalRoomTotals.gross +
              (calc.diveTotals?.gross || 0) +
              (calc.mealTotals?.gross || 0),
            foc: (finalRoomTotals.foc || 0) + (calc.diveTotals?.foc || 0),
            commission:
              finalRoomTotals.commission +
              (calc.diveTotals?.commission || 0) +
              (calc.mealTotals?.commission || 0),
            net:
              finalRoomTotals.net +
              (calc.diveTotals?.net || 0) +
              (calc.mealTotals?.net || 0),
          };

          setResults({
            ...calc,
            roomCosts: sortRoomCosts(updatedRoomCosts),
            roomTotals: finalRoomTotals,
            overall: newOverall,
          });

          // Restore local state from contract data
          const nextCustomRates = Object.entries(contractData.customRates).reduce<Record<number, number>>(
            (acc, [k, v]) => {
              acc[Number(k)] = v;
              return acc;
            },
            {}
          );
          setCustomRates(nextCustomRates);
          if (contractData.focOverrideIndex != null) {
            setFocOverrideIndex(contractData.focOverrideIndex);
          }
        } else {
          setResults({
            ...calc,
            roomCosts: sortRoomCosts(calc.roomCosts),
          });

          // No custom rates for this contract; ensure local state is cleared
          setCustomRates({});
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An error occurred while calculating the total cost.");
      }
    }

    fetchData();
  }, [
    contractData.hotelId,
    contractData.startDate,
    contractData.endDate,
    contractData.bookingType,
    contractData.rooms,
    contractData.divePackageId,
    contractData.numDivers,
    contractData.mealPackageId,
    contractData.hotelAddons,
    contractData.diveAddons,
    contractData.mealAddons,
    contractData.customRates,
    contractData.hasCustomRates,
    contractData.focOverrideIndex,
  ]);

  if (error) {
    return (
      <VStack spacing={4} align="stretch">
        <Text color="red.500">{error}</Text>
        <Button onClick={onBack}>Back</Button>
      </VStack>
    );
  }

  if (!hotel || !season || !results) {
    return <Text>Loading data...</Text>;
  }

  const {
    roomCosts,
    roomTotals,
    diveTotals,
    mealTotals,
    overall,
    totalGuests,
  } = results;

  // Sort room costs for display
  const sortedRoomCosts = sortRoomCosts(roomCosts);

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="xl" fontWeight="bold">
        Review and Confirm details for: {contractData.groupName}
      </Text>

      {/* Hotel Info */}
      <Card>
        <CardHeader py={2} px={3}>
          <Flex justify="space-between">
            <Text fontWeight="bold">Hotel & Dates</Text>
            {onEditStep && (
              <Button size="sm" onClick={() => onEditStep(1)}>
                Edit
              </Button>
            )}
          </Flex>
        </CardHeader>
        <CardBody>
          <Text>Hotel: {hotel.name}</Text>
          <Text>Season: {season.name}</Text>
          <Text>Check-in: {formatDate(contractData.startDate!)}</Text>
          <Text>Check-out: {formatDate(contractData.endDate!)}</Text>
          <Text>
            Nights:{" "}
            {calculateNumberOfNights(
              contractData.startDate!,
              contractData.endDate!
            )}
          </Text>
          <Text>Total Guests: {totalGuests}</Text>
          <Text>
            Booking Type: {formatBookingType(contractData.bookingType!)}
          </Text>
          <Text>
            Meal Commission Rate: {(mealPackage?.commissionRate ?? 0) * 100}%
          </Text>
        </CardBody>
      </Card>

      {/* Rooms - Only show if not direct hotel booking */}
      {contractData.bookingType !== 'directHotelBooking' && (
        <Card>
          <CardHeader py={2} px={3}>
            <Flex justify="space-between">
              <Text fontWeight="bold">Rooms</Text>
              <HStack spacing={2}>
                {onEditStep && (
                  <Button size="sm" onClick={() => onEditStep(2)}>
                    Edit Rooms
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={
                    isEditingRates
                      ? handleCancelEditingRates
                      : handleStartEditingRates
                  }
                >
                  {isEditingRates ? "Cancel" : "Edit Rates"}
                </Button>
                {((contractData.hasCustomRates && contractData.customRates) || Object.keys(customRates).length > 0) && (
                  <Button size="sm" variant="outline" colorScheme="red" onClick={handleClearCustomRates}>
                    Clear Custom Rates
                  </Button>
                )}
                {isEditingRates && (
                  <Button size="sm" onClick={handleSaveRates} colorScheme="green">
                    Save All Rates
                  </Button>
                )}
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            {isEditingRates && (
              <Text fontSize="sm" color="textPrimary" mb={2}>
                Check the box next to a room rate to use it as the FOC base rate
              </Text>
            )}
            {sortedRoomCosts.map((rc, idx) => {
              // Find the original index for this room cost to access tempRates
              const originalIdx = roomCosts.indexOf(rc);
              return (
                <VStack key={idx} align="stretch" spacing={1}>
                  {isEditingRates ? (
                    <HStack spacing={2} wrap="nowrap" align="center">
                      <Checkbox
                        isChecked={focOverrideIndex === originalIdx}
                        onChange={() => handleFocOverrideChange(originalIdx)}
                        size="sm"
                        flexShrink={0}
                      />
                      <Text flex={1} flexShrink={1} minW="0" noOfLines={2}>
                        {rc.description.replace(/@ \$[\d.]+\/night/, "").trimEnd()}
                      </Text>
                      <HStack spacing={1} flexShrink={0}>
                        <Text whiteSpace="nowrap">@</Text>
                        <Input
                          type="number"
                          value={tempRates[originalIdx]?.toString() || ""}
                          onChange={(e) =>
                            handleRateChange(originalIdx, e.target.value)
                          }
                          onFocus={handleInputFocus}
                          size="sm"
                          w="90px"
                          minW="90px"
                          step="0.01"
                          min="0"
                        />
                        <Text whiteSpace="nowrap">/night</Text>
                      </HStack>
                    </HStack>
                  ) : (
                    <Text>
                      {rc.description}
                      {customRates[originalIdx] !== undefined && (
                        <Text as="span" color="red.500" ml={1}>
                          *
                        </Text>
                      )}
                    </Text>
                  )}
                </VStack>
              );
            })}

            {/* Hotel Addons */}
            {contractData.hotelAddons && contractData.hotelAddons.length > 0 && (
              <>
                {contractData.hotelAddons.map((addon, idx) => (
                  <VStack key={idx} align="stretch" spacing={1}>
                    <Text>
                      {addon.description}: ${formatCurrency(addon.amount)}
                    </Text>
                  </VStack>
                ))}
              </>
            )}

            <Text>Gross: ${formatCurrency(roomTotals.gross)}</Text>
            <Text>FOC Value: $({formatCurrency(roomTotals.foc)})</Text>
            <Text>Commission: $({formatCurrency(roomTotals.commission)})</Text>
            <Text>Net: ${formatCurrency(roomTotals.net)}</Text>
          </CardBody>
        </Card>
      )}

      {/* Dives */}
      {divePackage && (
        <Card>
          <CardHeader py={2} px={3}>
            <Flex justify="space-between">
              <Text fontWeight="bold">Dives</Text>
              {onEditStep && (
                <Button size="sm" onClick={() => onEditStep(3)}>
                  Edit
                </Button>
              )}
            </Flex>
          </CardHeader>
          <CardBody>
            <Text>
              Dive Package: {divePackage.name} for {contractData.numDivers || 0}{" "}
              divers
            </Text>

            {/* Dive Addons */}
            {contractData.diveAddons && contractData.diveAddons.length > 0 && (
              <>
                {contractData.diveAddons.map((addon, idx) => (
                  <VStack key={idx} align="stretch" spacing={1}>
                    <Text>
                      {addon.description}: ${formatCurrency(addon.amount)}
                    </Text>
                  </VStack>
                ))}
              </>
            )}

            <Text>Gross: ${formatCurrency(diveTotals.gross)}</Text>
            <Text>FOC Value: $({formatCurrency(diveTotals.foc)})</Text>
            <Text>Commission: $({formatCurrency(diveTotals.commission)})</Text>
            <Text>Net: ${formatCurrency(diveTotals.net)}</Text>
          </CardBody>
        </Card>
      )}

      {/* Meals - Only show if not direct hotel booking */}
      {mealPackage && contractData.bookingType !== 'directHotelBooking' && (
        <Card>
          <CardHeader py={2} px={3}>
            <Flex justify="space-between">
              <Text fontWeight="bold">Meals</Text>
              {onEditStep && (
                <Button size="sm" onClick={() => onEditStep(4)}>
                  Edit
                </Button>
              )}
            </Flex>
          </CardHeader>
          <CardBody>
            <Text>Meal Package: {mealPackage.name}</Text>

            {/* Meal Addons */}
            {contractData.mealAddons && contractData.mealAddons.length > 0 && (
              <>
                {contractData.mealAddons.map((addon, idx) => (
                  <VStack key={idx} align="stretch" spacing={1}>
                    <Text>
                      {addon.description}: ${formatCurrency(addon.amount)}
                    </Text>
                  </VStack>
                ))}
              </>
            )}

            <Text>Gross: ${formatCurrency(mealTotals.gross)}</Text>
            <Text>Commission: $({formatCurrency(mealTotals.commission)})</Text>
            <Text>Net: ${formatCurrency(mealTotals.net)}</Text>
          </CardBody>
        </Card>
      )}

      {/* Overall */}
      <Card>
        <CardHeader py={2} px={3}>
          <Text fontWeight="bold">Overall Totals</Text>
        </CardHeader>
        <CardBody>
          <Text>Gross: ${formatCurrency(overall.gross)}</Text>
          <Text>FOC: $({formatCurrency(overall.foc)})</Text>
          <Text>Commission: $({formatCurrency(overall.commission)})</Text>
          <Text fontWeight="bold">Net: ${formatCurrency(overall.net)}</Text>
        </CardBody>
      </Card>

      {/* Actions */}
      <HStack spacing={2}>
        <Button
          colorScheme="red"
          flex={1}
          onClick={() => {
            if (
              window.confirm("All progress will be discarded. Are you sure?")
            ) {
              onCancel();
            }
          }}
        >
          Cancel
        </Button>
        <Button colorScheme="teal" onClick={handleConfirm} flex={1}>
          Save
        </Button>
      </HStack>
    </VStack>
  );
}
