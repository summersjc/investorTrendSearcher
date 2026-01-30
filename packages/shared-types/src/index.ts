// Enums
export enum InvestorType {
  VC_FIRM = 'VC_FIRM',
  ANGEL = 'ANGEL',
  PE_FIRM = 'PE_FIRM',
  CORPORATE_VC = 'CORPORATE_VC',
  ACCELERATOR = 'ACCELERATOR',
  FAMILY_OFFICE = 'FAMILY_OFFICE',
  HEDGE_FUND = 'HEDGE_FUND',
  INDIVIDUAL = 'INDIVIDUAL',
  OTHER = 'OTHER',
}

export enum CompanyType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ACQUIRED = 'ACQUIRED',
  DEFUNCT = 'DEFUNCT',
}

export enum CompanyStage {
  PRE_SEED = 'PRE_SEED',
  SEED = 'SEED',
  SERIES_A = 'SERIES_A',
  SERIES_B = 'SERIES_B',
  SERIES_C = 'SERIES_C',
  SERIES_D_PLUS = 'SERIES_D_PLUS',
  GROWTH = 'GROWTH',
  PUBLIC = 'PUBLIC',
}

export enum InvestmentStage {
  PRE_SEED = 'PRE_SEED',
  SEED = 'SEED',
  SERIES_A = 'SERIES_A',
  SERIES_B = 'SERIES_B',
  SERIES_C = 'SERIES_C',
  SERIES_D_PLUS = 'SERIES_D_PLUS',
  GROWTH = 'GROWTH',
  IPO = 'IPO',
  SECONDARY = 'SECONDARY',
  DEBT = 'DEBT',
  GRANT = 'GRANT',
  OTHER = 'OTHER',
}

export enum InvestmentStatus {
  ACTIVE = 'ACTIVE',
  EXITED = 'EXITED',
  ACQUIRED = 'ACQUIRED',
  IPO = 'IPO',
  DEFUNCT = 'DEFUNCT',
  UNKNOWN = 'UNKNOWN',
}

export enum DataSource {
  MANUAL = 'MANUAL',
  SEC_EDGAR = 'SEC_EDGAR',
  YAHOO_FINANCE = 'YAHOO_FINANCE',
  OPENCORPORATES = 'OPENCORPORATES',
  WIKIDATA = 'WIKIDATA',
  NEWSAPI = 'NEWSAPI',
  WEB_SCRAPING = 'WEB_SCRAPING',
  API = 'API',
}

// DTOs (Data Transfer Objects)
export interface CreateInvestorDto {
  name: string;
  type: InvestorType;
  description?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  foundedYear?: number;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface UpdateInvestorDto {
  name?: string;
  type?: InvestorType;
  description?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  foundedYear?: number;
  aum?: number;
  teamSize?: number;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface CreateCompanyDto {
  name: string;
  type: CompanyType;
  stage?: CompanyStage;
  description?: string;
  website?: string;
  headquarters?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  sector?: string;
  foundedYear?: number;
  ticker?: string;
  exchange?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  type?: CompanyType;
  stage?: CompanyStage;
  description?: string;
  website?: string;
  headquarters?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  sector?: string;
  foundedYear?: number;
  employeeCount?: number;
  ticker?: string;
  exchange?: string;
  marketCap?: number;
  revenue?: number;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface CreateInvestmentDto {
  investorId: string;
  companyId: string;
  amount?: number;
  stage: InvestmentStage;
  status?: InvestmentStatus;
  investedAt?: Date;
  leadInvestor?: boolean;
  ownership?: number;
  notes?: string;
}

export interface SearchResultDto {
  type: 'investor' | 'company';
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  metadata?: any;
}
