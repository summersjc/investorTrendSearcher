import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';

@ApiTags('connections')
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('discover')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Discover investor connections based on shared investments' })
  @ApiResponse({ status: 200, description: 'Connections discovered successfully' })
  async discoverConnections() {
    const count = await this.connectionsService.discoverInvestorConnections();
    return {
      message: 'Connection discovery complete',
      connectionsCreated: count,
    };
  }

  @Get('investors/:id/network')
  @ApiOperation({ summary: 'Get investor network (co-investors)' })
  @ApiParam({ name: 'id', description: 'Investor ID' })
  @ApiQuery({
    name: 'minStrength',
    required: false,
    type: Number,
    example: 1,
    description: 'Minimum connection strength',
  })
  @ApiResponse({ status: 200, description: 'Investor network retrieved' })
  async getInvestorNetwork(
    @Param('id') id: string,
    @Query('minStrength') minStrength?: string,
  ) {
    return this.connectionsService.getInvestorNetwork(
      id,
      minStrength ? parseInt(minStrength) : 1,
    );
  }

  @Get('companies/:id/network')
  @ApiOperation({ summary: 'Get company network (companies with shared investors)' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company network retrieved' })
  async getCompanyNetwork(@Param('id') id: string) {
    return this.connectionsService.getCompanyNetwork(id);
  }

  @Get('companies/:id/potential-investors')
  @ApiOperation({ summary: 'Find potential co-investors for a company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Maximum number of results',
  })
  @ApiResponse({ status: 200, description: 'Potential co-investors found' })
  async findPotentialCoInvestors(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.connectionsService.findPotentialCoInvestors(
      id,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get network statistics' })
  @ApiResponse({ status: 200, description: 'Network statistics' })
  async getNetworkStats() {
    return this.connectionsService.getNetworkStats();
  }
}
