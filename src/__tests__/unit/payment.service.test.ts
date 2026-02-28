import { PaymentService } from "../../services/payment/payment.service";
import { AppointmentModel } from "../../models/appointment.model";
import { HttpError } from "../../errors/http-error";

// Mock Stripe
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

jest.mock("../../models/appointment.model");

describe("PaymentService", () => {
  let service: PaymentService;
  let stripeInstance: any;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";
    service = new PaymentService();
    const Stripe = require("stripe");
    stripeInstance = Stripe.mock.instances[0];
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  describe("createPaymentIntent", () => {
    it("should throw 500 if Stripe is not configured", async () => {
      delete process.env.STRIPE_SECRET_KEY;

      await expect(service.createPaymentIntent(500)).rejects.toThrow(
        new HttpError(500, "Stripe is not configured"),
      );

      process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    });
  });

  describe("markAppointmentPaid", () => {
    it("should throw 404 if appointment not found", async () => {
      (AppointmentModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.markAppointmentPaid("appt123")).rejects.toThrow(
        new HttpError(404, "Appointment not found"),
      );
    });

    it("should update payment status to paid", async () => {
      (AppointmentModel.findById as jest.Mock).mockResolvedValue({
        _id: "appt123",
      });
      (AppointmentModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: "appt123",
        paymentStatus: "paid",
      });

      await expect(
        service.markAppointmentPaid("appt123"),
      ).resolves.not.toThrow();
      expect(AppointmentModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "appt123",
        {
          paymentStatus: "paid",
        },
      );
    });
  });
});
