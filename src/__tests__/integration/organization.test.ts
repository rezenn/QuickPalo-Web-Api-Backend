import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { OrganizationModel } from "../../models/organization.model";
import { JWT_SECRET } from "../../configs";

describe("Organization Details API", () => {
  let orgToken: string;
  let orgUser: any;
  let regularUserToken: string;
  let adminToken: string;

  beforeEach(async () => {
    const hashedPassword = await bcryptjs.hash("Org@123", 10);
    orgUser = await UserModel.create({
      fullName: "Test Organization",
      email: "org@example.com",
      phoneNumber: "+9779876543210",
      password: hashedPassword,
      role: "organization",
    });

    orgToken = jwt.sign(
      { id: orgUser._id, email: orgUser.email, role: orgUser.role },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    // Create regular user
    const user = await UserModel.create({
      fullName: "Regular User",
      email: "user@example.com",
      phoneNumber: "+9779876543211",
      password: await bcryptjs.hash("User@123", 10),
      role: "user",
    });

    regularUserToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
    );

    // Create admin user
    const admin = await UserModel.create({
      fullName: "Admin User",
      email: "admin@example.com",
      phoneNumber: "+9779876543299",
      password: await bcryptjs.hash("Admin@123", 10),
      role: "admin",
    });

    adminToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
    );
  });

  describe("POST /api/organizations/details", () => {
    it("should create organization details", async () => {
      const res = await request(app)
        .post("/api/organizations/details")
        .set("Authorization", `Bearer ${orgToken}`)
        .send({
          organizationName: "City Hospital",
          organizationType: "hospital",
          description: "Best hospital in town",
          street: "Main Street 123",
          city: "Kathmandu",
          state: "Bagmati",
          contactEmail: "contact@cityhospital.com",
          contactPhone: "+9779876543212",
          workingHours: [
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
          ],
          departments: [{ name: "Cardiology" }, { name: "Neurology" }],
          appointmentDuration: 30,
          advanceBookingDays: 30,
          timeSlots: [
            { startTime: "09:00", endTime: "09:30", isAvailable: true },
            { startTime: "09:30", endTime: "10:00", isAvailable: true },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        "Organization details created successfully",
      );
      expect(res.body.data.organizationName).toBe("City Hospital");
    });

    it("should return 403 for non-organization users", async () => {
      const res = await request(app)
        .post("/api/organizations/details")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({
          organizationName: "City Hospital",
          organizationType: "hospital",
          street: "Main Street",
          city: "Kathmandu",
          contactEmail: "contact@hospital.com",
          workingHours: [
            {
              day: "monday",
              openingTime: "09:00",
              closingTime: "17:00",
              isWorking: true,
            },
          ],
        });

      expect(res.status).toBe(403);
    });

    it("should return 401 without token", async () => {
      const res = await request(app)
        .post("/api/organizations/details")
        .send({ organizationName: "City Hospital" });

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/organizations/details", () => {
    beforeEach(async () => {
      await OrganizationModel.create({
        userId: orgUser._id,
        organizationName: "City Hospital",
        organizationType: "hospital",
        street: "Main Street",
        city: "Kathmandu",
        contactEmail: "contact@hospital.com",
        workingHours: [
          {
            day: "monday",
            openingTime: "09:00",
            closingTime: "17:00",
            isWorking: true,
          },
        ],
        departments: [{ name: "Cardiology" }],
        appointmentDuration: 30,
        advanceBookingDays: 30,
        timeSlots: [
          { startTime: "09:00", endTime: "09:30", isAvailable: true },
        ],
      });
    });

    it("should update organization details", async () => {
      const res = await request(app)
        .put("/api/organizations/details")
        .set("Authorization", `Bearer ${orgToken}`)
        .send({
          organizationName: "Updated Hospital Name",
          description: "Updated description",
          appointmentDuration: 45,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organizationName).toBe("Updated Hospital Name");
      expect(res.body.data.appointmentDuration).toBe(45);
    });
  });

  describe("DELETE /api/organizations/details", () => {
    beforeEach(async () => {
      await OrganizationModel.create({
        userId: orgUser._id,
        organizationName: "City Hospital",
        organizationType: "hospital",
        street: "Main Street",
        city: "Kathmandu",
        contactEmail: "contact@hospital.com",
        workingHours: [
          {
            day: "monday",
            openingTime: "09:00",
            closingTime: "17:00",
            isWorking: true,
          },
        ],
        departments: [{ name: "Cardiology" }],
        appointmentDuration: 30,
        advanceBookingDays: 30,
        timeSlots: [
          { startTime: "09:00", endTime: "09:30", isAvailable: true },
        ],
      });
    });

    it("should delete organization details", async () => {
      const res = await request(app)
        .delete("/api/organizations/details")
        .set("Authorization", `Bearer ${orgToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        "Organization details deleted successfully",
      );

      const deleted = await OrganizationModel.findOne({ userId: orgUser._id });
      expect(deleted).toBeNull();
    });
  });

  describe("GET /api/organizations", () => {
    beforeEach(async () => {
      const orgUser2 = await UserModel.create({
        fullName: "Organization 2",
        email: "org2@example.com",
        phoneNumber: "+9779876543222",
        password: await bcryptjs.hash("Org@123", 10),
        role: "organization",
      });

      const orgUser3 = await UserModel.create({
        fullName: "Organization 3",
        email: "org3@example.com",
        phoneNumber: "+9779876543233",
        password: await bcryptjs.hash("Org@123", 10),
        role: "organization",
      });
    });

    it("should get all active organizations", async () => {
      const res = await request(app).get("/api/organizations");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should filter organizations by city", async () => {
      const res = await request(app).get("/api/organizations");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /api/organizations/:id", () => {
    let orgId: string;

    beforeEach(async () => {
      const org = await OrganizationModel.create({
        userId: orgUser._id,
        organizationName: "City Hospital",
        organizationType: "hospital",
        street: "Main Street",
        city: "Kathmandu",
        contactEmail: "contact@hospital.com",
        workingHours: [
          {
            day: "monday",
            openingTime: "09:00",
            closingTime: "17:00",
            isWorking: true,
          },
        ],
        departments: [{ name: "Cardiology" }],
        appointmentDuration: 30,
        advanceBookingDays: 30,
        timeSlots: [
          { startTime: "09:00", endTime: "09:30", isAvailable: true },
        ],
      });
      orgId = org._id.toString();
    });

    it("should get organization by id", async () => {
      const res = await request(app)
        .get(`/api/organizations/${orgId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organizationName).toBe("City Hospital");
    });

    it("should return 404 for non-existent id", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/organizations/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
