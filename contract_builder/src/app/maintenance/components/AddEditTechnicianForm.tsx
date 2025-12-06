'use client'

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
  Switch,
  Textarea,
  VStack
} from '@chakra-ui/react'
import { useState } from 'react'
import { addTechnician, updateTechnician } from '@/services/technicians'
import { Technician } from '@/types/maintenance'

interface Props {
  technician: Technician | null
  onClose: () => void
}

export default function AddEditTechnicianForm({ technician, onClose }: Props) {
  const [form, setForm] = useState<Partial<Technician>>(
    technician || { active: true }
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (technician?.id) {
      await updateTechnician(technician.id, form)
    } else {
      await addTechnician(form as Omit<Technician, 'id'>)
    }

    setLoading(false)
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {technician ? 'Edit Technician' : 'Add Technician'}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Role</FormLabel>
                <Input
                  value={form.role || ''}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Certifications</FormLabel>
                <Textarea
                  value={form.certifications || ''}
                  onChange={e => setForm({ ...form, certifications: e.target.value })}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Active</FormLabel>
                <Switch
                  isChecked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose} variant="ghost" mr={3}>
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loading}
            >
              {technician ? 'Save Changes' : 'Add Technician'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
