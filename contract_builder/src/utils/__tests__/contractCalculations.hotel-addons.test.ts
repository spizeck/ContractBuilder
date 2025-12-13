import { describe, it, expect } from "vitest";
import {
  calculateTotalCost,
} from "../contractCalculations";

// Test data matching actual business logic
const mockSeason = {
  id: "WINTER25",
  hotelId: "JULIANAS",
  name: "Winter 25/26",
  startDate: "2026-01-01",
  endDate: "2026-04-30",
};

const mockHotel = {
  id: "JULIANAS",
  name: "Juliana's Hotel",
  focRule: "7+1",
} as any;

const mockRoomType = {
  id: "RT1",
  hotelId: "JULIANAS",
  categoryId: "OCEAN_VIEW",
  name: "Ocean View Room",
  description: "Ocean view room type",
  quantity: 10,
  isFocBase: true,
};

const mockRoomCategory = {
  id: "OCEAN_VIEW",
  name: "Ocean View",
  hotelId: "JULIANAS",
  occupancyTypes: ["Single", "Double", "Triple"],
};

const mockRates = [
  {
    id: "RATE_SINGLE",
    categoryId: "OCEAN_VIEW",
    occupancyType: "Single",
    price: 192,
    seasonId: "WINTER25",
    hotelId: "JULIANAS",
  },
  {
    id: "RATE_DOUBLE",
    categoryId: "OCEAN_VIEW",
    occupancyType: "Double",
    price: 205.75,
    seasonId: "WINTER25",
    hotelId: "JULIANAS",
  },
];

const mockDivePackage = {
  id: "DIVE1",
  name: "5 day 11 dives",
  description: "5 day dive package with 11 dives",
  price: 480,
};

const mockMealPackage = {
  id: "MEAL1",
  hotelId: "JULIANAS",
  name: "7 Dinners @ Tropics & 1 To-Go Lunch",
  description: "7 dinners at Tropics restaurant plus 1 to-go lunch",
  price: 475,
  commissionRate: 0.05,
};

const createContractData = (overrides = {}) => ({
  startDate: "2026-01-17",
  endDate: "2026-01-24", // 7 nights
  bookingType: "tourOperator20",
  numDivers: 9,
  rooms: [
    {
      categoryId: "OCEAN_VIEW",
      occupancyType: "Single",
      numRooms: 1,
    },
    {
      categoryId: "OCEAN_VIEW",
      occupancyType: "Double",
      numRooms: 4,
    },
  ],
  hotelAddons: [],
  diveAddons: [],
  mealAddons: [],
  ...overrides,
});

describe("Hotel Addons Regression Tests", () => {
  describe("Core calculateTotalCost function", () => {
    it("includes hotel addons in room gross totals", () => {
      const contractData = createContractData({
        hotelAddons: [
          { description: "Third Occ in Ocean View Room", amount: 175 },
          { description: "Moving into Lily Pond", amount: 90 },
          { description: "Room difference", amount: 171.25 },
        ],
      });

      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        mockDivePackage,
        mockMealPackage,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      // Base room costs: 1×7×192 + 4×7×205.75 = 1,344 + 5,761 = 7,105
      // Hotel addons: 175 + 90 + 171.25 = 436.25
      // Expected gross: 7,105 + 436.25 = 7,541.25
      expect(result.roomTotals.gross).toBe(7541.25);
      
      // Overall should include room + dive + meal costs
      expect(result.overall.gross).toBeGreaterThan(7541.25);
    });

    it("handles empty hotel addons array", () => {
      const contractData = createContractData({ hotelAddons: [] });
      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        mockDivePackage,
        mockMealPackage,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      // Should just be base room costs: 7,105
      expect(result.roomTotals.gross).toBe(7105);
    });

    it("handles null hotel addons", () => {
      const contractData = createContractData({ hotelAddons: null });
      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        mockDivePackage,
        mockMealPackage,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      // Should just be base room costs: 7,105
      expect(result.roomTotals.gross).toBe(7105);
    });

    it("applies commission correctly with hotel addons", () => {
      const contractData = createContractData({
        hotelAddons: [{ description: "Test addon", amount: 500 }],
      });

      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        null,
        null,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      // Base: 7,105 + Addon: 500 = 7,605 gross
      expect(result.roomTotals.gross).toBe(7605);
      
      // Commission should be 20% of (gross - FOC)
      expect(result.roomTotals.commission).toBeGreaterThan(0);
      expect(result.roomTotals.net).toBeLessThan(result.roomTotals.gross);
    });
  });

  describe("Regression tests for specific bugs", () => {
    it("regression: hotel addons not lost in calculation", () => {
      // This test ensures the hotel addon bug we fixed doesn't reoccur
      const contractData = createContractData({
        hotelAddons: [
          { description: "Third Occ in Ocean View Room", amount: 175 },
          { description: "Moving into Lily Pond", amount: 90 },
          { description: "difference in room pricing", amount: 171.25 },
        ],
      });

      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        mockDivePackage,
        mockMealPackage,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      // Verify hotel addons are included in room totals
      const baseRoomCost = 7105; // 1×7×192 + 4×7×205.75
      const expectedAddonTotal = 175 + 90 + 171.25;
      
      expect(result.roomTotals.gross).toBe(baseRoomCost + expectedAddonTotal);
      
      // Verify they flow through to overall totals
      const expectedRoomContribution = baseRoomCost + expectedAddonTotal;
      const diveContribution = result.diveTotals.gross;
      const mealContribution = result.mealTotals.gross;
      
      expect(result.overall.gross).toBe(
        expectedRoomContribution + diveContribution + mealContribution
      );
    });

    it("regression: room costs store gross not net values", () => {
      const contractData = createContractData();
      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        null,
        null,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      // Each room cost should be gross (before commission)
      const singleRoomCost = result.roomCosts.find(rc => 
        rc.description.includes("Single")
      );
      const doubleRoomCost = result.roomCosts.find(rc => 
        rc.description.includes("Double")
      );

      expect(singleRoomCost?.gross).toBe(1344); // 1×7×192
      expect(doubleRoomCost?.gross).toBe(5761); // 4×7×205.75
      
      // Net should be less than gross due to commission
      expect(singleRoomCost?.net).toBeLessThan(singleRoomCost?.gross || 0);
      expect(doubleRoomCost?.net).toBeLessThan(doubleRoomCost?.gross || 0);
    });
  });

  describe("Edge cases for hotel addons", () => {
    it("handles zero hotel addons", () => {
      const contractData = createContractData({
        hotelAddons: [{ description: "Zero addon", amount: 0 }],
      });

      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        null,
        null,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      expect(result.roomTotals.gross).toBe(7105); // Base cost unchanged
    });

    it("handles negative hotel addons", () => {
      const contractData = createContractData({
        hotelAddons: [{ description: "Discount", amount: -100 }],
      });

      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        null,
        null,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      expect(result.roomTotals.gross).toBe(7005); // Base cost minus discount
    });

    it("handles multiple hotel addons correctly", () => {
      const contractData = createContractData({
        hotelAddons: [
          { description: "Addon 1", amount: 100 },
          { description: "Addon 2", amount: 200 },
          { description: "Addon 3", amount: 300 },
        ],
      });

      const result = calculateTotalCost(
        contractData,
        mockSeason,
        mockRates,
        null,
        null,
        [mockRoomCategory],
        [mockRoomType],
        mockHotel
      );

      expect(result.roomTotals.gross).toBe(7105 + 600); // Base + all addons
    });
  });
});
