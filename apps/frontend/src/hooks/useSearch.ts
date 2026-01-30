import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useSearch(query: string, limit: number = 20) {
  return useQuery({
    queryKey: ['search', query, limit],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { query, total: 0, results: [] };
      }
      const response = await api.search.all(query, limit);
      return response.data;
    },
    enabled: query.trim().length >= 2,
  });
}

export function useSearchInvestors(query: string, limit: number = 20) {
  return useQuery({
    queryKey: ['search', 'investors', query, limit],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { query, total: 0, results: [] };
      }
      const response = await api.search.investors(query, limit);
      return response.data;
    },
    enabled: query.trim().length >= 2,
  });
}

export function useSearchCompanies(query: string, limit: number = 20) {
  return useQuery({
    queryKey: ['search', 'companies', query, limit],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { query, total: 0, results: [] };
      }
      const response = await api.search.companies(query, limit);
      return response.data;
    },
    enabled: query.trim().length >= 2,
  });
}
