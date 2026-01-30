import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ImportExportService } from './import-export.service';

@ApiTags('import-export')
@Controller('import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Post('import/investors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import investors from JSON array' })
  @ApiBody({
    description: 'Array of investor objects',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiResponse({ status: 200, description: 'Import results' })
  async importInvestors(@Body() investors: any[]) {
    return this.importExportService.importInvestors(investors);
  }

  @Post('import/companies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import companies from JSON array' })
  @ApiBody({
    description: 'Array of company objects',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiResponse({ status: 200, description: 'Import results' })
  async importCompanies(@Body() companies: any[]) {
    return this.importExportService.importCompanies(companies);
  }

  @Post('import/investments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Import investments from JSON array' })
  @ApiBody({
    description: 'Array of investment objects',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiResponse({ status: 200, description: 'Import results' })
  async importInvestments(@Body() investments: any[]) {
    return this.importExportService.importInvestments(investments);
  }

  @Get('export/all')
  @ApiOperation({ summary: 'Export all data as JSON' })
  @ApiResponse({ status: 200, description: 'Complete database export' })
  async exportAll() {
    return this.importExportService.exportAll();
  }

  @Get('export/investors')
  @ApiOperation({ summary: 'Export investors as JSON' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv'],
    example: 'json',
  })
  @ApiResponse({ status: 200, description: 'Investor export' })
  @Header('Content-Type', 'application/json')
  async exportInvestors(@Query('format') format: string = 'json') {
    const investors = await this.importExportService.exportInvestors();

    if (format === 'csv') {
      return this.importExportService.csvStringify(investors);
    }

    return investors;
  }

  @Get('export/companies')
  @ApiOperation({ summary: 'Export companies as JSON' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv'],
    example: 'json',
  })
  @ApiResponse({ status: 200, description: 'Company export' })
  async exportCompanies(@Query('format') format: string = 'json') {
    const companies = await this.importExportService.exportCompanies();

    if (format === 'csv') {
      return this.importExportService.csvStringify(companies);
    }

    return companies;
  }

  @Get('export/investments')
  @ApiOperation({ summary: 'Export investments as JSON' })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['json', 'csv'],
    example: 'json',
  })
  @ApiResponse({ status: 200, description: 'Investment export' })
  async exportInvestments(@Query('format') format: string = 'json') {
    const investments = await this.importExportService.exportInvestments();

    if (format === 'csv') {
      return this.importExportService.csvStringify(investments);
    }

    return investments;
  }
}
