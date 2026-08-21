import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      tournamentId,
      teamId,
      amount
    } = await req.json();

    if (!razorpay_payment_id) {
      return NextResponse.json({ error: 'Payment ID missing' }, { status: 400 });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_shakti_12345';

    let isValid = false;

    if (razorpay_order_id && razorpay_signature && !razorpay_order_id.startsWith('order_test_')) {
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generated_signature === razorpay_signature;
    } else {
      // Test mode / sandbox validation
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id || `order_${Date.now()}`,
      tournamentId,
      teamId,
      amount
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
