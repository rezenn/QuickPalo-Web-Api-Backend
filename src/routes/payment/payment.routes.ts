import { Router } from "express";
import { PaymentController } from "../../controllers/payment/payment.controller";
import { AuthorizedMiddleware } from "../../middlewares/authorized.middleware";

const paymentController = new PaymentController();
const router = Router();

router.post(
  "/create-payment-intent",
  AuthorizedMiddleware,
  paymentController.createPaymentIntent,
);

router.patch(
  "/:appointmentId/mark-paid",
  AuthorizedMiddleware,
  paymentController.markAppointmentPaid,
);

export default router;
