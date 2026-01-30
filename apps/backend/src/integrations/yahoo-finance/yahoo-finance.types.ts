export interface YahooQuote {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageDailyVolume10Day?: number;
  averageDailyVolume3Month?: number;
  trailingPE?: number;
  forwardPE?: number;
  dividendRate?: number;
  dividendYield?: number;
  beta?: number;
  trailingAnnualDividendRate?: number;
  trailingAnnualDividendYield?: number;
  currency?: string;
  exchange?: string;
  quoteType?: string;
  marketState?: string;
}

export interface YahooHistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export interface YahooFinancials {
  symbol: string;
  revenue?: number;
  revenueGrowth?: number;
  grossProfit?: number;
  ebitda?: number;
  netIncome?: number;
  eps?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  totalDebt?: number;
  cash?: number;
  operatingCashFlow?: number;
  freeCashFlow?: number;
}

export interface YahooCompanyProfile {
  symbol: string;
  name: string;
  description?: string;
  sector?: string;
  industry?: string;
  website?: string;
  employees?: number;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
}
