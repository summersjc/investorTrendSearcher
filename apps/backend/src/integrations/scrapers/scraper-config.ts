export interface ScraperConfig {
  name: string;
  baseUrl: string;
  portfolioUrl: string;
  selectors: {
    companyContainer: string;
    companyName: string;
    companyWebsite?: string;
    companyDescription?: string;
    companyLogo?: string;
    investmentDate?: string;
    pagination?: {
      nextButton?: string;
      loadMoreButton?: string;
    };
  };
  waitFor?: {
    selector?: string;
    timeout?: number;
  };
  pagination?: {
    type: 'button' | 'scroll' | 'none';
    maxPages?: number;
  };
  javascript?: boolean; // Whether to use Puppeteer (true) or Cheerio (false)
}

// Pre-built configurations for well-known investors
export const SCRAPER_TEMPLATES: Record<string, ScraperConfig> = {
  'sequoia-capital': {
    name: 'Sequoia Capital',
    baseUrl: 'https://www.sequoiacap.com',
    portfolioUrl: 'https://www.sequoiacap.com/companies/',
    javascript: true,
    selectors: {
      companyContainer: '[data-testid="company-card"]',
      companyName: 'h3',
      companyWebsite: 'a[href]',
      companyDescription: 'p',
    },
    waitFor: {
      selector: '[data-testid="company-card"]',
      timeout: 5000,
    },
    pagination: {
      type: 'scroll',
      maxPages: 10,
    },
  },
  'andreessen-horowitz': {
    name: 'Andreessen Horowitz (a16z)',
    baseUrl: 'https://a16z.com',
    portfolioUrl: 'https://a16z.com/portfolio/',
    javascript: true,
    selectors: {
      companyContainer: '.portfolio-company',
      companyName: '.company-name',
      companyWebsite: 'a[href]',
      companyDescription: '.company-description',
    },
    waitFor: {
      selector: '.portfolio-company',
      timeout: 5000,
    },
    pagination: {
      type: 'scroll',
      maxPages: 10,
    },
  },
  benchmark: {
    name: 'Benchmark',
    baseUrl: 'https://www.benchmark.com',
    portfolioUrl: 'https://www.benchmark.com/companies',
    javascript: false,
    selectors: {
      companyContainer: '.company-item',
      companyName: 'h3',
      companyWebsite: 'a[href]',
    },
    pagination: {
      type: 'none',
    },
  },
  accel: {
    name: 'Accel',
    baseUrl: 'https://www.accel.com',
    portfolioUrl: 'https://www.accel.com/companies',
    javascript: true,
    selectors: {
      companyContainer: '[data-company]',
      companyName: '.company-name',
      companyWebsite: 'a[href]',
      companyDescription: '.company-tagline',
    },
    waitFor: {
      selector: '[data-company]',
      timeout: 5000,
    },
    pagination: {
      type: 'button',
      maxPages: 20,
    },
  },
  greylock: {
    name: 'Greylock Partners',
    baseUrl: 'https://greylock.com',
    portfolioUrl: 'https://greylock.com/portfolio/',
    javascript: true,
    selectors: {
      companyContainer: '.portfolio-item',
      companyName: 'h3',
      companyWebsite: 'a[href]',
    },
    waitFor: {
      selector: '.portfolio-item',
      timeout: 5000,
    },
    pagination: {
      type: 'scroll',
      maxPages: 10,
    },
  },
};

/**
 * Get scraper configuration by investor name or URL
 */
export function getScraperConfig(investorNameOrUrl: string): ScraperConfig | null {
  const normalized = investorNameOrUrl.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Check if it matches a template key
  for (const [key, config] of Object.entries(SCRAPER_TEMPLATES)) {
    if (normalized.includes(key) || investorNameOrUrl.includes(config.baseUrl)) {
      return config;
    }
  }

  return null;
}
