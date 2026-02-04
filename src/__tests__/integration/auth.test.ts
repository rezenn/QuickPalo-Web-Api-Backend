import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";

jest.setTimeout(30000); // Set global timeout to 30 seconds

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
        .send(testUser); // test case implementation

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Registered successfully",
      );
    });
  });
});
