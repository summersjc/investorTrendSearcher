import { IsString, IsEnum, IsOptional, IsInt, IsNumber, IsUrl, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyType, CompanyStage } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Stripe' })
  @IsString()
  name: string;

  @ApiProperty({ enum: CompanyType, example: 'PRIVATE' })
  @IsEnum(CompanyType)
  type: CompanyType;

  @ApiPropertyOptional({ enum: CompanyStage, example: 'GROWTH' })
  @IsOptional()
  @IsEnum(CompanyStage)
  stage?: CompanyStage;

  @ApiPropertyOptional({ example: 'Payment processing platform' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://stripe.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  headquarters?: string;

  @ApiPropertyOptional({ example: 'San Francisco' })
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

  @ApiPropertyOptional({ example: 'Financial Services' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiPropertyOptional({ example: 2010 })
  @IsOptional()
  @IsInt()
  @Min(1800)
  foundedYear?: number;

  @ApiPropertyOptional({ example: 'ABNB' })
  @IsOptional()
  @IsString()
  ticker?: string;

  @ApiPropertyOptional({ example: 'NASDAQ' })
  @IsOptional()
  @IsString()
  exchange?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/stripe' })
  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/stripe' })
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;
}
