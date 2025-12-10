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
} from "@/types/contractTypes";
import { getSeasons } from "@/services/seasons";
import { getRates } from "@/services/rates";
import { getDivePackageById } from "@/services/divePackages";
import { getMealPackageById } from "@/services/mealPackages";
import { getHotelById } from "@/services/hotels";
import { getRoomCategories } from "@/services/roomCategories";
import {
  addGroupContract,
  archiveGroupContract,
  formatBookingType,
} from "@/services/groupContracts";
import {
  calculateNumberOfNights,
  calculateTotalCost,
  determineSeason,
  getCommissionRate,
  getOccupancyNumber,
} from "@/utils/contractCalculations";
import { formatCurrency, formatDate, parseFocRule } from "@/utils/formatters";
import { getRoomTypes } from "@/services/roomTypes";

export default function TotalCostCalculation({
  contractData,
  onConfirm,
  onBack,
  onEditStep,
  onCancel,
}: {
  contractData: ContractData;
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
  const [customRates, setCustomRates] = useState<{ [key: string]: number }>({});
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [tempRates, setTempRates] = useState<{ [key: string]: number }>({});
  const [originalRates, setOriginalRates] = useState<{ [key: string]: number }>(
    {}
  );
  const [focOverrideIndex, setFocOverrideIndex] = useState<number | null>(null);

  // Handler functions for rate editing
  const handleStartEditingRates = () => {
    if (results && results.roomCosts) {
      const rates: { [key: string]: number } = {};
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
    setCustomRates(tempRates);
    setIsEditingRates(false);
    // Recalculate costs with new rates
    recalculateWithCustomRates(tempRates);
  };

  const handleCancelEditingRates = () => {
    setTempRates(originalRates);
    setIsEditingRates(false);
  };

  const handleRateChange = (idx: number, value: string) => {
    // Allow empty value or valid number input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTempRates((prev) => ({
        ...prev,
        [idx]: value === "" ? 0 : parseFloat(value) || 0,
      }));
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleFocOverrideChange = (idx: number) => {
    if (focOverrideIndex === idx) {
      setFocOverrideIndex(null); // Uncheck if already checked
    } else {
      setFocOverrideIndex(idx); // Check new one, unchecking others
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

  const recalculateWithCustomRates = (rates: { [key: string]: number }) => {
    if (results && season && hotel) {
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

      // Simple FOC calculation - use override if selected, otherwise use original FOC
      let focDeduction = results.roomTotals?.foc || 0;

      if (focOverrideIndex !== null && rates[focOverrideIndex] !== undefined) {
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

        const overrideRate = rates[focOverrideIndex];
        const perGuestPerNight = overrideRate / 2; // assume double occupancy
        const nights = calculateNumberOfNights(
          contractData.startDate!,
          contractData.endDate!
        );
        const freeGuests =
          Math.floor(totalGuests / (focRule.paid + focRule.free)) *
          focRule.free;
        focDeduction = freeGuests * perGuestPerNight * nights;
      }

      const adjustedGross = newRoomTotals.gross - focDeduction;
      const commissionRate = getCommissionRate(contractData.bookingType || "");
      const finalRoomTotals = {
        gross: newRoomTotals.gross,
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
      if (contractData.id) {
        await archiveGroupContract(contractData.id);
      }

      const groupContract: Omit<GroupContract, "id"> = {
        archived: false,
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
        rooms: contractData.rooms!,
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
        customRates:
          Object.keys(customRates).length > 0 ? customRates : undefined,
        hasCustomRates: Object.keys(customRates).length > 0,
        // Add addon arrays to contract data
        hotelAddons: contractData.hotelAddons || [],
        diveAddons: contractData.diveAddons || [],
        mealAddons: contractData.mealAddons || [],
      };

      await addGroupContract(groupContract);
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

          // FOC calculation with custom rates - follow the same pattern as original calculation
          const focRule = parseFocRule(hotelData.focRule || "0+0");
          let focDeduction = 0;

          // Find the FOC base room type from hotel settings (same as original)
          const focRoomType = roomTypesData.find(
            (rt: RoomType) => rt.hotelId === hotelData.id && rt.isFocBase
          );

          if (focRoomType && contractData.rooms) {
            // Calculate total guests from room selections (same as original)
            const totalGuests = contractData.rooms.reduce((sum, room) => {
              if (room.numRooms > 0 && room.occupancyType) {
                const occNum = getOccupancyNumber(room.occupancyType);
                return sum + occNum * room.numRooms;
              }
              return sum;
            }, 0);

            // Find the room cost that matches the FOC base room type to get custom rate
            const focRoomCost = updatedRoomCosts.find((rc) => {
              // Extract category and occupancy from description
              const match = rc.description.match(
                /(\d+) x (\w+) rooms in category (\w+)/
              );
              if (!match) return false;

              const [, , occupancyType, categoryName] = match;

              // Find the category that matches the FOC base room type's categoryId
              const focBaseCategory = categories.find(
                (rc: RoomCategory) => rc.id === focRoomType.categoryId
              );

              // Check if this matches the FOC base room type's category and double occupancy
              return (
                focBaseCategory?.name.toLowerCase() ===
                  categoryName.toLowerCase() &&
                occupancyType.toLowerCase() === "double" // FOC is always based on double occupancy
              );
            });

            // Use custom rate if available, otherwise fall back to original logic
            let baseRate;
            if (focRoomCost) {
              // Extract the custom rate from the room cost description
              const rateMatch = focRoomCost.description.match(
                /@ \$(\d+\.\d+)\/night/
              );
              if (rateMatch) {
                baseRate = { price: parseFloat(rateMatch[1]) };
              }
            }

            // Fallback to original rate if no custom rate found
            if (!baseRate) {
              baseRate = ratesData.find(
                (r) =>
                  r.categoryId === focRoomType.categoryId &&
                  r.seasonId === seasonResult.id &&
                  r.occupancyType.toLowerCase() === "double"
              );
            }

            if (baseRate) {
              const perGuestPerNight = baseRate.price / 2;
              const nights = calculateNumberOfNights(
                contractData.startDate!,
                contractData.endDate!
              );
              const freeGuests =
                Math.floor(totalGuests / (focRule.paid + focRule.free)) *
                focRule.free;
              focDeduction = freeGuests * perGuestPerNight * nights;
            }
          }

          const adjustedGross = newRoomTotals.gross - focDeduction;
          const commissionRate = getCommissionRate(
            contractData.bookingType || ""
          );
          const finalRoomTotals = {
            gross: newRoomTotals.gross,
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

          // Set custom rates state
          setCustomRates(contractData.customRates);
        } else {
          setResults({
            ...calc,
            roomCosts: sortRoomCosts(calc.roomCosts),
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("An error occurred while calculating the total cost.");
      }
    }

    fetchData();
  }, [contractData]);

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

      {/* Rooms */}
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
                  <HStack spacing={2}>
                    <Checkbox
                      isChecked={focOverrideIndex === originalIdx}
                      onChange={() => handleFocOverrideChange(originalIdx)}
                      size="sm"
                    />
                    <Text flex={1}>
                      {rc.description.replace(/@ \$\d+\.\d+\/night/, "@ $")}
                    </Text>
                    <Input
                      type="number"
                      value={tempRates[originalIdx]?.toString() || ""}
                      onChange={(e) =>
                        handleRateChange(originalIdx, e.target.value)
                      }
                      onFocus={handleInputFocus}
                      size="sm"
                      width="80px"
                      step="0.01"
                      min="0"
                    />
                    <Text>/night</Text>
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

      {/* Meals */}
      {mealPackage && (
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
