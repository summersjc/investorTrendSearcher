import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface InvestorConnectionResult {
  investor: any;
  relatedInvestor: any;
  sharedCompanies: any[];
  strength: number;
}

export interface CompanyConnectionResult {
  company: any;
  relatedCompany: any;
  sharedInvestors: any[];
  connectionType: string;
}

@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Discover and create investor connections based on shared investments
   */
  async discoverInvestorConnections(): Promise<number> {
    this.logger.log('Discovering investor connections...');

    // Get all investors
    const investors = await this.prisma.investor.findMany({
      include: {
        portfolioCompanies: {
          select: { companyId: true },
        },
      },
    });

    let connectionsCreated = 0;

    // Compare each investor with every other investor
    for (let i = 0; i < investors.length; i++) {
      for (let j = i + 1; j < investors.length; j++) {
        const investor1 = investors[i];
        const investor2 = investors[j];

        // Find shared companies
        const companies1 = new Set(investor1.portfolioCompanies.map((p) => p.companyId));
        const companies2 = new Set(investor2.portfolioCompanies.map((p) => p.companyId));

        const sharedCompanies = Array.from(companies1).filter((id) => companies2.has(id));

        if (sharedCompanies.length > 0) {
          // Create or update connection
          await this.prisma.investorConnection.upsert({
            where: {
              investorId_relatedInvestorId: {
                investorId: investor1.id,
                relatedInvestorId: investor2.id,
              },
            },
            create: {
              investorId: investor1.id,
              relatedInvestorId: investor2.id,
              strength: sharedCompanies.length,
              sharedCompanies,
            },
            update: {
              strength: sharedCompanies.length,
              sharedCompanies,
            },
          });

          // Create reverse connection
          await this.prisma.investorConnection.upsert({
            where: {
              investorId_relatedInvestorId: {
                investorId: investor2.id,
                relatedInvestorId: investor1.id,
              },
            },
            create: {
              investorId: investor2.id,
              relatedInvestorId: investor1.id,
              strength: sharedCompanies.length,
              sharedCompanies,
            },
            update: {
              strength: sharedCompanies.length,
              sharedCompanies,
            },
          });

          connectionsCreated += 2;
        }
      }
    }

    this.logger.log(`Created/updated ${connectionsCreated} investor connections`);
    return connectionsCreated;
  }

  /**
   * Get investor network (co-investors)
   */
  async getInvestorNetwork(investorId: string, minStrength: number = 1): Promise<InvestorConnectionResult[]> {
    const connections = await this.prisma.investorConnection.findMany({
      where: {
        investorId,
        strength: {
          gte: minStrength,
        },
      },
      include: {
        investor: true,
        relatedInvestor: true,
      },
      orderBy: {
        strength: 'desc',
      },
    });

    const results: InvestorConnectionResult[] = [];

    for (const connection of connections) {
      // Get shared companies
      const sharedCompanies = await this.prisma.company.findMany({
        where: {
          id: {
            in: connection.sharedCompanies,
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          industry: true,
        },
      });

      results.push({
        investor: connection.investor,
        relatedInvestor: connection.relatedInvestor,
        sharedCompanies,
        strength: connection.strength,
      });
    }

    return results;
  }

  /**
   * Get company network (companies with shared investors)
   */
  async getCompanyNetwork(companyId: string): Promise<CompanyConnectionResult[]> {
    // Get investors in this company
    const companyInvestors = await this.prisma.portfolioCompany.findMany({
      where: { companyId },
      select: { investorId: true },
    });

    const investorIds = companyInvestors.map((p) => p.investorId);

    // Find other companies with these investors
    const relatedPortfolios = await this.prisma.portfolioCompany.findMany({
      where: {
        investorId: {
          in: investorIds,
        },
        companyId: {
          not: companyId,
        },
      },
      include: {
        company: true,
        investor: true,
      },
    });

    // Group by company
    const companyMap = new Map<string, { company: any; investors: any[] }>();

    for (const portfolio of relatedPortfolios) {
      const existing = companyMap.get(portfolio.companyId);
      if (existing) {
        existing.investors.push(portfolio.investor);
      } else {
        companyMap.set(portfolio.companyId, {
          company: portfolio.company,
          investors: [portfolio.investor],
        });
      }
    }

    // Convert to results
    const results: CompanyConnectionResult[] = [];
    const sourceCompany = await this.prisma.company.findUnique({ where: { id: companyId } });

    for (const [, value] of companyMap) {
      results.push({
        company: sourceCompany,
        relatedCompany: value.company,
        sharedInvestors: value.investors,
        connectionType: 'SHARED_INVESTORS',
      });
    }

    // Sort by number of shared investors
    results.sort((a, b) => b.sharedInvestors.length - a.sharedInvestors.length);

    return results;
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<{
    totalInvestorConnections: number;
    avgConnectionsPerInvestor: number;
    strongestConnections: Array<{
      investor1: string;
      investor2: string;
      strength: number;
    }>;
  }> {
    const connections = await this.prisma.investorConnection.findMany({
      include: {
        investor: { select: { name: true } },
        relatedInvestor: { select: { name: true } },
      },
      orderBy: {
        strength: 'desc',
      },
      take: 10,
    });

    const investorCount = await this.prisma.investor.count();

    return {
      totalInvestorConnections: connections.length,
      avgConnectionsPerInvestor: investorCount > 0 ? connections.length / investorCount : 0,
      strongestConnections: connections.slice(0, 5).map((c) => ({
        investor1: c.investor.name,
        investor2: c.relatedInvestor.name,
        strength: c.strength,
      })),
    };
  }

  /**
   * Find potential co-investors for a company
   * (Investors who frequently invest with the company's existing investors)
   */
  async findPotentialCoInvestors(companyId: string, limit: number = 10): Promise<any[]> {
    // Get current investors
    const currentInvestors = await this.prisma.portfolioCompany.findMany({
      where: { companyId },
      select: { investorId: true },
    });

    const investorIds = currentInvestors.map((p) => p.investorId);

    if (investorIds.length === 0) {
      return [];
    }

    // Find their connections
    const connections = await this.prisma.investorConnection.findMany({
      where: {
        investorId: {
          in: investorIds,
        },
      },
      include: {
        relatedInvestor: true,
      },
      orderBy: {
        strength: 'desc',
      },
    });

    // Aggregate and filter out existing investors
    const potentialMap = new Map<string, { investor: any; totalStrength: number }>();

    for (const connection of connections) {
      const relatedId = connection.relatedInvestorId;

      // Skip if already invested
      if (investorIds.includes(relatedId)) {
        continue;
      }

      const existing = potentialMap.get(relatedId);
      if (existing) {
        existing.totalStrength += connection.strength;
      } else {
        potentialMap.set(relatedId, {
          investor: connection.relatedInvestor,
          totalStrength: connection.strength,
        });
      }
    }

    // Convert to array and sort
    const results = Array.from(potentialMap.values())
      .sort((a, b) => b.totalStrength - a.totalStrength)
      .slice(0, limit);

    return results;
  }
}
