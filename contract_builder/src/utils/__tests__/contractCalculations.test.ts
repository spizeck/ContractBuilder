import { describe, it, expect } from "vitest";
import {
  calculateNumberOfNights,
  determineSeason,
  getOccupancyNumber,
  getCommissionRate,
  calculateTotalCost,
} from "../contractCalculations";

const mockSeason = {
  id: "SEASON1",
  hotelId: "HOTEL1",
  name: "Winter",
  startDate: "2025-01-01",
  endDate: "2025-04-30",
};

const mockHotel = {
  id: "HOTEL1",
  name: "Test Hotel",
  focRule: "7+1",
};

const mockRoomType = {
  hotelId: "HOTEL1",
  categoryId: "CAT1",
  isFocBase: true,
};

const mockRoomCategory = { 
  id: "CAT1", 
  name: "Ocean View Double" ,
  hotelId: "HOTEL1",
};

const mockRate = {
  categoryId: "CAT1",
  occupancyType: "Double",
  price: 230,
  seasonId: "SEASON1",
  hotelId: "HOTEL1",
};

const mockContractData = {
  startDate: "2025-01-01",
  endDate: "2025-01-08", // 7 nights
  bookingType: "diveShop10",
  numDivers: 8,
  rooms: [
    {
      categoryId: "CAT1",
      occupancyType: "Double",
      numRooms: 4,
    },
  ],
};

const mockDivePackage = { price: 100 };
const mockMealPackage = { price: 50, commissionRate: 0.05 };

describe("basic calculations", () => {
  it("calculateNumberOfNights returns correct nights", () => {
    expect(calculateNumberOfNights("2025-01-01", "2025-01-08")).toBe(7);
  });

  it("throws error if end date <= start date", () => {
    expect(() => calculateNumberOfNights("2025-01-01", "2024-12-31")).toThrow();
  });

  it("getOccupancyNumber returns expected values", () => {
    expect(getOccupancyNumber("double")).toBe(2);
    expect(() => getOccupancyNumber("unknown")).toThrow();
  });

  it("getCommissionRate extracts percent", () => {
    expect(getCommissionRate("diveShop10")).toBe(0.1);
    expect(getCommissionRate("tourOperator25")).toBe(0.25);
    expect(getCommissionRate("invalid")).toBe(0);
  });

  it("determineSeason picks the overlapping one", () => {
    const result = determineSeason("2025-01-15", "2025-02-15", [mockSeason]);
    expect(result.id).toBe("SEASON1");
  });
});

describe("calculateTotalCost", () => {
  it("calculates full totals including FOC, dives, and meals", () => {
    const result = calculateTotalCost(
      mockContractData as any,
      mockSeason as any,
      [mockRate] as any,
      mockDivePackage as any,
      mockMealPackage as any,
      [mockRoomCategory] as any,
      [mockRoomType] as any,
      mockHotel as any
    );

    // Basic sanity
    expect(result.totalGuests).toBe(8); // 4 rooms * 2 guests
    expect(result.roomTotals.gross).toBe(4 * 7 * 230); // 6440
    expect(result.roomTotals.foc).toBeGreaterThan(0); // should have some FOC
    expect(result.diveTotals.gross).toBe(800);
    expect(result.mealTotals.gross).toBe(400);
    expect(result.overall.gross).toBeGreaterThan(0);
    expect(result.overall.net).toBeGreaterThan(0);
  });

  it("throws error when no matching rate found", () => {
    const badData = {
      ...mockContractData,
      rooms: [{ ...mockContractData.rooms[0], categoryId: "BAD" }],
    };
    expect(() =>
      calculateTotalCost(
        badData as any,
        mockSeason as any,
        [mockRate] as any,
        null,
        null,
        [mockRoomCategory] as any,
        [mockRoomType] as any,
        mockHotel as any
      )
    ).toThrow();
  });
});
