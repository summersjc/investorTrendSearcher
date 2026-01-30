import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { Investor } from '@prisma/client';
import { WikidataService } from '../../integrations/wikidata/wikidata.service';

@Injectable()
export class InvestorService {
  private readonly logger = new Logger(InvestorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wikidataService: WikidataService,
  ) {}

  /**
   * Create a new investor
   */
  async create(createInvestorDto: CreateInvestorDto): Promise<Investor> {
    this.logger.log(`Creating investor: ${createInvestorDto.name}`);

    const slug = this.generateSlug(createInvestorDto.name);

    // Check if investor with same slug already exists
    const existing = await this.prisma.investor.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Investor with name "${createInvestorDto.name}" already exists`);
    }

    const investor = await this.prisma.investor.create({
      data: {
        ...createInvestorDto,
        slug,
        dataSource: 'MANUAL',
      },
    });

    this.logger.log(`Created investor: ${investor.id}`);
    return investor;
  }

  /**
   * Find all investors with optional filtering
   */
  async findAll(params?: {
    type?: string;
    country?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ investors: Investor[]; total: number }> {
    const where: any = {};

    if (params?.type) {
      where.type = params.type;
    }

    if (params?.country) {
      where.country = params.country;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [investors, total] = await Promise.all([
      this.prisma.investor.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 50,
        orderBy: { name: 'asc' },
      }),
      this.prisma.investor.count({ where }),
    ]);

    return { investors, total };
  }

  /**
   * Find investor by ID
   */
  async findOne(id: string): Promise<Investor> {
    const investor = await this.prisma.investor.findUnique({
      where: { id },
      include: {
        investments: {
          include: {
            company: true,
          },
        },
        portfolioCompanies: {
          include: {
            company: true,
          },
        },
        connections: {
          include: {
            relatedInvestor: true,
          },
        },
      },
    });

    if (!investor) {
      throw new NotFoundException(`Investor not found: ${id}`);
    }

    return investor;
  }

  /**
   * Find investor by slug
   */
  async findBySlug(slug: string): Promise<Investor> {
    const investor = await this.prisma.investor.findUnique({
      where: { slug },
      include: {
        investments: {
          include: {
            company: true,
          },
        },
        portfolioCompanies: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!investor) {
      throw new NotFoundException(`Investor not found: ${slug}`);
    }

    return investor;
  }

  /**
   * Update investor
   */
  async update(id: string, updateInvestorDto: UpdateInvestorDto): Promise<Investor> {
    this.logger.log(`Updating investor: ${id}`);

    // Check if investor exists
    await this.findOne(id);

    // If name is being updated, generate new slug
    const updates: any = { ...updateInvestorDto };
    if (updateInvestorDto.name) {
      updates.slug = this.generateSlug(updateInvestorDto.name);
    }

    const investor = await this.prisma.investor.update({
      where: { id },
      data: updates,
    });

    this.logger.log(`Updated investor: ${id}`);
    return investor;
  }

  /**
   * Delete investor
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting investor: ${id}`);

    // Check if investor exists
    await this.findOne(id);

    await this.prisma.investor.delete({
      where: { id },
    });

    this.logger.log(`Deleted investor: ${id}`);
  }

  /**
   * Enrich investor with data from Wikidata
   */
  async enrichFromWikidata(id: string): Promise<Investor> {
    this.logger.log(`Enriching investor from Wikidata: ${id}`);

    const investor = await this.findOne(id);

    try {
      const wikidataEntity = await this.wikidataService.getCompanyByName(investor.name);

      if (wikidataEntity) {
        const updates: any = {
          rawData: {
            ...(investor.rawData as any),
            wikidata: wikidataEntity,
          },
          lastFetched: new Date(),
        };

        // Update fields if they're empty
        if (!investor.description && wikidataEntity.description) {
          updates.description = wikidataEntity.description;
        }
        if (!investor.website && wikidataEntity.website) {
          updates.website = wikidataEntity.website;
        }
        if (!investor.foundedYear && wikidataEntity.foundedDate) {
          const year = parseInt(wikidataEntity.foundedDate.substring(1, 5));
          if (!isNaN(year)) {
            updates.foundedYear = year;
          }
        }

        return await this.prisma.investor.update({
          where: { id },
          data: updates,
        });
      }

      this.logger.warn(`No Wikidata entity found for: ${investor.name}`);
      return investor;
    } catch (error) {
      this.logger.error(`Failed to enrich investor from Wikidata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get investor portfolio with statistics
   */
  async getPortfolio(id: string): Promise<{
    investor: Investor;
    portfolio: any[];
    stats: {
      totalCompanies: number;
      activeInvestments: number;
      exits: number;
      totalInvested: number;
    };
  }> {
    const investor = await this.findOne(id);

    const portfolio = await this.prisma.portfolioCompany.findMany({
      where: { investorId: id },
      include: {
        company: true,
      },
    });

    const investments = await this.prisma.investment.findMany({
      where: { investorId: id },
    });

    const stats = {
      totalCompanies: portfolio.length,
      activeInvestments: portfolio.filter((p) => p.status === 'ACTIVE').length,
      exits: portfolio.filter((p) => p.status === 'EXITED' || p.status === 'IPO').length,
      totalInvested: investments.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    };

    return { investor, portfolio, stats };
  }

  /**
   * Generate URL-friendly slug from investor name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
