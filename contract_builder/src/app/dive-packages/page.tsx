import DivePackagesList from './components/DivePackagesList'
import ProtectedPage from '@/components/shared/LayoutComponents/ProtectedPage'
export default function DivePackagesPage () {
  return (
    <ProtectedPage allowedRoles={['admin', 'manager']}>
      <DivePackagesList />
    </ProtectedPage>
  )
}
