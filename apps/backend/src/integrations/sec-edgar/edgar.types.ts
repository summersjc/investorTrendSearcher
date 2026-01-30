export interface EdgarCompanyInfo {
  cik: string;
  entityType: string;
  sic: string;
  sicDescription: string;
  insiderTransactionForOwnerExists: boolean;
  insiderTransactionForIssuerExists: boolean;
  name: string;
  tickers: string[];
  exchanges: string[];
  ein?: string;
  description?: string;
  website?: string;
  investorWebsite?: string;
  category?: string;
  fiscalYearEnd?: string;
  stateOfIncorporation?: string;
  stateOfIncorporationDescription?: string;
  addresses?: {
    mailing?: EdgarAddress;
    business?: EdgarAddress;
  };
  phone?: string;
  flags?: string;
  formerNames?: Array<{
    name: string;
    from: string;
    to: string;
  }>;
  filings?: {
    recent: EdgarFilings;
    files?: Array<{
      name: string;
      filingCount: number;
      filingFrom: string;
      filingTo: string;
    }>;
  };
}

export interface EdgarAddress {
  street1?: string;
  street2?: string;
  city?: string;
  stateOrCountry?: string;
  zipCode?: string;
  stateOrCountryDescription?: string;
}

export interface EdgarFilings {
  accessionNumber: string[];
  filingDate: string[];
  reportDate: string[];
  acceptanceDateTime: string[];
  act: string[];
  form: string[];
  fileNumber: string[];
  filmNumber: string[];
  items: string[];
  size: number[];
  isXBRL: number[];
  isInlineXBRL: number[];
  primaryDocument: string[];
  primaryDocDescription: string[];
}

export interface EdgarInsiderTransaction {
  accessionNumber: string;
  filingDate: string;
  transactionDate?: string;
  reportingOwner: {
    name: string;
    cik: string;
    address?: EdgarAddress;
    relationship?: {
      isDirector: boolean;
      isOfficer: boolean;
      isTenPercentOwner: boolean;
      isOther: boolean;
      officerTitle?: string;
    };
  };
  transactions?: Array<{
    securityTitle: string;
    transactionDate: string;
    transactionCode: string;
    transactionShares?: number;
    transactionPricePerShare?: number;
    transactionAcquiredDisposed?: 'A' | 'D';
    sharesOwnedFollowing?: number;
    directIndirect?: 'D' | 'I';
  }>;
}

export interface EdgarFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string;
  form: string;
  fileNumber: string;
  filmNumber: string;
  items: string;
  size: number;
  isXBRL: boolean;
  isInlineXBRL: boolean;
  primaryDocument: string;
  primaryDocDescription: string;
  documentUrl: string;
}
