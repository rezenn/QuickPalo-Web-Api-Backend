import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { OrganizationModel } from "../../models/organization.model";
import { connectDb } from "../../database/mongodb";
import { JWT_SECRET } from "../../configs";

describe("Admin API Tests", () => {
  let adminToken: string;
  let adminUser: any;

  beforeAll(async () => {
    await connectDb();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await OrganizationModel.deleteMany({});

    const hashedPassword = await bcryptjs.hash("Admin@123", 10);
    adminUser = await UserModel.create({
      fullName: "Admin User",
      email: "admin@example.com",
      phoneNumber: "+9779876543210",
      password: hashedPassword,
      role: "admin",
    });

    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: "30d" },
    );
  });

  describe("GET /api/admin/auth/dashboard", () => {
    it("should allow admin to access dashboard", async () => {
      const res = await request(app)
        .get("/api/admin/auth/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should block non-admin users", async () => {
      const user = await UserModel.create({
        fullName: "User",
        email: "user@example.com",
        phoneNumber: "+9779876543211",
        password: await bcryptjs.hash("User@123", 10),
        role: "user",
      });

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
      );

      const res = await request(app)
        .get("/api/admin/auth/dashboard")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/admin/auth/register-organization", () => {
    it("should create organization successfully", async () => {
      const res = await request(app)
        .post("/api/admin/auth/register-organization")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullName", "City Hospital")
        .field("email", "hospital@example.com")
        .field("phoneNumber", "+9779876543212")
        .field("password", "Hospital@123")
        .field("confirmPassword", "Hospital@123");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe("POST /api/admin/auth/create-user", () => {
    it("should create new user", async () => {
      const res = await request(app)
        .post("/api/admin/auth/create-user")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullName", "John Doe")
        .field("email", "john@example.com")
        .field("phoneNumber", "+9779876543214")
        .field("password", "User@123")
        .field("confirmPassword", "User@123");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("john@example.com");
    });
  });

  describe("GET /api/admin/auth/users", () => {
    beforeEach(async () => {
      for (let i = 1; i <= 3; i++) {
        await UserModel.create({
          fullName: `User ${i}`,
          email: `user${i}@example.com`,
          phoneNumber: `+977987654321${i}`,
          password: await bcryptjs.hash("User@123", 10),
          role: "user",
        });
      }
    });

    it("should return list of users", async () => {
      const res = await request(app)
        .get("/api/admin/auth/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
    });
  });

  describe("PUT /api/admin/auth/:id", () => {
    let userId: string;

    beforeEach(async () => {
      const user = await UserModel.create({
        fullName: "Test User",
        email: "test@example.com",
        phoneNumber: "+9779876543216",
        password: await bcryptjs.hash("User@123", 10),
        role: "user",
      });
      userId = user._id.toString();
    });

    it("should update user", async () => {
      const res = await request(app)
        .put(`/api/admin/auth/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .field("fullName", "Updated Name");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe("Updated Name");
    });
  });

  describe("DELETE /api/admin/auth/:id", () => {
    let userId: string;

    beforeEach(async () => {
      const user = await UserModel.create({
        fullName: "Delete User",
        email: "delete@example.com",
        phoneNumber: "+9779876543217",
        password: await bcryptjs.hash("User@123", 10),
        role: "user",
      });
      userId = user._id.toString();
    });

    it("should delete user", async () => {
      const res = await request(app)
        .delete(`/api/admin/auth/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("User deleted");

      const deleted = await UserModel.findById(userId);
      expect(deleted).toBeNull();
    });

    it("should not delete admin users", async () => {
      const res = await request(app)
        .delete(`/api/admin/auth/${adminUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });
});
