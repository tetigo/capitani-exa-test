import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export enum PaymentStatusDto {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAIL = 'FAIL',
}

export class UpdatePaymentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentStatusDto)
  status?: PaymentStatusDto;
}


