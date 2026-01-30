import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AggregationService } from '../aggregation/aggregation.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from '@prisma/client';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregationService: AggregationService,
  ) {}

  /**
   * Create a new company
   */
  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    this.logger.log(`Creating company: ${createCompanyDto.name}`);

    const slug = this.generateSlug(createCompanyDto.name);

    // Check if company with same slug already exists
    const existing = await this.prisma.company.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Company with name "${createCompanyDto.name}" already exists`);
    }

    const company = await this.prisma.company.create({
      data: {
        ...createCompanyDto,
        slug,
        dataSource: 'MANUAL',
      },
    });

    this.logger.log(`Created company: ${company.id}`);

    // Auto-enrich if ticker is provided
    if (company.ticker) {
      this.logger.log(`Auto-enriching company with ticker: ${company.ticker}`);
      this.enrichCompany(company.id).catch((error) => {
        this.logger.error(`Auto-enrichment failed: ${error.message}`);
      });
    }

    return company;
  }

  /**
   * Find all companies with optional filtering
   */
  async findAll(params?: {
    type?: string;
    stage?: string;
    industry?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ companies: Company[]; total: number }> {
    const where: any = {};

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.stage) {
      where.stage = params.stage;
    }

    if (params?.industry) {
      where.industry = { contains: params.industry, mode: 'insensitive' };
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { ticker: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 50,
        orderBy: { name: 'asc' },
      }),
      this.prisma.company.count({ where }),
    ]);

    return { companies, total };
  }

  /**
   * Find company by ID
   */
  async findOne(id: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        investments: {
          include: {
            investor: true,
          },
        },
        portfolioEntries: {
          include: {
            investor: true,
          },
        },
        fundingRounds: true,
        marketData: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 days
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company not found: ${id}`);
    }

    return company;
  }

  /**
   * Find company by slug
   */
  async findBySlug(slug: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        investments: {
          include: {
            investor: true,
          },
        },
        fundingRounds: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Company not found: ${slug}`);
    }

    return company;
  }

  /**
   * Find company by ticker symbol
   */
  async findByTicker(ticker: string): Promise<Company | null> {
    return this.prisma.company.findFirst({
      where: { ticker: { equals: ticker, mode: 'insensitive' } },
    });
  }

  /**
   * Update company
   */
  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    this.logger.log(`Updating company: ${id}`);

    // Check if company exists
    await this.findOne(id);

    // If name is being updated, generate new slug
    const updates: any = { ...updateCompanyDto };
    if (updateCompanyDto.name) {
      updates.slug = this.generateSlug(updateCompanyDto.name);
    }

    const company = await this.prisma.company.update({
      where: { id },
      data: updates,
    });

    this.logger.log(`Updated company: ${id}`);
    return company;
  }

  /**
   * Delete company
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting company: ${id}`);

    // Check if company exists
    await this.findOne(id);

    await this.prisma.company.delete({
      where: { id },
    });

    this.logger.log(`Deleted company: ${id}`);
  }

  /**
   * Enrich company with data from free APIs
   */
  async enrichCompany(id: string): Promise<Company> {
    this.logger.log(`Enriching company: ${id}`);

    const company = await this.findOne(id);

    try {
      const enrichedData = await this.aggregationService.enrichCompany(id, company.ticker || undefined);
      await this.aggregationService.saveEnrichedData(id, enrichedData);

      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Failed to enrich company: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get company funding history
   */
  async getFundingHistory(id: string): Promise<{
    company: Company;
    fundingRounds: any[];
    totalRaised: number;
    latestValuation: number | null;
  }> {
    const company = await this.findOne(id);

    const fundingRounds = await this.prisma.fundingRound.findMany({
      where: { companyId: id },
      include: {
        investors: true,
      },
      orderBy: { announcedAt: 'desc' },
    });

    const totalRaised = fundingRounds.reduce((sum, round) => sum + (round.amount || 0), 0);
    const latestValuation = fundingRounds[0]?.valuation || null;

    return {
      company,
      fundingRounds,
      totalRaised,
      latestValuation,
    };
  }

  /**
   * Get company investors
   */
  async getInvestors(id: string): Promise<{
    company: Company;
    investors: any[];
    totalInvestors: number;
  }> {
    const company = await this.findOne(id);

    const investors = await this.prisma.investment.findMany({
      where: { companyId: id },
      include: {
        investor: true,
      },
      orderBy: { investedAt: 'desc' },
    });

    return {
      company,
      investors,
      totalInvestors: investors.length,
    };
  }

  /**
   * Check if company data is stale
   */
  async isDataStale(id: string): Promise<boolean> {
    return this.aggregationService.isCompanyDataStale(id);
  }

  /**
   * Generate URL-friendly slug from company name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
