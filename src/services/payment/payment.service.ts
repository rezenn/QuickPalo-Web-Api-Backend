import Stripe from "stripe";
import { HttpError } from "../../errors/http-error";
import { AppointmentModel } from "../../models/appointment.model";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export class PaymentService {
  async createPaymentIntent(
    amount: number,
    currency: string = "npr",
    appointmentId?: string,
  ): Promise<string> {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new HttpError(500, "Stripe is not configured");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // rupees → paisa
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...(appointmentId ? { appointmentId } : {}),
      },
    });

    if (!paymentIntent.client_secret) {
      throw new HttpError(500, "Failed to create payment intent");
    }

    return paymentIntent.client_secret;
  }

  async markAppointmentPaid(appointmentId: string): Promise<void> {
    const appointment = await AppointmentModel.findById(appointmentId);
    if (!appointment) {
      throw new HttpError(404, "Appointment not found");
    }
    await AppointmentModel.findByIdAndUpdate(appointmentId, {
      paymentStatus: "paid",
    });
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
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const appointmentId = pi.metadata?.appointmentId;
        if (appointmentId) {
          await AppointmentModel.findByIdAndUpdate(appointmentId, {
            paymentStatus: "paid",
          });
        }
        break;
      }
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  }
}
