import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductContentDto, PriceTierDto } from './create-product.dto';

export class UpdateAdminProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['TEST', 'SERVICE'])
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductContentDto)
  contents?: ProductContentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceTierDto)
  priceTiers?: PriceTierDto[];

  // 결과지 페이지 조합 (behavior 검사용)
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  resultPages?: number[];

  // 색채유형 결과지 페이지 조합
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  colorResultPages?: number[];
}

export class UpdateProductStatusDto {
  @IsEnum(['ACTIVE', 'INACTIVE', 'DISCONTINUED'])
  status: string;
}
