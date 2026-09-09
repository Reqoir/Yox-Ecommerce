/**
 * @file razorpay.service.ts
 * @layer Infrastructure › Services
 * @description Bank-grade integration with Razorpay Payment Gateway SDK
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '@core/infrastructure/config/env';

export interface CreateRazorpayOrderInput {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface VerifySignatureInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export class RazorpayService {
  private razorpayInstance: Razorpay | null = null;

  constructor() {
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
      this.razorpayInstance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
  }

  private getInstance(): Razorpay {
    if (!this.razorpayInstance) {
      if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured.');
      }
      this.razorpayInstance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return this.razorpayInstance;
  }

  /**
   * Create an official payment order on Razorpay Gateway
   */
  async createGatewayOrder(input: CreateRazorpayOrderInput): Promise<{
    id: string;
    amount: number;
    currency: string;
    receipt?: string;
    status: string;
  }> {
    const instance = this.getInstance();

    const options = {
      amount: Math.round(input.amountInPaise),
      currency: input.currency || 'INR',
      receipt: input.receipt,
      notes: input.notes || {},
    };

    const order = await instance.orders.create(options);
    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    };
  }

  /**
   * Verify HMAC SHA-256 signature using timing-safe comparison to prevent timing attack vulnerabilities
   */
  verifyPaymentSignature(input: VerifySignatureInput): boolean {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return false;
    }

    const secret = env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error('Razorpay secret is missing on server.');
    }

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    try {
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const actualBuffer = Buffer.from(razorpaySignature, 'utf8');

      if (expectedBuffer.length !== actualBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Fetch payment details directly from Razorpay API for secondary validation
   */
  async fetchPayment(paymentId: string): Promise<any> {
    const instance = this.getInstance();
    return await instance.payments.fetch(paymentId);
  }
}
