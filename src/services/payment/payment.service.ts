import Stripe from "stripe";
import { HttpError } from "../../errors/http-error";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export class PaymentService {
  async createPaymentIntent(
    amount: number,
    currency: string = "npr",
  ): Promise<string> {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new HttpError(500, "Stripe is not configured");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency,
      automatic_payment_methods: { enabled: true },
    });

    if (!paymentIntent.client_secret) {
      throw new HttpError(500, "Failed to create payment intent");
    }

    return paymentIntent.client_secret;
  }

  async handleWebhookEvent(payload: Buffer, sig: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new HttpError(500, "Webhook secret not configured");
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err: any) {
      throw new HttpError(
        400,
        `Webhook signature verification failed: ${err.message}`,
      );
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        break;

      case "payment_intent.payment_failed":
        console.error(`Payment failed: ${event.data.object}`);
        break;

      default:
        console.error(`Unhandled event type: ${event.type}`);
    }
  }
}
