import { Injectable } from '@nestjs/common';
import { Connection, Client } from '@temporalio/client';

@Injectable()
export class TemporalClientService {
  private clientPromise: Promise<Client> | null = null;

  async getClient(): Promise<Client> {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const address = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';
        const namespace = process.env.TEMPORAL_NAMESPACE ?? 'default';
        const connection = await Connection.connect({ address });
        return new Client({ connection, namespace });
      })();
    }
    return this.clientPromise;
  }
}


