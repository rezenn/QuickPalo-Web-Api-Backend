import { UserService } from "../../services/user/user.service";
import { UserRepository } from "../../repositories/user.repository";
import { OrganizationModel } from "../../models/organization.model";
import { HttpError } from "../../errors/http-error";

jest.mock("../../models/organization.model");

describe("UserService", () => {
  let service: UserService;
  let getUserById: jest.SpyInstance;
  let getUserByEmail: jest.SpyInstance;
  let createUser: jest.SpyInstance;
  let deleteUser: jest.SpyInstance;
  let updateUser: jest.SpyInstance;
  let getNormalUsers: jest.SpyInstance;

  beforeEach(() => {
    service = new UserService();
    getUserById = jest.spyOn(UserRepository.prototype, "getUserById");
    getUserByEmail = jest.spyOn(UserRepository.prototype, "getUserByEmail");
    createUser = jest.spyOn(UserRepository.prototype, "createUser");
    deleteUser = jest.spyOn(UserRepository.prototype, "deleteUser");
    updateUser = jest.spyOn(UserRepository.prototype, "updateUser");
    getNormalUsers = jest.spyOn(UserRepository.prototype, "getNormalUsers");
  });

  afterEach(() => jest.restoreAllMocks());

  describe("registerUser", () => {
    it("should throw 409 if email already in use", async () => {
      getUserByEmail.mockResolvedValue({ email: "test@test.com" });

      await expect(
        service.registerUser({
          fullName: "Test",
          email: "test@test.com",
          phoneNumber: "+977123456789",
          password: "Password@123",
        }),
      ).rejects.toThrow(new HttpError(409, "Email already in use"));
    });

    it("should create user successfully", async () => {
      getUserByEmail.mockResolvedValue(null);
      createUser.mockResolvedValue({
        email: "new@test.com",
        role: "user",
      } as any);

      const result = await service.registerUser({
        fullName: "Test",
        email: "new@test.com",
        phoneNumber: "+977123456789",
        password: "Password@123",
      });

      expect(result.role).toBe("user");
      expect(createUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("getOneUser", () => {
    it("should return user when found", async () => {
      const mockUser = { _id: "user123", fullName: "John" };
      getUserById.mockResolvedValue(mockUser as any);

      const result = await service.getOneUser("user123");
      expect(result).toEqual(mockUser);
    });

    it("should throw 404 when not found", async () => {
      getUserById.mockResolvedValue(null);

      await expect(service.getOneUser("fake123")).rejects.toThrow(
        new HttpError(404, "User not found"),
      );
    });
  });

  describe("deleteOneUser", () => {
    it("should delete user successfully", async () => {
      getUserById.mockResolvedValue({ _id: "user123", role: "user" } as any);
      deleteUser.mockResolvedValue(true as any);

      const result = await service.deleteOneUser("user123");
      expect(result).toBe(true);
    });

    it("should throw 404 if user not found", async () => {
      getUserById.mockResolvedValue(null);

      await expect(service.deleteOneUser("fake123")).rejects.toThrow(
        new HttpError(404, "User not found"),
      );
    });

    it("should throw 500 if deletion fails", async () => {
      getUserById.mockResolvedValue({ _id: "user123" } as any);
      deleteUser.mockResolvedValue(false as any);

      await expect(service.deleteOneUser("user123")).rejects.toThrow(
        new HttpError(500, "Failed to delete user"),
      );
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const mockUser = { _id: "user123", profilePicture: null };
      const mockUpdated = { _id: "user123", fullName: "Updated" };
      getUserById.mockResolvedValue(mockUser as any);
      updateUser.mockResolvedValue(mockUpdated as any);

      const result = await service.updateUser("user123", {
        fullName: "Updated",
      });
      expect(result).toEqual(mockUpdated);
    });

    it("should throw 404 if user not found", async () => {
      getUserById.mockResolvedValue(null);

      await expect(
        service.updateUser("fake123", { fullName: "X" }),
      ).rejects.toThrow(new HttpError(404, "User not found"));
    });
  });

  describe("getAllUsers", () => {
    it("should return users", async () => {
      const mockUsers = [{ _id: "1" }, { _id: "2" }];
      getNormalUsers.mockResolvedValue(mockUsers as any);

      const result = await service.getAllUsers();
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no users", async () => {
      getNormalUsers.mockResolvedValue([]);

      const result = await service.getAllUsers();
      expect(result).toEqual([]);
    });
  });

  describe("loginUser", () => {
    it("should throw 404 if user not found", async () => {
      getUserByEmail.mockResolvedValue(null);

      await expect(
        service.loginUser({ email: "no@test.com", password: "pass" }),
      ).rejects.toThrow(new HttpError(404, "User not found"));
    });

    it("should throw 401 for wrong password", async () => {
      getUserByEmail.mockResolvedValue({
        email: "test@test.com",
        password: "hashedWrongPass",
      } as any);

      await expect(
        service.loginUser({ email: "test@test.com", password: "wrongpass" }),
      ).rejects.toThrow(new HttpError(401, "Invaild credentials"));
    });
  });

  describe("getOrganizationById", () => {
    it("should throw 400 for invalid ID", async () => {
      await expect(service.getOrganizationById("bad-id")).rejects.toThrow(
        new HttpError(400, "Invalid organization ID"),
      );
    });

    it("should throw 404 if not found", async () => {
      (OrganizationModel.aggregate as jest.Mock).mockResolvedValue([]);

      await expect(
        service.getOrganizationById("507f1f77bcf86cd799439011"),
      ).rejects.toThrow(new HttpError(404, "Organization not found"));
    });
  });
});
