import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { ScraperConfig, getScraperConfig } from './scraper-config';

export interface ScrapedCompany {
  name: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  investmentDate?: string;
}

export interface ScrapeResult {
  success: boolean;
  companies: ScrapedCompany[];
  error?: string;
  totalFound: number;
}

@Injectable()
export class InvestorPortfolioScraper {
  private readonly logger = new Logger(InvestorPortfolioScraper.name);

  /**
   * Scrape investor portfolio using predefined config or custom URL
   * @param investorName Investor name (to find template) or URL
   * @param customConfig Optional custom scraper configuration
   */
  async scrapePortfolio(
    investorName: string,
    customConfig?: Partial<ScraperConfig>,
  ): Promise<ScrapeResult> {
    try {
      // Try to get predefined config
      let config = getScraperConfig(investorName);

      // If no config found and looks like a URL, create generic config
      if (!config && this.isUrl(investorName)) {
        config = this.createGenericConfig(investorName);
      }

      // Apply custom config overrides
      if (customConfig && config) {
        config = { ...config, ...customConfig };
      }

      if (!config) {
        return {
          success: false,
          companies: [],
          error: 'No scraper configuration found for investor',
          totalFound: 0,
        };
      }

      this.logger.log(`Scraping portfolio for: ${config.name}`);

      // Use appropriate scraping method based on config
      if (config.javascript) {
        return await this.scrapeWithPuppeteer(config);
      } else {
        return await this.scrapeWithCheerio(config);
      }
    } catch (error) {
      this.logger.error(`Error scraping portfolio: ${error.message}`);
      return {
        success: false,
        companies: [],
        error: error.message,
        totalFound: 0,
      };
    }
  }

  /**
   * Scrape using Cheerio (for static HTML sites)
   */
  private async scrapeWithCheerio(config: ScraperConfig): Promise<ScrapeResult> {
    try {
      this.logger.debug(`Fetching static HTML from: ${config.portfolioUrl}`);

      const response = await axios.get(config.portfolioUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const companies: ScrapedCompany[] = [];

      $(config.selectors.companyContainer).each((_, element) => {
        try {
          const $el = $(element);

          const name = config.selectors.companyName
            ? $el.find(config.selectors.companyName).text().trim()
            : $el.text().trim();

          if (!name) return;

          const company: ScrapedCompany = { name };

          // Extract website
          if (config.selectors.companyWebsite) {
            const website = $el.find(config.selectors.companyWebsite).attr('href');
            if (website) {
              company.website = this.normalizeUrl(website, config.baseUrl);
            }
          }

          // Extract description
          if (config.selectors.companyDescription) {
            const description = $el.find(config.selectors.companyDescription).text().trim();
            if (description) {
              company.description = description;
            }
          }

          // Extract logo
          if (config.selectors.companyLogo) {
            const logo = $el.find(config.selectors.companyLogo).attr('src');
            if (logo) {
              company.logoUrl = this.normalizeUrl(logo, config.baseUrl);
            }
          }

          companies.push(company);
        } catch (error) {
          this.logger.warn(`Error parsing company element: ${error.message}`);
        }
      });

      this.logger.log(`Found ${companies.length} companies`);

      return {
        success: true,
        companies,
        totalFound: companies.length,
      };
    } catch (error) {
      this.logger.error(`Cheerio scraping error: ${error.message}`);
      return {
        success: false,
        companies: [],
        error: error.message,
        totalFound: 0,
      };
    }
  }

  /**
   * Scrape using Puppeteer (for JavaScript-heavy sites)
   * Note: This is a placeholder - Puppeteer would need to be properly integrated
   */
  private async scrapeWithPuppeteer(config: ScraperConfig): Promise<ScrapeResult> {
    this.logger.warn('Puppeteer scraping not yet implemented - falling back to Cheerio');
    // For now, fall back to Cheerio
    // In production, this would use Puppeteer to handle dynamic content
    return this.scrapeWithCheerio(config);

    // TODO: Implement Puppeteer scraping
    // const browser = await puppeteer.launch({ headless: true });
    // const page = await browser.newPage();
    // await page.goto(config.portfolioUrl, { waitUntil: 'networkidle0' });
    // ... handle pagination, scrolling, etc.
    // await browser.close();
  }

  /**
   * Check if a string is a URL
   */
  private isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a generic scraper config for unknown investors
   */
  private createGenericConfig(url: string): ScraperConfig {
    const urlObj = new URL(url);

    return {
      name: urlObj.hostname.replace('www.', ''),
      baseUrl: `${urlObj.protocol}//${urlObj.host}`,
      portfolioUrl: url,
      javascript: false,
      selectors: {
        companyContainer: '.company, [data-company], .portfolio-item',
        companyName: 'h1, h2, h3, h4, .name, .title',
        companyWebsite: 'a[href]',
        companyDescription: 'p, .description, .tagline',
      },
      pagination: {
        type: 'none',
      },
    };
  }

  /**
   * Normalize relative URLs to absolute
   */
  private normalizeUrl(url: string, baseUrl: string): string {
    if (!url) return '';

    try {
      // If already absolute, return as-is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // Handle protocol-relative URLs
      if (url.startsWith('//')) {
        return `https:${url}`;
      }

      // Handle relative URLs
      const base = new URL(baseUrl);
      if (url.startsWith('/')) {
        return `${base.protocol}//${base.host}${url}`;
      } else {
        return `${base.protocol}//${base.host}/${url}`;
      }
    } catch {
      return url;
    }
  }
}
