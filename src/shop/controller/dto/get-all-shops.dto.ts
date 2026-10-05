import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetAllShopsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 50))
  @IsInt()
  @Min(1)
  @Max(200)
  limit = 50;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 0))
  @IsInt()
  @Min(0)
  offset = 0;
}
