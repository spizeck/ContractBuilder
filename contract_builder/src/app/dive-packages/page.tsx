import DivePackagesList from '@/app/dive-packages/DivePackagesList'
import ProtectedPage from '@/components/ProtectedPage'
export default function DivePackagesPage () {
  return (
    <ProtectedPage allowedRoles={['admin', 'manager']}>
      <DivePackagesList />;
    </ProtectedPage>
  )
}
