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
  Select,
  Switch,
  Textarea,
  VStack
} from '@chakra-ui/react'
import { useState } from 'react'
import { addAsset, updateAsset } from '@/services/assets'
import { Asset } from '@/types/maintenance'

interface Props {
  asset: Asset | null
  onClose: () => void
}

export default function AddEditAssetForm({ asset, onClose }: Props) {
  const [form, setForm] = useState<Partial<Asset>>(
    asset || { active: true, category: 'Boat' }
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    if (asset?.id) {
      await updateAsset(asset.id, form)
    } else {
      await addAsset(form as Omit<Asset, 'id'>)
    }

    setLoading(false)
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{asset ? 'Edit Asset' : 'Add Asset'}</ModalHeader>
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

              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as Asset['category'] })}
                >
                  <option value="Boat">Boat</option>
                  <option value="Compressor">Compressor</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Serial / Identifier</FormLabel>
                <Input
                  value={form.serialNumber || ''}
                  onChange={e => setForm({ ...form, serialNumber: e.target.value })}
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
            <Button mr={3} onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={loading}
            >
              {asset ? 'Save Changes' : 'Add Asset'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
