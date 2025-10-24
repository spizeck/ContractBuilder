"use client"

import {
  Box, Button, FormControl, FormLabel, Input,
  Select, Textarea, VStack, useToast, Heading, HStack
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { addMaintenanceLog, updateMaintenanceLog, getMaintenanceLog } from "@/services/maintenance"
import { getAssets } from "@/services/assets"
import { getTechnicians } from "@/services/technicians"
import { Asset, Technician } from "@/types/maintenance"
import { useAuth } from "@/context/AuthContext"

export default function LogForm({ id }: { id?: string }) {
  const router = useRouter()
  const toInputDate = (d: Date) => d.toISOString().split("T")[0]
  const [form, setForm] = useState<any>({ date: toInputDate(new Date()) })
  const [assets, setAssets] = useState<Asset[]>([])
  const [techs, setTechs] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { user } = useAuth()

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
        }
      }
    }
    load()
  }, [id])

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
          <FormControl isRequired>
            <FormLabel>Asset</FormLabel>
            <Select
              value={form.assetId || ""}
              onChange={(e) => setForm({ ...form, assetId: e.target.value })}
            >
              <option value="">-- Select asset --</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </FormControl>

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
