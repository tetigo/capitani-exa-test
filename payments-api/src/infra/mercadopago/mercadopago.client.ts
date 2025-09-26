import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface CreatePreferenceInput {
  description: string;
  amount: number;
  external_reference: string;
  notification_url?: string;
}

export interface CreatePreferenceResponse {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
}

@Injectable()
export class MercadoPagoClient {
  private readonly http: AxiosInstance;

  constructor() {
    const baseURL = 'https://api.mercadopago.com';
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? '';
    this.http = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  async createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResponse> {
    const body = {
      items: [
        {
          title: input.description,
          quantity: 1,
          unit_price: input.amount,
          currency_id: 'BRL',
        },
      ],
      external_reference: input.external_reference,
      notification_url: input.notification_url,
    };
    const { data } = await this.http.post('/checkout/preferences', body);
    return { id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point };
  }
}


