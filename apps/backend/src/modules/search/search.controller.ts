import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Unified search across investors and companies' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'Sequoia' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Maximum results',
  })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(@Query('q') query: string, @Query('limit') limit?: string) {
    const results = await this.searchService.search(query, limit ? parseInt(limit) : 20);

    return {
      query,
      total: results.length,
      results,
    };
  }

  @Get('investors')
  @ApiOperation({ summary: 'Search only investors' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'Sequoia' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Investor search results' })
  async searchInvestors(@Query('q') query: string, @Query('limit') limit?: string) {
    const results = await this.searchService.searchInvestors(
      query,
      limit ? parseInt(limit) : 20,
    );

    return {
      query,
      total: results.length,
      results,
    };
  }

  @Get('companies')
  @ApiOperation({ summary: 'Search only companies' })
  @ApiQuery({ name: 'q', description: 'Search query', example: 'Apple' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Company search results' })
  async searchCompanies(@Query('q') query: string, @Query('limit') limit?: string) {
    const results = await this.searchService.searchCompanies(
      query,
      limit ? parseInt(limit) : 20,
    );

    return {
      query,
      total: results.length,
      results,
    };
  }
}
