import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { RateLimiterService } from '../base/rate-limiter.service';
import { BaseApiService } from '../base/base-api.service';

export interface OpenCorporatesCompany {
  name: string;
  company_number: string;
  jurisdiction_code: string;
  incorporation_date?: string;
  dissolution_date?: string;
  company_type?: string;
  registry_url?: string;
  branch?: string;
  current_status?: string;
  registered_address?: {
    street_address?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  officers?: Array<{
    name: string;
    position: string;
    start_date?: string;
    end_date?: string;
  }>;
}

@Injectable()
export class OpenCorporatesService extends BaseApiService {
  constructor(
    cacheService: CacheService,
    rateLimiter: RateLimiterService,
    configService: ConfigService,
  ) {
    const apiKey = configService.get<string>('OPENCORPORATES_API_KEY');

    super(cacheService, rateLimiter, configService, 'OpenCorporatesService', {
      baseURL: 'https://api.opencorporates.com/v0.4',
      rateLimitKey: 'opencorporates',
      rateLimitMax: apiKey ? 60 : 5, // Higher limit with API key
      rateLimitWindowMs: 60000, // 1 minute
      cacheTTL: 2592000, // 30 days - company data rarely changes
    });

    // Add API key if provided
    if (apiKey) {
      this.client.defaults.params = { api_token: apiKey };
    }
  }

  /**
   * Search for companies by name
   * @param query Company name
   * @param jurisdiction Optional jurisdiction code (e.g., 'us_ca' for California)
   */
  async searchCompanies(
    query: string,
    jurisdiction?: string,
  ): Promise<OpenCorporatesCompany[]> {
    try {
      const cacheKey = this.generateCacheKey('opencorp:search', { query, jurisdiction });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: '/companies/search',
          params: {
            q: query,
            jurisdiction_code: jurisdiction,
            per_page: 10,
          },
        },
        { cacheKey },
      );

      const companies = response.results?.companies || [];
      return companies.map((item: any) => this.mapCompanyResponse(item.company));
    } catch (error) {
      this.logger.error(`Error searching companies: ${error.message}`);
      return [];
    }
  }

  /**
   * Get company details by jurisdiction and company number
   * @param jurisdiction Jurisdiction code (e.g., 'us_ca')
   * @param companyNumber Company registration number
   */
  async getCompany(
    jurisdiction: string,
    companyNumber: string,
  ): Promise<OpenCorporatesCompany | null> {
    try {
      const cacheKey = this.generateCacheKey('opencorp:company', { jurisdiction, companyNumber });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: `/companies/${jurisdiction}/${companyNumber}`,
        },
        { cacheKey },
      );

      return this.mapCompanyResponse(response.results?.company);
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn(`Company not found: ${jurisdiction}/${companyNumber}`);
        return null;
      }
      this.logger.error(`Error fetching company: ${error.message}`);
      return null;
    }
  }

  /**
   * Get officers (directors, executives) for a company
   * @param jurisdiction Jurisdiction code
   * @param companyNumber Company registration number
   */
  async getOfficers(jurisdiction: string, companyNumber: string): Promise<any[]> {
    try {
      const cacheKey = this.generateCacheKey('opencorp:officers', { jurisdiction, companyNumber });

      const response = await this.request<any>(
        {
          method: 'GET',
          url: `/companies/${jurisdiction}/${companyNumber}/officers`,
        },
        { cacheKey },
      );

      return response.results?.officers || [];
    } catch (error) {
      this.logger.error(`Error fetching officers: ${error.message}`);
      return [];
    }
  }

  private mapCompanyResponse(company: any): OpenCorporatesCompany {
    return {
      name: company.name,
      company_number: company.company_number,
      jurisdiction_code: company.jurisdiction_code,
      incorporation_date: company.incorporation_date,
      dissolution_date: company.dissolution_date,
      company_type: company.company_type,
      registry_url: company.registry_url,
      branch: company.branch,
      current_status: company.current_status,
      registered_address: company.registered_address
        ? {
            street_address: company.registered_address.street_address,
            locality: company.registered_address.locality,
            region: company.registered_address.region,
            postal_code: company.registered_address.postal_code,
            country: company.registered_address.country,
          }
        : undefined,
    };
  }
}
