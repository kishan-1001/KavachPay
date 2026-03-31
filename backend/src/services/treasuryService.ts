import type { PrismaClient, TreasuryTransactionType } from '@prisma/client';
import prisma from '../prismaClient.js';

const TREASURY_NAME = 'PRIMARY_TREASURY';

export async function ensureTreasury(db: PrismaClient = prisma) {
  const treasury = await db.treasury.upsert({
    where: { name: TREASURY_NAME },
    update: {},
    create: {
      name: TREASURY_NAME,
      balance: 250000,
      currency: 'INR',
    },
  });

  return treasury;
}

interface RecordEntryInput {
  amount: number;
  type: TreasuryTransactionType;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  createdByUserId?: string;
}

export async function creditTreasury(input: RecordEntryInput) {
  const treasury = await ensureTreasury();
  const newBalance = treasury.balance + input.amount;

  const updated = await prisma.treasury.update({
    where: { id: treasury.id },
    data: {
      balance: newBalance,
      transactions: {
        create: {
          direction: 'CREDIT',
          type: input.type,
          amount: input.amount,
          balanceAfter: newBalance,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          note: input.note,
          createdByUserId: input.createdByUserId,
        },
      },
    },
  });

  return updated;
}

export async function debitTreasury(input: RecordEntryInput) {
  const treasury = await ensureTreasury();

  if (treasury.balance < input.amount) {
    throw new Error(`Treasury low balance. Required ${input.amount}, available ${treasury.balance}.`);
  }

  const newBalance = treasury.balance - input.amount;

  const updated = await prisma.treasury.update({
    where: { id: treasury.id },
    data: {
      balance: newBalance,
      transactions: {
        create: {
          direction: 'DEBIT',
          type: input.type,
          amount: input.amount,
          balanceAfter: newBalance,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          note: input.note,
          createdByUserId: input.createdByUserId,
        },
      },
    },
  });

  return updated;
}

export async function getTreasurySummary() {
  const treasury = await ensureTreasury();

  const [inflow, outflow, txCount] = await Promise.all([
    prisma.treasuryTransaction.aggregate({
      where: { treasuryId: treasury.id, direction: 'CREDIT' },
      _sum: { amount: true },
    }),
    prisma.treasuryTransaction.aggregate({
      where: { treasuryId: treasury.id, direction: 'DEBIT' },
      _sum: { amount: true },
    }),
    prisma.treasuryTransaction.count({ where: { treasuryId: treasury.id } }),
  ]);

  return {
    treasury,
    totals: {
      inflow: inflow._sum.amount || 0,
      outflow: outflow._sum.amount || 0,
      transactions: txCount,
    },
  };
}

export async function getTreasuryTransactions(limit = 50) {
  const treasury = await ensureTreasury();
  return prisma.treasuryTransaction.findMany({
    where: { treasuryId: treasury.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
}
