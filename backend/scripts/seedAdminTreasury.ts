import prisma from '../src/prismaClient.js';
import { ensureTreasury, creditTreasury } from '../src/services/treasuryService.js';

async function main() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@kavachpay.demo';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: 'ADMIN',
      isVerified: true,
      fullName: 'KavachPay Admin',
      city: 'Bengaluru',
    },
    create: {
      fullName: 'KavachPay Admin',
      email: adminEmail,
      role: 'ADMIN',
      city: 'Bengaluru',
      deliveryPlatform: 'ADMIN_CONSOLE',
      vehicleType: 'NONE',
      weeklyEarnings: 0,
      upiId: 'admin@upi',
      isVerified: true,
      phoneNumber: '9000000000',
    },
  });

  const treasury = await ensureTreasury();

  // Add one optional seed top-up for demo if current balance is very low.
  if (treasury.balance < 50000) {
    await creditTreasury({
      amount: 200000,
      type: 'TOPUP',
      referenceType: 'SEED',
      referenceId: admin.id,
      note: 'Seed top-up for hackathon demo',
      createdByUserId: admin.id,
    });
  }

  const latestTreasury = await ensureTreasury();

  console.log('--- Admin + Treasury Seed Complete ---');
  console.log({
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
    treasury: {
      id: latestTreasury.id,
      balance: latestTreasury.balance,
      currency: latestTreasury.currency,
    },
  });

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Seed failed:', error);
  try {
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
