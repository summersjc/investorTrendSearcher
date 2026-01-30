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
import { InvestmentService } from './investment.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';

@ApiTags('investments')
@Controller('investments')
export class InvestmentController {
  constructor(private readonly investmentService: InvestmentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new investment' })
  @ApiResponse({ status: 201, description: 'Investment created successfully' })
  @ApiResponse({ status: 404, description: 'Investor or company not found' })
  async create(@Body() createInvestmentDto: CreateInvestmentDto) {
    return this.investmentService.create(createInvestmentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all investments' })
  @ApiQuery({ name: 'investorId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'stage', required: false, example: 'SERIES_A' })
  @ApiQuery({ name: 'status', required: false, example: 'ACTIVE' })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'List of investments' })
  async findAll(
    @Query('investorId') investorId?: string,
    @Query('companyId') companyId?: string,
    @Query('stage') stage?: string,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.investmentService.findAll({
      investorId,
      companyId,
      stage,
      status,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get investment statistics' })
  @ApiResponse({ status: 200, description: 'Investment statistics' })
  async getStatistics() {
    return this.investmentService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investment by ID' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @ApiResponse({ status: 200, description: 'Investment found' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  async findOne(@Param('id') id: string) {
    return this.investmentService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update investment' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @ApiResponse({ status: 200, description: 'Investment updated successfully' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  async update(@Param('id') id: string, @Body() updateInvestmentDto: UpdateInvestmentDto) {
    return this.investmentService.update(id, updateInvestmentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete investment' })
  @ApiParam({ name: 'id', description: 'Investment ID' })
  @ApiResponse({ status: 204, description: 'Investment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  async remove(@Param('id') id: string) {
    await this.investmentService.remove(id);
  }
}
