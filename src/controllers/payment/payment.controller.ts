import { Request, Response } from "express";
import { PaymentService } from "../../services/payment/payment.service";

const paymentService = new PaymentService();

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response) {
    try {
      const { amount, currency, appointmentId } = req.body;

      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid amount is required",
        });
      }

      const clientSecret = await paymentService.createPaymentIntent(
        Number(amount),
        currency || "npr",
        appointmentId,
      );

      return res.status(200).json({
        success: true,
        message: "Payment intent created successfully",
        data: { clientSecret },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async markAppointmentPaid(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: "Appointment ID is required",
        });
      }

      await paymentService.markAppointmentPaid(appointmentId);

      return res.status(200).json({
        success: true,
        message: "Payment status updated",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async handleWebhook(req: Request, res: Response) {
    try {
      const sig = req.headers["stripe-signature"] as string;
      await paymentService.handleWebhookEvent(req.body, sig);
      return res.status(200).json({ received: true });
    } catch (error: Error | any) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}
