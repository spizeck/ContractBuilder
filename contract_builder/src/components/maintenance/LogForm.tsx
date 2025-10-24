"use client"

import {
  Box, Button, FormControl, FormLabel, Input,
  Select, Textarea, VStack, useToast, Heading, HStack
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { addMaintenanceLog, updateMaintenanceLog, getMaintenanceLog } from "@/services/maintenance"
import { getAssets } from "@/services/assets"
import { getTechnicians } from "@/services/technicians"
import { Asset, Technician } from "@/types/maintenance"
import { useAuth } from "@/context/AuthContext"

export default function LogForm({ id }: { id?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillAssetId = searchParams?.get("assetId") ?? undefined

  const toInputDate = (d: Date) => d.toISOString().split("T")[0]
  const [form, setForm] = useState<any>({ date: toInputDate(new Date()) })
  const [assets, setAssets] = useState<Asset[]>([])
  const [techs, setTechs] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { user } = useAuth()

  // cascading selection state
  const [category, setCategory] = useState<string>("")
  const [parentAssetId, setParentAssetId] = useState<string>("")
  const [subAssetId, setSubAssetId] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      const [a, t] = await Promise.all([getAssets(), getTechnicians()])
      setAssets(a)
      setTechs(t)

      if (id) {
        const log = await getMaintenanceLog(id)
        if (log) {
          setForm({
            ...log,
            date: toInputDate(new Date(log.date)),
          })
          // derive cascading selects from the stored assetId
          deriveSelectionsFromAssetId(log.assetId, a)
        }
      } else if (prefillAssetId) {
        // New log opened with ?assetId=... — prefill cascading selects
        deriveSelectionsFromAssetId(prefillAssetId, a)
      }
    }
    load()
  }, [id, prefillAssetId])

  // derive category / parent / sub from an assetId and available assets list
  function deriveSelectionsFromAssetId(assetId: string | undefined, assetsList: Asset[]) {
    if (!assetId) return
    const target = assetsList.find((x) => x.id === assetId)
    if (!target) return

    // If the target is a child, prefer the parent's category so cascading selects
    // show the parent's category (e.g., transmission (other) whose parent is a boat).
    if (target.parentAssetId) {
      const parent = assetsList.find((p) => p.id === target.parentAssetId)
      const resolvedCategory = parent?.category || target.category || ""
      setCategory(resolvedCategory)
      setParentAssetId(parent?.id || "")
      setSubAssetId(target.id)
      // assetId should point to the actual item we are logging against (child)
      setForm((f: any) => ({ ...f, assetId: target.id }))
    } else {
      // target is a parent asset (no parentAssetId)
      setCategory(target.category || "")
      setParentAssetId(target.id)
      setSubAssetId("") // no sub selected
      setForm((f: any) => ({ ...f, assetId: target.id }))
    }
  }

  // derived lists
  const categories = Array.from(new Set(assets.map((a) => a.category).filter(Boolean))).sort()
  const parentOptions = assets.filter((a) => a.category === category && !a.parentAssetId)
  const childOptions = assets.filter((a) => a.parentAssetId === parentAssetId)

  // selection handlers
  function handleCategoryChange(value: string) {
    setCategory(value)
    setParentAssetId("")
    setSubAssetId("")
    setForm((f: any) => ({ ...f, assetId: "" }))
  }

  // Always treat a parent as a valid maintenance target.
  // Selecting a parent now always sets form.assetId to the parent id.
  function handleParentChange(value: string) {
    setParentAssetId(value)
    setSubAssetId("")
    setForm((f: any) => ({ ...f, assetId: value }))
  }

  // Selecting a sub-asset sets the form.assetId to the child's id.
  function handleSubChange(value: string) {
    setSubAssetId(value)
    setForm((f: any) => ({ ...f, assetId: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const [y, m, d] = form.date.split("-").map(Number)
      const payload = {
        ...form,
        date: new Date(y, m - 1, d),
        createdBy: user?.uid || "system",
      }

      if (!payload.assetId) {
        toast({ title: "Please select an asset", status: "warning" })
        setLoading(false)
        return
      }

      if (id) {
        await updateMaintenanceLog(id, payload)
      } else {
        await addMaintenanceLog(payload)
      }

      toast({ title: "Saved", status: "success" })
      router.push("/maintenance/logs")
    } catch (err) {
      console.error(err)
      toast({ title: "Save failed", status: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box maxW="600px" mx="auto" p={6}>
      <Heading size="md" mb={6}>{id ? "Edit Maintenance Log" : "New Maintenance Log"}</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          {/* Cascading dropdowns for asset selection */}
          <FormControl isRequired>
            <FormLabel>Category</FormLabel>
            <Select
              placeholder="-- Select category --"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Parent Asset</FormLabel>
            <Select
              placeholder={category ? "-- Select parent asset --" : "Select category first"}
              value={parentAssetId}
              onChange={(e) => handleParentChange(e.target.value)}
              isDisabled={!category}
            >
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormControl>

          {/* Show sub-asset: always allow logging to the parent (explicit "Use parent" option),
              but present child options when they exist. */}
          {parentAssetId && (
            <FormControl>
              <FormLabel>Sub-Asset</FormLabel>
              {childOptions.length > 0 ? (
                <Select
                  value={subAssetId || parentAssetId}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === parentAssetId) {
                      // user chose to log to the parent
                      setSubAssetId("")
                      setForm((f: any) => ({ ...f, assetId: parentAssetId }))
                    } else {
                      // user chose a child
                      setSubAssetId(v)
                      setForm((f: any) => ({ ...f, assetId: v }))
                    }
                  }}
                >
                  <option value={parentAssetId}>{`Use parent: ${parentOptions.find(p => p.id === parentAssetId)?.name ?? "Parent"}`}</option>
                  {childOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              ) : (
                // No children: show the parent (disabled) so user sees selection
                <Select value={parentAssetId} isDisabled>
                  <option value={parentAssetId}>{parentOptions.find(p => p.id === parentAssetId)?.name ?? "Parent"}</option>
                </Select>
              )}
            </FormControl>
          )}

          {/* Technician */}
          <FormControl isRequired>
            <FormLabel>Technician</FormLabel>
            <Select
              value={form.technicianId || ""}
              onChange={(e) => setForm({ ...form, technicianId: e.target.value })}
            >
              <option value="">-- Select technician --</option>
              {techs.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Date</FormLabel>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Summary</FormLabel>
            <Input
              value={form.summary || ""}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Details</FormLabel>
            <Textarea
              value={form.details || ""}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Hours at Service</FormLabel>
            <Input
              type="number"
              value={form.hoursAtService || ""}
              onChange={(e) => setForm({ ...form, hoursAtService: e.target.value })}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Next Service Due (hours)</FormLabel>
            <Input
              type="number"
              value={form.nextServiceDue || ""}
              onChange={(e) => setForm({ ...form, nextServiceDue: e.target.value })}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Cost</FormLabel>
            <Input
              type="number"
              step="0.01"
              value={form.cost || ""}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </FormControl>
        </VStack>

        <HStack mt={6} justify="space-between">
          <Button variant="outline" onClick={() => router.push("/maintenance/logs")}>
            Cancel
          </Button>
          <Button colorScheme="blue" type="submit" isLoading={loading}>
            Save Log
          </Button>
        </HStack>
      </form>
    </Box>
  )
}
