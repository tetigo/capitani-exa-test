export type PaymentMethod = 'PIX' | 'CREDIT_CARD';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAIL';

export interface PaymentProps {
  id: string;
  cpf: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  mercadoPagoPreferenceId?: string;
  checkoutUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaymentEntity implements PaymentProps {
  id: string;
  cpf: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  mercadoPagoPreferenceId?: string;
  checkoutUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: PaymentProps) {
    this.id = props.id;
    this.cpf = props.cpf;
    this.description = props.description;
    this.amount = props.amount;
    this.paymentMethod = props.paymentMethod;
    this.status = props.status;
    this.mercadoPagoPreferenceId = props.mercadoPagoPreferenceId;
    this.checkoutUrl = props.checkoutUrl;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}


