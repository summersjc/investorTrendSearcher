import { IsString, IsEnum, IsOptional, IsInt, IsNumber, IsUrl, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvestorType } from '@prisma/client';

export class CreateInvestorDto {
  @ApiProperty({ example: 'Sequoia Capital' })
  @IsString()
  name: string;

  @ApiProperty({ enum: InvestorType, example: 'VC_FIRM' })
  @IsEnum(InvestorType)
  type: InvestorType;

  @ApiPropertyOptional({ example: 'Leading venture capital firm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://www.sequoiacap.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'Menlo Park' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 1972 })
  @IsOptional()
  @IsInt()
  @Min(1800)
  foundedYear?: number;

  @ApiPropertyOptional({ example: 85000000000, description: 'Assets under management in USD' })
  @IsOptional()
  @IsNumber()
  aum?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  teamSize?: number;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/sequoia-capital' })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/sequoia' })
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;
}
