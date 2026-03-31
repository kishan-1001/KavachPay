import Razorpay from 'razorpay';

interface InitiatePayoutInput {
  claimId: string;
  userId: string;
  amountRupees: number;
  upiId?: string;
}

interface InitiatePayoutResult {
  mode: 'mock' | 'live';
  payoutId?: string;
  message: string;
}

export async function initiateClaimPayout(input: InitiatePayoutInput): Promise<InitiatePayoutResult> {
  const mode = (process.env.PAYOUT_MODE || 'mock').toLowerCase();

  // Safety-first default: mock mode avoids accidental real money movement.
  if (mode !== 'live') {
    return {
      mode: 'mock',
      payoutId: `mock_payout_${input.claimId.slice(0, 8)}_${Date.now()}`,
      message: 'Mock payout recorded. No real transfer executed.',
    };
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const fundAccountId = process.env.RAZORPAY_FUND_ACCOUNT_ID;

  if (!keyId || !keySecret || !fundAccountId) {
    throw new Error('Live payout is enabled but Razorpay payout configuration is incomplete.');
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  // This expects a pre-created Razorpay fund account id mapped to the receiver.
  const razorpayAny = razorpay as any;
  const payout = await razorpayAny.payouts.create({
    account_number: process.env.RAZORPAY_ACCOUNT_NUMBER || '',
    fund_account_id: fundAccountId,
    amount: Math.round(input.amountRupees * 100),
    currency: 'INR',
    mode: 'UPI',
    purpose: 'payout',
    queue_if_low_balance: true,
    reference_id: input.claimId,
    narration: `KavachPay payout for user ${input.userId}`,
    notes: {
      claimId: input.claimId,
      userId: input.userId,
      upiId: input.upiId || 'not_provided',
    },
  } as any);

  return {
    mode: 'live',
    payoutId: payout.id,
    message: `Live payout initiated via Razorpay with id ${payout.id}.`,
  };
}