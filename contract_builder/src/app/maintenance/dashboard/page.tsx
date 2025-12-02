"use client";

import {
  Box,
  Grid,
  GridItem,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import dynamic from "next/dynamic";
// Defer SSR for header to avoid hydration mismatch from browser extensions injecting attributes
const DashboardHeader = dynamic(() => import("./components/DashboardHeader"), { ssr: false });

import SummaryCards from "./components/SummaryCards";
import CategoryPanels from "./components/CategoryPanels";
import LogsModal from "./components/LogsModal";
import TechnicianActivity from "./components/TechnicianActivity";
import { useMaintenanceData } from "./hooks/useMaintenanceSearch";
import { useDashboardFilters } from "./hooks/useDashboardFilters";
import type { Asset } from "@/types/maintenance";
import { useAuth } from "@/context/AuthContext";

export default function MaintenanceDashboardPage() {
  const { role } = useAuth(); // expects roles like 'viewer', 'manager', 'admin'
  const canEdit = role === "admin" || role === "manager";

  // Get raw data (unfiltered) from the existing hook
  const { assets: rawAssets, logs: rawLogs, technicians: rawTechnicians, loading } = useMaintenanceData({
    keyword: "", // Get all data, we'll filter it ourselves
    category: "All",
    technicianId: "All",
    range: { start: null, end: null },
  });

  // Apply unified filtering
  const { filters, filterResult, updateFilters } = useDashboardFilters(
    rawAssets,
    rawLogs,
    rawTechnicians
  );

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onViewLogs = (asset: Asset) => {
    setSelectedAsset(asset);
    onOpen();
  };

  // Handle summary card clicks
  const handleSummaryFilter = (type: "all" | "overdue" | "dueSoon" | "recentLogs") => {
    switch (type) {
      case "all":
        updateFilters.reset();
        break;
      case "recentLogs":
        updateFilters.cardFilter("LOGS_THIS_MONTH");
        break;
      case "overdue":
        updateFilters.cardFilter("OVERDUE_SERVICES");
        break;
      case "dueSoon":
        updateFilters.cardFilter("UPCOMING_SERVICES");
        break;
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      <DashboardHeader
        keyword={filters.searchTerm}
        onKeyword={updateFilters.searchTerm}
        category={filters.categoryId}
        onCategory={updateFilters.categoryId}
        technicianId={filters.technicianId}
        onTechnician={updateFilters.technicianId}
        range={{ start: filters.dateRange.from, end: filters.dateRange.to }}
        onRange={(r) => updateFilters.dateRange({ from: r.start, to: r.end })}
        technicians={rawTechnicians}
      />

      <Box px={3} pt={3} overflow="hidden">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <SummaryCards 
              summary={filterResult.stats} 
              onFilterSelect={handleSummaryFilter}
              activeCardFilter={filters.cardFilter}
            />

            <Grid
              templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
              gap={4}
              mt={2}
              overflow="hidden"
            >
              <GridItem overflow="auto" pr={{ base: 0, lg: 2 }} maxH="calc(100vh - 220px)">
                <CategoryPanels
                  assets={filterResult.filteredAssets}
                  onViewLogs={onViewLogs}
                  canEdit={canEdit}
                  onEditAsset={(a) => {
                    // route to edit page if exists
                    // e.g., router.push(`/maintenance/assets/${a.id}`)
                  }}
                />
              </GridItem>

              <GridItem overflow="auto" pl={{ base: 0, lg: 2 }} maxH="calc(100vh - 220px)">
                <TechnicianActivity
                  activities={filterResult.filteredTechnicianActivities}
                  onSelectTechnician={(id) => updateFilters.technicianId(id)}
                />
              </GridItem>
            </Grid>
          </>
        )}
      </Box>

      <LogsModal 
        isOpen={isOpen} 
        onClose={onClose} 
        asset={selectedAsset} 
        searchKeyword={filters.searchTerm} 
        dateRange={filters.dateRange}
      />
    </Box>
  );
}