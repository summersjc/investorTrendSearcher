import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useInvestors(params?: any) {
  return useQuery({
    queryKey: ['investors', params],
    queryFn: async () => {
      const response = await api.investors.list(params);
      return response.data;
    },
  });
}

export function useInvestor(id: string) {
  return useQuery({
    queryKey: ['investor', id],
    queryFn: async () => {
      const response = await api.investors.get(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useInvestorBySlug(slug: string) {
  return useQuery({
    queryKey: ['investor', 'slug', slug],
    queryFn: async () => {
      const response = await api.investors.getBySlug(slug);
      return response.data;
    },
    enabled: !!slug,
  });
}

export function useInvestorPortfolio(id: string) {
  return useQuery({
    queryKey: ['investor', id, 'portfolio'],
    queryFn: async () => {
      const response = await api.investors.getPortfolio(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateInvestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.investors.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
  });
}

export function useUpdateInvestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.investors.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['investor', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
  });
}

export function useDeleteInvestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.investors.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investors'] });
    },
  });
}

export function useEnrichInvestor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.investors.enrich(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['investor', id] });
    },
  });
}
