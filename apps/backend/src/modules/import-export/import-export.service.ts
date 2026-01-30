import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InvestorService } from '../investor/investor.service';
import { CompanyService } from '../company/company.service';
import { InvestmentService } from '../investment/investment.service';

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export interface ExportData {
  investors?: any[];
  companies?: any[];
  investments?: any[];
  exportedAt: string;
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly investorService: InvestorService,
    private readonly companyService: CompanyService,
    private readonly investmentService: InvestmentService,
  ) {}

  /**
   * Import investors from JSON array
   */
  async importInvestors(investors: any[]): Promise<ImportResult> {
    this.logger.log(`Importing ${investors.length} investors`);

    let success = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string; data: any }> = [];

    for (let i = 0; i < investors.length; i++) {
      try {
        const investor = investors[i];
        await this.investorService.create({
          name: investor.name,
          type: investor.type,
          description: investor.description,
          website: investor.website,
          city: investor.city,
          state: investor.state,
          country: investor.country,
          foundedYear: investor.foundedYear ? parseInt(investor.foundedYear) : undefined,
          aum: investor.aum ? parseFloat(investor.aum) : undefined,
          teamSize: investor.teamSize ? parseInt(investor.teamSize) : undefined,
          linkedinUrl: investor.linkedinUrl,
          twitterUrl: investor.twitterUrl,
        });
        success++;
      } catch (error) {
        failed++;
        errors.push({
          row: i + 1,
          error: error.message,
          data: investors[i],
        });
        this.logger.error(`Failed to import investor row ${i + 1}: ${error.message}`);
      }
    }

    this.logger.log(`Import complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  }

  /**
   * Import companies from JSON array
   */
  async importCompanies(companies: any[]): Promise<ImportResult> {
    this.logger.log(`Importing ${companies.length} companies`);

    let success = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string; data: any }> = [];

    for (let i = 0; i < companies.length; i++) {
      try {
        const company = companies[i];
        await this.companyService.create({
          name: company.name,
          type: company.type,
          stage: company.stage,
          description: company.description,
          website: company.website,
          headquarters: company.headquarters,
          city: company.city,
          state: company.state,
          country: company.country,
          industry: company.industry,
          sector: company.sector,
          foundedYear: company.foundedYear ? parseInt(company.foundedYear) : undefined,
          ticker: company.ticker,
          exchange: company.exchange,
          linkedinUrl: company.linkedinUrl,
          twitterUrl: company.twitterUrl,
        });
        success++;
      } catch (error) {
        failed++;
        errors.push({
          row: i + 1,
          error: error.message,
          data: companies[i],
        });
        this.logger.error(`Failed to import company row ${i + 1}: ${error.message}`);
      }
    }

    this.logger.log(`Import complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  }

  /**
   * Import investments from JSON array
   */
  async importInvestments(investments: any[]): Promise<ImportResult> {
    this.logger.log(`Importing ${investments.length} investments`);

    let success = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string; data: any }> = [];

    for (let i = 0; i < investments.length; i++) {
      try {
        const investment = investments[i];

        // Find investor by name or ID
        let investorId = investment.investorId;
        if (!investorId && investment.investorName) {
          const investor = await this.prisma.investor.findFirst({
            where: { name: { contains: investment.investorName, mode: 'insensitive' } },
          });
          if (investor) investorId = investor.id;
        }

        // Find company by name or ID
        let companyId = investment.companyId;
        if (!companyId && investment.companyName) {
          const company = await this.prisma.company.findFirst({
            where: { name: { contains: investment.companyName, mode: 'insensitive' } },
          });
          if (company) companyId = company.id;
        }

        if (!investorId || !companyId) {
          throw new Error('Investor or company not found');
        }

        await this.investmentService.create({
          investorId,
          companyId,
          amount: investment.amount ? parseFloat(investment.amount) : undefined,
          stage: investment.stage,
          status: investment.status,
          investedAt: investment.investedAt ? new Date(investment.investedAt) : undefined,
          exitedAt: investment.exitedAt ? new Date(investment.exitedAt) : undefined,
          leadInvestor: investment.leadInvestor === true || investment.leadInvestor === 'true',
          ownership: investment.ownership ? parseFloat(investment.ownership) : undefined,
          notes: investment.notes,
        });
        success++;
      } catch (error) {
        failed++;
        errors.push({
          row: i + 1,
          error: error.message,
          data: investments[i],
        });
        this.logger.error(`Failed to import investment row ${i + 1}: ${error.message}`);
      }
    }

    this.logger.log(`Import complete: ${success} success, ${failed} failed`);
    return { success, failed, errors };
  }

  /**
   * Export all data as JSON
   */
  async exportAll(): Promise<ExportData> {
    this.logger.log('Exporting all data');

    const [investors, companies, investments] = await Promise.all([
      this.prisma.investor.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.company.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.investment.findMany({
        include: {
          investor: { select: { name: true } },
          company: { select: { name: true } },
        },
        orderBy: { investedAt: 'desc' },
      }),
    ]);

    return {
      investors,
      companies,
      investments,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Export investors as JSON
   */
  async exportInvestors(): Promise<any[]> {
    return this.prisma.investor.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Export companies as JSON
   */
  async exportCompanies(): Promise<any[]> {
    return this.prisma.company.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Export investments as JSON
   */
  async exportInvestments(): Promise<any[]> {
    return this.prisma.investment.findMany({
      include: {
        investor: { select: { name: true, slug: true } },
        company: { select: { name: true, slug: true } },
      },
      orderBy: { investedAt: 'desc' },
    });
  }

  /**
   * Convert JSON data to CSV format
   */
  csvStringify(data: any[]): string {
    if (data.length === 0) {
      return '';
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];

    // Convert each object to CSV row
    for (const item of data) {
      const values = headers.map((header) => {
        const value = item[header];
        if (value === null || value === undefined) {
          return '';
        }
        // Escape quotes and wrap in quotes if contains comma or quote
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      rows.push(values.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Parse CSV string to JSON array
   */
  csvParse(csvString: string): any[] {
    const lines = csvString.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]);
    const results: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const obj: any = {};

      headers.forEach((header, index) => {
        obj[header] = values[index] || null;
      });

      results.push(obj);
    }

    return results;
  }

  /**
   * Parse a single CSV line, handling quotes
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }
}
