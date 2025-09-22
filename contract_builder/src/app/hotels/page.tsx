import HotelsPageContent from '@/app/hotels/HotelPageContent'
import ProtectedPage from '@/components/ProtectedPage'

export default function HotelsPage () {
  return (
    <ProtectedPage allowedRoles={['admin', 'manager']}>
      <HotelsPageContent />;
    </ProtectedPage>
  )
}
