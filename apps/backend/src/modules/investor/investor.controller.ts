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
import { InvestorService } from './investor.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';

@ApiTags('investors')
@Controller('investors')
export class InvestorController {
  constructor(private readonly investorService: InvestorService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new investor' })
  @ApiResponse({ status: 201, description: 'Investor created successfully' })
  @ApiResponse({ status: 409, description: 'Investor already exists' })
  async create(@Body() createInvestorDto: CreateInvestorDto) {
    return this.investorService.create(createInvestorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all investors' })
  @ApiQuery({ name: 'type', required: false, example: 'VC_FIRM' })
  @ApiQuery({ name: 'country', required: false, example: 'USA' })
  @ApiQuery({ name: 'search', required: false, example: 'Sequoia' })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'List of investors' })
  async findAll(
    @Query('type') type?: string,
    @Query('country') country?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.investorService.findAll({
      type,
      country,
      search,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investor by ID' })
  @ApiParam({ name: 'id', description: 'Investor ID' })
  @ApiResponse({ status: 200, description: 'Investor found' })
  @ApiResponse({ status: 404, description: 'Investor not found' })
  async findOne(@Param('id') id: string) {
    return this.investorService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get investor by slug' })
  @ApiParam({ name: 'slug', description: 'Investor slug', example: 'sequoia-capital' })
  @ApiResponse({ status: 200, description: 'Investor found' })
  @ApiResponse({ status: 404, description: 'Investor not found' })
  async findBySlug(@Param('slug') slug: string) {
    return this.investorService.findBySlug(slug);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update investor' })
  @ApiParam({ name: 'id', description: 'Investor ID' })
  @ApiResponse({ status: 200, description: 'Investor updated successfully' })
  @ApiResponse({ status: 404, description: 'Investor not found' })
  async update(@Param('id') id: string, @Body() updateInvestorDto: UpdateInvestorDto) {
    return this.investorService.update(id, updateInvestorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete investor' })
  @ApiParam({ name: 'id', description: 'Investor ID' })
  @ApiResponse({ status: 204, description: 'Investor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Investor not found' })
  async remove(@Param('id') id: string) {
    await this.investorService.remove(id);
  }

  @Post(':id/enrich')
  @ApiOperation({ summary: 'Enrich investor data from Wikidata' })
  @ApiParam({ name: 'id', description: 'Investor ID' })
  @ApiResponse({ status: 200, description: 'Investor enriched successfully' })
  @ApiResponse({ status: 404, description: 'Investor not found' })
  async enrich(@Param('id') id: string) {
    return this.investorService.enrichFromWikidata(id);
  }

  @Get(':id/portfolio')
  @ApiOperation({ summary: 'Get investor portfolio with statistics' })
  @ApiParam({ name: 'id', description: 'Investor ID' })
  @ApiResponse({ status: 200, description: 'Portfolio retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Investor not found' })
  async getPortfolio(@Param('id') id: string) {
    return this.investorService.getPortfolio(id);
  }
}
