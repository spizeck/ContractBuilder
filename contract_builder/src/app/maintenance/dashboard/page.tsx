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
import { useMaintenanceSummary } from "./hooks/useMaintenanceSummary";
import type { Asset } from "@/types/maintenance";
import { useAuth } from "@/context/AuthContext";

export default function MaintenanceDashboardPage() {
  const { role } = useAuth(); // expects roles like 'viewer', 'manager', 'admin'
  const canEdit = role === "admin" || role === "manager";

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<"All" | "Marine" | "Compressors" | "Vehicles" | "Scuba Equipment" | "Other">("All");
  const [technicianId, setTechnicianId] = useState<string | "All">("All");
  const [range, setRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const { assets, logs, technicians, loading } = useMaintenanceData({
    keyword,
    category,
    technicianId,
    range,
  });

  const summary = useMaintenanceSummary(assets, logs);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const onViewLogs = (asset: Asset) => {
    setSelectedAsset(asset);
    onOpen();
  };

  // Clicking summary cards adjusts filters
  const handleSummaryFilter = (type: "all" | "overdue" | "dueSoon" | "recentLogs") => {
    switch (type) {
      case "all":
        setKeyword("");
        setCategory("All");
        setTechnicianId("All");
        setRange({ start: null, end: null });
        break;
      case "recentLogs": {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setRange({ start, end: null });
        break;
      }
      case "overdue":
        // Keep a keyword that won't filter; filter happens in panels via status badges (already reflected in counts)
        setKeyword("");
        break;
      case "dueSoon":
        setKeyword("");
        break;
    }
  };

  return (
    <Box h="100%" display="flex" flexDirection="column" overflow="hidden">
      <DashboardHeader
        keyword={keyword}
        onKeyword={setKeyword}
        category={category}
        onCategory={setCategory}
        technicianId={technicianId}
        onTechnician={setTechnicianId}
        range={range}
        onRange={setRange}
        technicians={technicians}
      />

      <Box px={3} pt={3} overflow="hidden">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <SummaryCards summary={summary} onFilterSelect={handleSummaryFilter} />

            <Grid
              templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
              gap={4}
              mt={2}
              overflow="hidden"
            >
              <GridItem overflow="auto" pr={{ base: 0, lg: 2 }} maxH="calc(100vh - 220px)">
                <CategoryPanels
                  assets={assets}
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
                  technicians={technicians}
                  logs={logs.filter((l) => isWithinLastNDays(l.date, 30))}
                  onSelectTechnician={(id) => setTechnicianId(id)}
                />
              </GridItem>
            </Grid>
          </>
        )}
      </Box>

      <LogsModal isOpen={isOpen} onClose={onClose} asset={selectedAsset} />
    </Box>
  );
}

function isWithinLastNDays(d: Date, n: number) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - n);
  return d >= cutoff;
}