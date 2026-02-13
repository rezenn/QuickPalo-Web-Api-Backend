import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { OrganizationModel } from "../../models/organization.model";
import { connectDb } from "../../database/mongodb";
import { JWT_SECRET } from "../../configs";

describe("Authentication Integration Tests", () => {
  const testUser = {
    fullName: "Test",
    email: "test@example.com",
    phoneNumber: "+9779876543210",
    password: "testpassword",
    confirmPassword: "testpassword",
  };
  beforeAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });
  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
  });

  describe("POST /api/auth/register", () => {
    // nested describe block
    test(// actual test case
    "should register a new user", async () => {
      // test case description
      const response = await request(app)
        .post("/api/auth/register")
        .send(testUser); 
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Registered successfully",
      );
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user before each login test
      const hashedPassword = await bcryptjs.hash("Test@123", 10);
      await UserModel.create({
        fullName: "Test User",
        email: "test@example.com",
        phoneNumber: "+9779876543210",
        password: hashedPassword,
        role: "user",
      });
    });

    const validLogin = {
      email: "test@mail.com",
      password: "Test@123",
    };

    it("should return 404 for non-existent email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "Test@123",
      });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "User not found");
    });

    it("should return 401 for invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "Invaild credenrials");
    });
  });

  describe("GET /api/auth/get-user", () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const hashedPassword = await bcryptjs.hash("Test@123", 10);
      const user = await UserModel.create({
        fullName: "Test User",
        email: "test@example.com",
        phoneNumber: "+9779876543210",
        password: hashedPassword,
        role: "user",
        profilePicture: "test.jpg",
      });
      userId = user._id.toString();

      const payload = { id: user._id, email: user.email, role: user.role };
      authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
    });

    it("should return 401 without auth token", async () => {
      const response = await request(app).get("/api/auth/get-user");

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /api/auth/update-profile", () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const hashedPassword = await bcryptjs.hash("Test@123", 10);
      const user = await UserModel.create({
        fullName: "Test User",
        email: "test@example.com",
        phoneNumber: "+9779876543210",
        password: hashedPassword,
        role: "user",
      });
      userId = user._id.toString();

      const payload = { id: user._id, email: user.email, role: user.role };
      authToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
    });

    it("should not allow updating email", async () => {
      const updateData = {
        email: "newemail@example.com",
      };

      const response = await request(app)
        .put("/api/auth/update-user")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      const user = await UserModel.findById(userId);
      expect(user?.email).toBe("test@example.com");
    });

    it("should not allow updating role", async () => {
      const updateData = {
        role: "admin",
      };

      const response = await request(app)
        .put("/api/auth/update-profile")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      const user = await UserModel.findById(userId);
      expect(user?.role).toBe("user");
    });
  });

  describe("POST /api/auth/request-password-reset", () => {
    beforeEach(async () => {
      const hashedPassword = await bcryptjs.hash("Test@123", 10);
      await UserModel.create({
        fullName: "Test User",
        email: "test@example.com",
        phoneNumber: "+9779876543210",
        password: hashedPassword,
        role: "user",
      });
    });

    it("should send password reset email for valid email", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "Password reset email sent",
      );
    });

    it("should return 400 when email is not provided", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });

    it("should return 404 for non-existent email", async () => {
      const response = await request(app)
        .post("/api/auth/request-password-reset")
        .send({ email: "nonexistent@example.com" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("message", "User not found");
    });
  });

  describe("POST /api/auth/reset-password/:token", () => {
    let resetToken: string;
    let userId: string;

    beforeEach(async () => {
      const hashedPassword = await bcryptjs.hash("Test@123", 10);
      const user = await UserModel.create({
        fullName: "Test User",
        email: "test@example.com",
        phoneNumber: "+9779876543210",
        password: hashedPassword,
        role: "user",
      });
      userId = user._id.toString();

      resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    });

    it("should return 400 for invalid token", async () => {
      const response = await request(app)
        .post("/api/auth/reset-password/invalid-token")
        .send({ newPassword: "NewPassword@123" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty(
        "message",
        "Invalid or expired token",
      );
    });

    it("should return 400 when new password is not provided", async () => {
      const response = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("success", false);
    });
  });

  describe("GET /api/users", () => {
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {
      const admin = await UserModel.create({
        fullName: "Admin User",
        email: "admin@example.com",
        phoneNumber: "+9779876543210",
        password: await bcryptjs.hash("Admin@123", 10),
        role: "admin",
      });

      await UserModel.create([
        {
          fullName: "User 1",
          email: "user1@example.com",
          phoneNumber: "+9779876543211",
          password: await bcryptjs.hash("User@123", 10),
          role: "user",
        },
        {
          fullName: "User 2",
          email: "user2@example.com",
          phoneNumber: "+9779876543212",
          password: await bcryptjs.hash("User@123", 10),
          role: "user",
        },
      ]);

      const adminPayload = {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      };
      adminToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: "30d" });
    });

    it("should allow admin to get all users", async () => {
      const response = await request(app)
        .get("/api/auth/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("DELETE /api/auth/:id", () => {
    let adminToken: string;
    let userToDeleteId: string;

    beforeEach(async () => {
      const admin = await UserModel.create({
        fullName: "Admin User",
        email: "admin@example.com",
        phoneNumber: "+9779876543210",
        password: await bcryptjs.hash("Admin@123", 10),
        role: "admin",
      });

      const userToDelete = await UserModel.create({
        fullName: "User to Delete",
        email: "delete@example.com",
        phoneNumber: "+9779876543211",
        password: await bcryptjs.hash("User@123", 10),
        role: "user",
      });
      userToDeleteId = userToDelete._id.toString();

      const adminPayload = {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      };
      adminToken = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: "30d" });
    });

    it("should allow admin to delete a user", async () => {
      const response = await request(app)
        .delete(`/api/auth/${userToDeleteId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty(
        "message",
        "User deleted successfully",
      );

      const deletedUser = await UserModel.findById(userToDeleteId);
      expect(deletedUser).toBeNull();
    });

    it("should return 404 for non-existent user", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/auth/${nonExistentId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("success", false);
    });
  });
});
