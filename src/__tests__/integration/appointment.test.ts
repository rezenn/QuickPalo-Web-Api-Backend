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

const VALID_WORKING_HOURS = [
  {
    day: "monday",
    openingTime: "09:00",
    closingTime: "17:00",
    isWorking: true,
  },
  {
    day: "tuesday",
    openingTime: "09:00",
    closingTime: "17:00",
    isWorking: true,
  },
  {
    day: "wednesday",
    openingTime: "09:00",
    closingTime: "17:00",
    isWorking: true,
  },
  {
    day: "thursday",
    openingTime: "09:00",
    closingTime: "17:00",
    isWorking: true,
  },
  {
    day: "friday",
    openingTime: "09:00",
    closingTime: "17:00",
    isWorking: true,
  },
  {
    day: "saturday",
    openingTime: "10:00",
    closingTime: "14:00",
    isWorking: true,
  },
  {
    day: "sunday",
    openingTime: "00:00",
    closingTime: "00:00",
    isWorking: false,
  },
];

describe("Appointment API Integration Tests", () => {
  let userToken: string;
  let adminToken: string;
  let orgToken: string;
  let regularUser: any;
  let adminUser: any;
  let orgUser: any;
  let organization: any;

  beforeEach(async () => {
    regularUser = await UserModel.create({
      fullName: "Regular User",
      email: "user@example.com",
      phoneNumber: "+9779876543211",
      password: await bcryptjs.hash("User@123", 10),
      role: "user",
    });
    userToken = jwt.sign(
      { id: regularUser._id, email: regularUser.email, role: regularUser.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    adminUser = await UserModel.create({
      fullName: "Admin User",
      email: "admin@example.com",
      phoneNumber: "+9779876543210",
      password: await bcryptjs.hash("Admin@123", 10),
      role: "admin",
    });
    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    orgUser = await UserModel.create({
      fullName: "Test Hospital",
      email: "org@example.com",
      phoneNumber: "+9779876543212",
      password: await bcryptjs.hash("Org@123", 10),
      role: "organization",
    });
    orgToken = jwt.sign(
      { id: orgUser._id, email: orgUser.email, role: orgUser.role },
      JWT_SECRET,
      { expiresIn: "1d" },
    );

    organization = await OrganizationModel.create({
      userId: orgUser._id,
      organizationName: "City Hospital",
      organizationType: "hospital",
      street: "Main Street",
      city: "Kathmandu",
      contactEmail: "contact@hospital.com",
      //   workingHours: VALID_WORKING_HOURS,
      departments: [{ name: "Cardiology" }],
      fees: 500,
      appointmentDuration: 30,
      advanceBookingDays: 30,
      timeSlots: [{ startTime: "09:00", endTime: "09:30", isAvailable: true }],
    });
  });

  describe("POST /api/appointments", () => {
    it("should return 401 without auth token", async () => {
      const res = await request(app).post("/api/appointments").send({});
      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid data", async () => {
      const res = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ organizationId: "bad-id" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/appointments/user", () => {
    it("should return user appointments", async () => {
      const res = await request(app)
        .get("/api/appointments/user")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/appointments/user");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/appointments/:id/cancel", () => {
    let appointmentId: string;

    beforeEach(async () => {
      const deptId = organization.departments[0]._id.toString();
      const appointment = await AppointmentModel.create({
        organizationId: organization._id,
        userId: regularUser._id,
        departmentId: deptId,
        departmentName: "Cardiology",
        clientName: "John Doe",
        clientEmail: "john@example.com",
        clientPhoneNumber: "+977123456789",
        date: "2025-06-15",
        timeslot: { startTime: "09:00", endTime: "09:30", isAvailable: true },
        paymentAmount: 500,
        paymentMethod: "online",
        status: "pending",
      });
      appointmentId = appointment._id.toString();
    });

    it("should cancel appointment as owner", async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("cancelled");
    });

    it("should cancel appointment as admin", async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/cancel`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("cancelled");
    });
  });

  describe("PATCH /api/appointments/:id/complete", () => {
    let appointmentId: string;

    beforeEach(async () => {
      const deptId = organization.departments[0]._id.toString();
      const appointment = await AppointmentModel.create({
        organizationId: organization._id,
        userId: regularUser._id,
        departmentId: deptId,
        departmentName: "Cardiology",
        clientName: "Jane Doe",
        clientEmail: "jane@example.com",
        clientPhoneNumber: "+977123456789",
        date: "2025-06-15",
        timeslot: { startTime: "10:00", endTime: "10:30", isAvailable: true },
        paymentAmount: 500,
        paymentMethod: "online",
        status: "pending",
      });
      appointmentId = appointment._id.toString();
    });

    it("should return 403 for regular users", async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/complete`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should complete appointment as admin", async () => {
      const res = await request(app)
        .patch(`/api/appointments/${appointmentId}/complete`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("completed");
    });
  });

  describe("DELETE /api/appointments/:id", () => {
    let appointmentId: string;

    beforeEach(async () => {
      const deptId = organization.departments[0]._id.toString();
      const appointment = await AppointmentModel.create({
        organizationId: organization._id,
        userId: regularUser._id,
        departmentId: deptId,
        departmentName: "Cardiology",
        clientName: "Delete Me",
        clientEmail: "delete@example.com",
        clientPhoneNumber: "+977123456789",
        date: "2025-06-15",
        timeslot: { startTime: "11:00", endTime: "11:30", isAvailable: true },
        paymentAmount: 500,
        paymentMethod: "online",
        status: "pending",
      });
      appointmentId = appointment._id.toString();
    });

    it("should return 403 for non-admin", async () => {
      const res = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should delete appointment as admin", async () => {
      const res = await request(app)
        .delete(`/api/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deleted = await AppointmentModel.findById(appointmentId);
      expect(deleted).toBeNull();
    });
  });

  describe("GET /api/appointments", () => {
    it("should return 403 for non-admin", async () => {
      const res = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    it("should return all appointments for admin", async () => {
      const res = await request(app)
        .get("/api/appointments")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
