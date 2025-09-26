import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString, Length } from 'class-validator';

export enum PaymentMethodDto {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
}

export class CreatePaymentDto {
  @IsString()
  @Length(11, 11)
  cpf!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(PaymentMethodDto)
  paymentMethod!: PaymentMethodDto;
}


