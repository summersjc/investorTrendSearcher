import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { RateLimiterService } from '../base/rate-limiter.service';
import { BaseApiService } from '../base/base-api.service';

export interface WikidataEntity {
  id: string;
  label: string;
  description?: string;
  aliases?: string[];
  website?: string;
  foundedDate?: string;
  headquarters?: string;
  industry?: string;
  ceo?: string;
  employees?: number;
  revenue?: number;
}

@Injectable()
export class WikidataService extends BaseApiService {
  constructor(
    cacheService: CacheService,
    rateLimiter: RateLimiterService,
    configService: ConfigService,
  ) {
    super(cacheService, rateLimiter, configService, 'WikidataService', {
      baseURL: 'https://www.wikidata.org/w/api.php',
      headers: {
        'User-Agent': 'InvestorResearch/1.0 (contact@example.com)',
      },
      rateLimitKey: 'wikidata',
      rateLimitMax: 50, // Be respectful
      rateLimitWindowMs: 60000,
      cacheTTL: 2592000, // 30 days
    });
  }

  /**
   * Search for entities by name
   * @param query Search query
   * @param type Entity type (e.g., 'company', 'organization')
   */
  async searchEntities(query: string, type?: string): Promise<WikidataEntity[]> {
    try {
      const cacheKey = this.generateCacheKey('wikidata:search', { query, type });

      const response = await this.request<any>(
        {
          method: 'GET',
          params: {
            action: 'wbsearchentities',
            format: 'json',
            search: query,
            language: 'en',
            limit: 10,
            type: 'item',
          },
        },
        { cacheKey },
      );

      const results = response.search || [];
      return results.map((item: any) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        aliases: item.aliases,
      }));
    } catch (error) {
      this.logger.error(`Error searching Wikidata: ${error.message}`);
      return [];
    }
  }

  /**
   * Get entity details by Wikidata ID
   * @param entityId Wikidata entity ID (e.g., 'Q95')
   */
  async getEntity(entityId: string): Promise<WikidataEntity | null> {
    try {
      const cacheKey = this.generateCacheKey('wikidata:entity', { entityId });

      const response = await this.request<any>(
        {
          method: 'GET',
          params: {
            action: 'wbgetentities',
            format: 'json',
            ids: entityId,
            languages: 'en',
            props: 'labels|descriptions|claims',
          },
        },
        { cacheKey },
      );

      const entity = response.entities?.[entityId];
      if (!entity) {
        return null;
      }

      return this.mapEntityResponse(entityId, entity);
    } catch (error) {
      this.logger.error(`Error fetching entity ${entityId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get company information by searching and fetching details
   * @param companyName Company name
   */
  async getCompanyByName(companyName: string): Promise<WikidataEntity | null> {
    try {
      const results = await this.searchEntities(companyName);

      // Find the most relevant company result
      const companyResult = results.find(
        (r) =>
          r.description?.toLowerCase().includes('company') ||
          r.description?.toLowerCase().includes('corporation') ||
          r.description?.toLowerCase().includes('business'),
      );

      if (!companyResult) {
        this.logger.warn(`No company found for: ${companyName}`);
        return null;
      }

      // Get full entity details
      return this.getEntity(companyResult.id);
    } catch (error) {
      this.logger.error(`Error fetching company ${companyName}: ${error.message}`);
      return null;
    }
  }

  private mapEntityResponse(entityId: string, entity: any): WikidataEntity {
    const claims = entity.claims || {};
    const labels = entity.labels?.en?.value || entityId;
    const description = entity.descriptions?.en?.value;

    return {
      id: entityId,
      label: labels,
      description,
      website: this.getClaimValue(claims, 'P856'), // official website
      foundedDate: this.getClaimValue(claims, 'P571'), // inception
      headquarters: this.getClaimValue(claims, 'P159'), // headquarters location
      industry: this.getClaimValue(claims, 'P452'), // industry
      ceo: this.getClaimValue(claims, 'P169'), // chief executive officer
      employees: this.getClaimNumericValue(claims, 'P1128'), // employees
      revenue: this.getClaimNumericValue(claims, 'P2139'), // total revenue
    };
  }

  private getClaimValue(claims: any, property: string): string | undefined {
    try {
      const claim = claims[property]?.[0];
      if (!claim) return undefined;

      const datavalue = claim.mainsnak?.datavalue;
      if (datavalue?.type === 'string') {
        return datavalue.value;
      } else if (datavalue?.type === 'time') {
        return datavalue.value?.time;
      } else if (datavalue?.type === 'wikibase-entityid') {
        return datavalue.value?.id;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  private getClaimNumericValue(claims: any, property: string): number | undefined {
    try {
      const claim = claims[property]?.[0];
      if (!claim) return undefined;

      const datavalue = claim.mainsnak?.datavalue;
      if (datavalue?.type === 'quantity') {
        return parseFloat(datavalue.value?.amount);
      }

      return undefined;
    } catch {
      return undefined;
    }
  }
}
