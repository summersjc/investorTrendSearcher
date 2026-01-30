import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useInvestments(params?: any) {
  return useQuery({
    queryKey: ['investments', params],
    queryFn: async () => {
      const response = await api.investments.list(params);
      return response.data;
    },
  });
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: ['investment', id],
    queryFn: async () => {
      const response = await api.investments.get(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useInvestmentStatistics() {
  return useQuery({
    queryKey: ['investments', 'statistics'],
    queryFn: async () => {
      const response = await api.investments.statistics();
      return response.data;
    },
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.investments.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.investments.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['investment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.investments.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
