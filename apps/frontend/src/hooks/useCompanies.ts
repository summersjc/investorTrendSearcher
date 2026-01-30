import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useCompanies(params?: any) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const response = await api.companies.list(params);
      return response.data;
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const response = await api.companies.get(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCompanyBySlug(slug: string) {
  return useQuery({
    queryKey: ['company', 'slug', slug],
    queryFn: async () => {
      const response = await api.companies.getBySlug(slug);
      return response.data;
    },
    enabled: !!slug,
  });
}

export function useCompanyFunding(id: string) {
  return useQuery({
    queryKey: ['company', id, 'funding'],
    queryFn: async () => {
      const response = await api.companies.getFunding(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCompanyInvestors(id: string) {
  return useQuery({
    queryKey: ['company', id, 'investors'],
    queryFn: async () => {
      const response = await api.companies.getInvestors(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.companies.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.companies.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.companies.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useEnrichCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.companies.enrich(id);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['company', id] });
    },
  });
}
