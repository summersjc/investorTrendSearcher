import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { Investment } from '@prisma/client';

@Injectable()
export class InvestmentService {
  private readonly logger = new Logger(InvestmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new investment
   */
  async create(createInvestmentDto: CreateInvestmentDto): Promise<Investment> {
    this.logger.log(
      `Creating investment: ${createInvestmentDto.investorId} -> ${createInvestmentDto.companyId}`,
    );

    // Verify investor and company exist
    const [investor, company] = await Promise.all([
      this.prisma.investor.findUnique({ where: { id: createInvestmentDto.investorId } }),
      this.prisma.company.findUnique({ where: { id: createInvestmentDto.companyId } }),
    ]);

    if (!investor) {
      throw new NotFoundException(`Investor not found: ${createInvestmentDto.investorId}`);
    }

    if (!company) {
      throw new NotFoundException(`Company not found: ${createInvestmentDto.companyId}`);
    }

    const investment = await this.prisma.investment.create({
      data: {
        ...createInvestmentDto,
        dataSource: 'MANUAL',
      },
      include: {
        investor: true,
        company: true,
      },
    });

    // Also create/update portfolio company entry
    await this.prisma.portfolioCompany.upsert({
      where: {
        investorId_companyId: {
          investorId: createInvestmentDto.investorId,
          companyId: createInvestmentDto.companyId,
        },
      },
      create: {
        investorId: createInvestmentDto.investorId,
        companyId: createInvestmentDto.companyId,
        status: createInvestmentDto.status || 'ACTIVE',
      },
      update: {
        status: createInvestmentDto.status || 'ACTIVE',
      },
    });

    this.logger.log(`Created investment: ${investment.id}`);
    return investment;
  }

  /**
   * Find all investments with optional filtering
   */
  async findAll(params?: {
    investorId?: string;
    companyId?: string;
    stage?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<{ investments: Investment[]; total: number }> {
    const where: any = {};

    if (params?.investorId) {
      where.investorId = params.investorId;
    }

    if (params?.companyId) {
      where.companyId = params.companyId;
    }

    if (params?.stage) {
      where.stage = params.stage;
    }

    if (params?.status) {
      where.status = params.status;
    }

    const [investments, total] = await Promise.all([
      this.prisma.investment.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 50,
        include: {
          investor: true,
          company: true,
        },
        orderBy: { investedAt: 'desc' },
      }),
      this.prisma.investment.count({ where }),
    ]);

    return { investments, total };
  }

  /**
   * Find investment by ID
   */
  async findOne(id: string): Promise<Investment> {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: {
        investor: true,
        company: true,
      },
    });

    if (!investment) {
      throw new NotFoundException(`Investment not found: ${id}`);
    }

    return investment;
  }

  /**
   * Update investment
   */
  async update(id: string, updateInvestmentDto: UpdateInvestmentDto): Promise<Investment> {
    this.logger.log(`Updating investment: ${id}`);

    // Check if investment exists
    await this.findOne(id);

    const investment = await this.prisma.investment.update({
      where: { id },
      data: updateInvestmentDto,
      include: {
        investor: true,
        company: true,
      },
    });

    this.logger.log(`Updated investment: ${id}`);
    return investment;
  }

  /**
   * Delete investment
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting investment: ${id}`);

    const investment = await this.findOne(id);

    await this.prisma.investment.delete({
      where: { id },
    });

    // Check if there are other investments for this investor-company pair
    const otherInvestments = await this.prisma.investment.count({
      where: {
        investorId: investment.investorId,
        companyId: investment.companyId,
      },
    });

    // If no other investments, remove portfolio entry
    if (otherInvestments === 0) {
      await this.prisma.portfolioCompany.deleteMany({
        where: {
          investorId: investment.investorId,
          companyId: investment.companyId,
        },
      });
    }

    this.logger.log(`Deleted investment: ${id}`);
  }

  /**
   * Get investment statistics
   */
  async getStatistics(): Promise<{
    totalInvestments: number;
    totalAmount: number;
    byStage: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const [investments, stageStats, statusStats] = await Promise.all([
      this.prisma.investment.findMany({
        select: { amount: true },
      }),
      this.prisma.investment.groupBy({
        by: ['stage'],
        _count: true,
      }),
      this.prisma.investment.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const totalAmount = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const byStage: Record<string, number> = {};
    stageStats.forEach((stat) => {
      byStage[stat.stage] = stat._count;
    });

    const byStatus: Record<string, number> = {};
    statusStats.forEach((stat) => {
      byStatus[stat.status] = stat._count;
    });

    return {
      totalInvestments: investments.length,
      totalAmount,
      byStage,
      byStatus,
    };
  }
}
