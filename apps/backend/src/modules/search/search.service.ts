import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface SearchResult {
  type: 'investor' | 'company';
  id: string;
  name: string;
  slug: string;
  description?: string;
  metadata?: any;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Unified search across investors and companies
   */
  async search(query: string, limit: number = 20): Promise<SearchResult[]> {
    this.logger.log(`Searching for: ${query}`);

    if (!query || query.trim().length < 2) {
      return [];
    }

    const searchTerm = query.trim();

    // Search investors and companies in parallel
    const [investors, companies] = await Promise.all([
      this.prisma.investor.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.company.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { ticker: { contains: searchTerm, mode: 'insensitive' } },
            { industry: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    // Convert to search results
    const results: SearchResult[] = [
      ...investors.map((investor) => ({
        type: 'investor' as const,
        id: investor.id,
        name: investor.name,
        slug: investor.slug,
        description: investor.description || undefined,
        metadata: {
          type: investor.type,
          city: investor.city,
          country: investor.country,
        },
      })),
      ...companies.map((company) => ({
        type: 'company' as const,
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description || undefined,
        metadata: {
          type: company.type,
          stage: company.stage,
          industry: company.industry,
          ticker: company.ticker,
        },
      })),
    ];

    // Sort by relevance (name starts with query first)
    results.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(searchTerm.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(searchTerm.toLowerCase());

      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    return results.slice(0, limit);
  }

  /**
   * Search only investors
   */
  async searchInvestors(query: string, limit: number = 20): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.prisma.investor.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Search only companies
   */
  async searchCompanies(query: string, limit: number = 20): Promise<any[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    return this.prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { ticker: { contains: query, mode: 'insensitive' } },
          { industry: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }
}
