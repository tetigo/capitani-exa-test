// Global test setup
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/payments_test?schema=public';
process.env.TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
process.env.TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
process.env.TEMPORAL_TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'payments-task-queue-test';

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
