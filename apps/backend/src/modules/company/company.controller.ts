import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('companies')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 409, description: 'Company already exists' })
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiQuery({ name: 'type', required: false, example: 'PUBLIC' })
  @ApiQuery({ name: 'stage', required: false, example: 'GROWTH' })
  @ApiQuery({ name: 'industry', required: false, example: 'Technology' })
  @ApiQuery({ name: 'search', required: false, example: 'Apple' })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'List of companies' })
  async findAll(
    @Query('type') type?: string,
    @Query('stage') stage?: string,
    @Query('industry') industry?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.companyService.findAll({
      type,
      stage,
      industry,
      search,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get company by slug' })
  @ApiParam({ name: 'slug', description: 'Company slug', example: 'apple-inc' })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.companyService.findBySlug(slug);
  }

  @Get('ticker/:ticker')
  @ApiOperation({ summary: 'Get company by ticker symbol' })
  @ApiParam({ name: 'ticker', description: 'Stock ticker', example: 'AAPL' })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findByTicker(@Param('ticker') ticker: string) {
    return this.companyService.findByTicker(ticker);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 204, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async remove(@Param('id') id: string) {
    await this.companyService.remove(id);
  }

  @Post(':id/enrich')
  @ApiOperation({ summary: 'Enrich company data from free APIs' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company enriched successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async enrich(@Param('id') id: string) {
    return this.companyService.enrichCompany(id);
  }

  @Get(':id/funding')
  @ApiOperation({ summary: 'Get company funding history' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Funding history retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getFundingHistory(@Param('id') id: string) {
    return this.companyService.getFundingHistory(id);
  }

  @Get(':id/investors')
  @ApiOperation({ summary: 'Get company investors' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Investors retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getInvestors(@Param('id') id: string) {
    return this.companyService.getInvestors(id);
  }

  @Get(':id/stale')
  @ApiOperation({ summary: 'Check if company data is stale' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Staleness status' })
  async isDataStale(@Param('id') id: string) {
    const isStale = await this.companyService.isDataStale(id);
    return { isStale };
  }
}
