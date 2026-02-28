import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { OrganizationModel } from "../../models/organization.model";
import { AppointmentModel } from "../../models/appointment.model";
import { JWT_SECRET } from "../../configs";

jest.mock("../../configs/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "pi_test_secret" }),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  })),
);
describe("Payment API Integration Tests", () => {
  let userToken: string;
  let user: any;

  beforeEach(async () => {
    user = await UserModel.create({
      fullName: "Pay User",
      email: "pay@example.com",
      phoneNumber: "+9779876543220",
      password: await bcryptjs.hash("User@123", 10),
      role: "user",
    });
    userToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );
  });

  describe("POST /api/payments/create-payment-intent", () => {
    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/api/payments/create-payment-intent")
        .send({ amount: 500 });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid amount", async () => {
      const res = await request(app)
        .post("/api/payments/create-payment-intent")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ amount: -100 });

      expect(res.status).toBe(400);
    });

    it("should create payment intent successfully", async () => {
      const res = await request(app)
        .post("/api/payments/create-payment-intent")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ amount: 500, currency: "usd" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.clientSecret).toBe("pi_test_secret");
    });
  });
});
