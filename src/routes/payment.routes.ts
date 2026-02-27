import { Router } from "express";
import Stripe from "stripe";
import { AuthorizedMiddleware } from "../middlewares/authorized.middleware";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = Router();

router.post(
  "/create-payment-intent",
  AuthorizedMiddleware,
  async (req, res) => {
    try {
      const { amount, currency = "npr" } = req.body;

      if (!amount || amount <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), 
        currency,
        automatic_payment_methods: { enabled: true },
      });

      return res.status(200).json({
        success: true,
        data: { clientSecret: paymentIntent.client_secret },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
);

export default router;
