import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '../../services/api/dashboard';
import { useWorkspaceStore } from '@/stores/workspace.store';

export const useGetAdminStaffDashboard = () => {
  const academicYearId = useWorkspaceStore((state) => state.academicYearId);
  const academicPeriodId = useWorkspaceStore((state) => state.academicPeriodId);

  return useQuery(dashboardQueryOptions.adminStaffSummary({
    academicYearId,
    academicPeriodId,
  }));
};
