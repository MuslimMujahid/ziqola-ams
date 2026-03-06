import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '../../services/api/dashboard';

export const useGetAdminStaffDashboard = () => {
  return useQuery(dashboardQueryOptions.adminStaffSummary());
};
