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
export declare class MercadoPagoClient {
    private readonly http;
    constructor();
    createPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResponse>;
}
