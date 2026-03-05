import HotelsPageContent from './components/HotelPageContent'
import ProtectedPage from '@shared/components/LayoutComponents/ProtectedPage'

export default function HotelsPage () {
  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager']}>
      <HotelsPageContent />
    </ProtectedPage>
  )
}
