import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: authData, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user: authData?.user,
    employee: authData?.currentEmployee,
    isImpersonating: authData?.isImpersonating || false,
    originalEmployee: authData?.employee,
    impersonatingEmployee: authData?.impersonatingEmployee,
    isAdmin: authData?.user?.isAdmin || false,
    isLoading,
    isAuthenticated: !!authData?.user,
    error,
    refetch
  };
}