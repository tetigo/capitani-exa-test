import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export async function waitForConfirmation(paymentId: string): Promise<'PAID' | 'FAIL'> {
  // Simples polling do banco até webhook atualizar status
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (payment?.status === 'PAID') return 'PAID';
    if (payment?.status === 'FAIL') return 'FAIL';
    await new Promise((r) => setTimeout(r, 3000));
  }
  return 'FAIL';
}


