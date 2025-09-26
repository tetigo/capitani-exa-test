import { Runtime, DefaultLogger, Worker } from '@temporalio/worker';
import { NativeConnection } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  Runtime.install({ logger: new DefaultLogger('WARN') });
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? 'payments-task-queue';
  const namespace = process.env.TEMPORAL_NAMESPACE ?? 'default';
  const address = process.env.TEMPORAL_ADDRESS ?? 'localhost:7233';

  const connection = await NativeConnection.connect({ address });

  const worker = await Worker.create({
    connection,
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue,
    namespace,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});


