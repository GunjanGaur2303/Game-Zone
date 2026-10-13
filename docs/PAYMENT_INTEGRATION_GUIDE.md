# Indian Payout Gateway Integration Guide — RazorpayX / Cashfree

This document provides the production implementation guide for transitioning **GameEarn Pro** from sandbox mock payouts to authorized Indian payment rails (RazorpayX Payouts or Cashfree Payouts) for automated UPI and IMPS bank disbursements.

---

## 1. Provider Credentials (.env Configuration)

Add the following to your private server environment (never expose in frontend code):

```env
# RazorpayX Payouts
RAZORPAYX_KEY_ID="rzp_live_xxxxxxxxxxxx"
RAZORPAYX_KEY_SECRET="your_live_payout_secret"
RAZORPAYX_ACCOUNT_NUMBER="787878xxxxxxxx"
RAZORPAYX_WEBHOOK_SECRET="whsec_xxxxxxxxxxxx"

# Cashfree Payouts (Alternative)
CASHFREE_CLIENT_ID="CF_LIVE_xxxxxxxx"
CASHFREE_CLIENT_SECRET="your_cashfree_secret"
CASHFREE_ENV="PRODUCTION"
```

---

## 2. Server-Side Payout Initiation (RazorpayX API Example)

When an admin approves a withdrawal request or automatic threshold triggers:

```typescript
import axios from 'axios';

export async function executeUpiPayout(params: {
  amountINR: number;
  upiId: string;
  withdrawalId: string;
  userName: string;
}) {
  const authHeader = Buffer.from(
    `${process.env.RAZORPAYX_KEY_ID}:${process.env.RAZORPAYX_KEY_SECRET}`
  ).toString('base64');

  // Step 1: Create Contact & Fund Account
  const fundAccountRes = await axios.post(
    'https://api.razorpay.com/v1/fund_accounts',
    {
      contact: {
        name: params.userName,
        type: 'customer',
        reference_id: params.withdrawalId,
      },
      account_type: 'vpa',
      vpa: {
        address: params.upiId,
      },
    },
    { headers: { Authorization: `Basic ${authHeader}` } }
  );

  const fundAccountId = fundAccountRes.data.id;

  // Step 2: Create Payout
  const payoutRes = await axios.post(
    'https://api.razorpay.com/v1/payouts',
    {
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: Math.round(params.amountINR * 100), // in paise
      currency: 'INR',
      mode: 'UPI',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: params.withdrawalId,
      narration: 'GameEarn Pro Reward',
    },
    {
      headers: {
        Authorization: `Basic ${authHeader}`,
        'X-Payout-Idempotency': `IDEMP_${params.withdrawalId}`,
      },
    }
  );

  return payoutRes.data;
}
```

---

## 3. Webhook HMAC-SHA256 Signature Verification

Payment gateways dispatch asynchronous status updates (`payout.processed`, `payout.reversed`). Verify the incoming HMAC signature before mutating database records:

```typescript
import crypto from 'crypto';
import { Request, Response } from 'express';

export function verifyWebhookSignature(req: Request, res: Response) {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookBody = JSON.stringify(req.body);
  const secret = process.env.RAZORPAYX_WEBHOOK_SECRET || '';

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(webhookBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  if (event === 'payout.processed') {
    const payout = req.body.payload.payout.entity;
    // Mark withdrawal as COMPLETED in database
    console.log(`Payout ${payout.id} processed successfully`);
  } else if (event === 'payout.reversed') {
    const payout = req.body.payload.payout.entity;
    // Refund points to user's wallet
    console.log(`Payout ${payout.id} reversed. Refunding user points.`);
  }

  res.json({ status: 'ok' });
}
```

---

## 4. Anti-Fraud & Reconciliation Architecture

1. **Idempotency Keys**: Every payout request uses `X-Payout-Idempotency: IDEMP_<withdrawal_id>` so duplicate network retries never trigger double debits.
2. **Two-Phase Commit**:
   - Points are locked from `availablePoints` into `pendingPoints` upon request.
   - Points are permanently transitioned to `redeemedPoints` only upon receiving the verified `payout.processed` webhook.
   - If gateway returns failure or reversal, points are automatically credited back to `availablePoints`.
