import HotelsPageContent from './components/HotelPageContent'
import ProtectedPage from '@/components/shared/LayoutComponents/ProtectedPage'

export default function HotelsPage () {
  return (
    <ProtectedPage allowedRoles={['admin', 'manager']}>
      <HotelsPageContent />
    </ProtectedPage>
  )
}
