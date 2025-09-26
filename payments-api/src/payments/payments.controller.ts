import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller({ path: 'payment', version: '1' })
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  create(@Body() body: CreatePaymentDto) {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: UpdatePaymentDto) {
    return this.service.update(id, body);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get()
  findMany(@Query('cpf') cpf?: string, @Query('paymentMethod') paymentMethod?: string) {
    return this.service.findMany({ cpf, paymentMethod: paymentMethod as any });
  }
}


