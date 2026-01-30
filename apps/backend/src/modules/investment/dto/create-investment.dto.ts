import { IsString, IsEnum, IsOptional, IsNumber, IsDate, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvestmentStage, InvestmentStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateInvestmentDto {
  @ApiProperty({ example: 'clxxx...investor-id' })
  @IsString()
  investorId: string;

  @ApiProperty({ example: 'clxxx...company-id' })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ example: 2000000, description: 'Investment amount in USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ enum: InvestmentStage, example: 'SERIES_A' })
  @IsEnum(InvestmentStage)
  stage: InvestmentStage;

  @ApiPropertyOptional({ enum: InvestmentStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(InvestmentStatus)
  status?: InvestmentStatus;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  investedAt?: Date;

  @ApiPropertyOptional({ example: '2025-06-30' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  exitedAt?: Date;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  leadInvestor?: boolean;

  @ApiPropertyOptional({ example: 15.5, description: 'Ownership percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ownership?: number;

  @ApiPropertyOptional({ example: 'Strategic investment in payment infrastructure' })
  @IsOptional()
  @IsString()
  notes?: string;
}
