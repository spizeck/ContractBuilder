"use client"

import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Textarea,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { addMaintenanceLog, updateMaintenanceLog } from '@/services/maintenance'
import { getAssets } from '@/services/assets'
import { getTechnicians } from '@/services/technicians'
import { Asset, Technician } from '@/types/maintenance'
import { useAuth } from '@/context/AuthContext'

interface Props {
  onClose: () => void
  initial?: any
}

export default function AddMaintenanceLogForm({ onClose, initial }: Props) {
  // helper to format a Date to yyyy-mm-dd using local time (avoids UTC shift)
  const toInputDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const [form, setForm] = useState<any>({ date: toInputDate(new Date()) })
  const [assets, setAssets] = useState<Asset[]>([])
  const [techs, setTechs] = useState<Technician[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const toast = useToast()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const [a, t] = await Promise.all([getAssets(), getTechnicians()])
      if (!mounted) return
      setAssets(a)
      setTechs(t)
    }
    load()

    // If initial (editing), prefill the form
    if (initial) {
      const initDate = initial.date
      const formatted = initDate
        ? (initDate instanceof Date ? toInputDate(initDate) : toInputDate(new Date(initDate)))
        : toInputDate(new Date())

      setForm({
        assetId: initial.assetId,
        technicianId: initial.technicianId,
        date: formatted,
        summary: initial.summary,
        details: initial.details,
        hoursAtService: initial.hoursAtService,
        nextServiceDue: initial.nextServiceDue,
        cost: initial.cost,
      })
    }

    return () => { mounted = false }
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!form.assetId || !form.technicianId || !form.summary) {
        toast({ title: 'Missing fields', description: 'Please select asset, technician and enter a summary.', status: 'warning', duration: 4000, isClosable: true })
        setLoading(false)
        return
      }

      const asset = assets.find(a => a.id === form.assetId)
      const tech = techs.find(t => t.id === form.technicianId)

      // construct date in local timezone from yyyy-mm-dd string to avoid UTC shift
      const [y, m, d] = String(form.date).split('-').map(Number)
      const localDate = new Date(y, m - 1, d)

      const payload = {
        assetId: asset?.id || '',
        assetName: asset?.name || '',
        category: asset?.category || '',
        date: localDate,
        technicianId: tech?.id || '',
        technicianName: tech?.name || '',
        summary: form.summary,
        details: form.details || '',
        hoursAtService: form.hoursAtService ? Number(form.hoursAtService) : undefined,
        nextServiceDue: form.nextServiceDue ? Number(form.nextServiceDue) : undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        attachments: [],

        createdBy: user?.uid || 'system',
      }

      if (initial && initial.id) {
        // editing existing log
        await updateMaintenanceLog(initial.id, payload)
      } else {
        await addMaintenanceLog(payload)
      }

      toast({ title: 'Saved', status: 'success', duration: 3000, isClosable: true })
      onClose()
    } catch (err) {
      console.error('Failed to save maintenance log', err)
      toast({ title: 'Save failed', description: 'Failed to save maintenance log', status: 'error', duration: 4000, isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Maintenance Log</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Asset</FormLabel>
                <Select value={form.assetId || ''} onChange={e => setForm({ ...form, assetId: e.target.value })}>
                  <option value="">-- Select asset --</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Technician</FormLabel>
                <Select value={form.technicianId || ''} onChange={e => setForm({ ...form, technicianId: e.target.value })}>
                  <option value="">-- Select technician --</option>
                  {techs.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Date</FormLabel>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Summary</FormLabel>
                <Input value={form.summary || ''} onChange={e => setForm({ ...form, summary: e.target.value })} />
              </FormControl>

              <FormControl>
                <FormLabel>Details</FormLabel>
                <Textarea value={form.details || ''} onChange={e => setForm({ ...form, details: e.target.value })} />
              </FormControl>

              <FormControl>
                <FormLabel>Hours at Service</FormLabel>
                <Input type="number" value={form.hoursAtService || ''} onChange={e => setForm({ ...form, hoursAtService: e.target.value })} />
              </FormControl>

              <FormControl>
                <FormLabel>Next Service Due (hours)</FormLabel>
                <Input type="number" value={form.nextServiceDue || ''} onChange={e => setForm({ ...form, nextServiceDue: e.target.value })} />
              </FormControl>

              <FormControl>
                <FormLabel>Cost</FormLabel>
                <Input type="number" step="0.01" value={form.cost || ''} onChange={e => setForm({ ...form, cost: e.target.value })} />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose} variant="ghost" mr={3}>Cancel</Button>
            <Button type="submit" colorScheme="blue" isLoading={loading}>Save Log</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
