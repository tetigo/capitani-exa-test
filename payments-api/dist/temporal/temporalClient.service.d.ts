import { Client } from '@temporalio/client';
export declare class TemporalClientService {
    private clientPromise;
    getClient(): Promise<Client>;
}
