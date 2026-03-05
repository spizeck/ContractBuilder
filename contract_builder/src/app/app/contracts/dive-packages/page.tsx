import DivePackagesList from './components/DivePackagesList'
import ProtectedPage from '@shared/components/LayoutComponents/ProtectedPage'
export default function DivePackagesPage () {
  return (
    <ProtectedPage allowedRoles={['admin', 'hotel-manager']}>
      <DivePackagesList />
    </ProtectedPage>
  )
}
