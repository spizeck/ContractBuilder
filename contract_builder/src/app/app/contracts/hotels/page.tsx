import HotelsPageContent from './components/HotelPageContent'
import ProtectedPage from '@/components/shared/LayoutComponents/ProtectedPage'

export default function HotelsPage () {
  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager']}>
      <HotelsPageContent />
    </ProtectedPage>
  )
}
