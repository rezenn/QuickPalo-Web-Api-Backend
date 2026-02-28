import { AdminUserService } from "../../services/admin/user.service";
import { UserRepository } from "../../repositories/user.repository";
import { HttpError } from "../../errors/http-error";

describe("AdminUserService", () => {
  let service: AdminUserService;

  let getUserById: jest.SpyInstance;
  let getUserByEmail: jest.SpyInstance;
  let createUser: jest.SpyInstance;
  let deleteUser: jest.SpyInstance;
  let updateUser: jest.SpyInstance;
  let findAll: jest.SpyInstance;
  let getAllOrganizations: jest.SpyInstance;

  beforeEach(() => {
    service = new AdminUserService();

    getUserById = jest.spyOn(UserRepository.prototype, "getUserById");
    getUserByEmail = jest.spyOn(UserRepository.prototype, "getUserByEmail");
    createUser = jest.spyOn(UserRepository.prototype, "createUser");
    deleteUser = jest.spyOn(UserRepository.prototype, "deleteUser");
    updateUser = jest.spyOn(UserRepository.prototype, "updateUser");
    findAll = jest.spyOn(UserRepository.prototype, "findAll");
    getAllOrganizations = jest.spyOn(
      UserRepository.prototype,
      "getAllOrganizations",
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("registerUser", () => {
    it("should throw 409 if email already exists", async () => {
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

    it("should create admin user successfully", async () => {
      getUserByEmail.mockResolvedValue(null);
      createUser.mockResolvedValue({
        email: "new@test.com",
        role: "admin",
      } as any);

      const result = await service.registerUser({
        fullName: "Admin",
        email: "new@test.com",
        phoneNumber: "+977123456789",
        password: "Password@123",
      });

      expect(result.role).toBe("admin");
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

    it("should throw 404 when user not found", async () => {
      getUserById.mockResolvedValue(null);

      await expect(service.getOneUser("fake123")).rejects.toThrow(
        new HttpError(404, "User not found"),
      );
    });
  });

  describe("deleteOneUser", () => {
    it("should delete non-admin user successfully", async () => {
      getUserById.mockResolvedValue({ _id: "user123", role: "user" } as any);
      deleteUser.mockResolvedValue(true as any);

      const result = await service.deleteOneUser("user123");
      expect(result).toBe(true);
      expect(deleteUser).toHaveBeenCalledWith("user123");
    });

    it("should throw 404 if user not found", async () => {
      getUserById.mockResolvedValue(null);

      await expect(service.deleteOneUser("fake123")).rejects.toThrow(
        new HttpError(404, "User not found"),
      );
    });

    it("should throw 403 when deleting an admin", async () => {
      getUserById.mockResolvedValue({ _id: "admin123", role: "admin" } as any);

      await expect(service.deleteOneUser("admin123")).rejects.toThrow(
        new HttpError(403, "Cannot delete admin users"),
      );
    });

    it("should throw 500 if deletion fails", async () => {
      getUserById.mockResolvedValue({ _id: "user123", role: "user" } as any);
      deleteUser.mockResolvedValue(false as any);

      await expect(service.deleteOneUser("user123")).rejects.toThrow(
        new HttpError(500, "Failed to delete user"),
      );
    });
  });

  describe("updateOneUser", () => {
    it("should update user successfully", async () => {
      const mockUser = { _id: "user123", role: "user", profilePicture: null };
      const mockUpdated = { _id: "user123", fullName: "Updated" };
      getUserById.mockResolvedValue(mockUser as any);
      updateUser.mockResolvedValue(mockUpdated as any);

      const result = await service.updateOneUser("user123", {
        fullName: "Updated",
      });
      expect(result).toEqual(mockUpdated);
    });

    it("should throw 404 if user not found", async () => {
      getUserById.mockResolvedValue(null);

      await expect(
        service.updateOneUser("fake123", { fullName: "X" }),
      ).rejects.toThrow(new HttpError(404, "User not found"));
    });

    it("should throw 500 if update fails", async () => {
      getUserById.mockResolvedValue({ _id: "user123", role: "user" } as any);
      updateUser.mockResolvedValue(null as any);

      await expect(
        service.updateOneUser("user123", { fullName: "X" }),
      ).rejects.toThrow(new HttpError(500, "Failed to update user"));
    });
  });

  describe("getAllUsers", () => {
    it("should return paginated users", async () => {
      const mockUsers = [
        { toObject: () => ({ _id: "1", email: "a@test.com" }) },
        { toObject: () => ({ _id: "2", email: "b@test.com" }) },
      ];
      findAll.mockResolvedValue({ users: mockUsers as any, total: 2 });

      const result = await service.getAllUsers({ page: "1", size: "10" });

      expect(result.users).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe("getAllOrganizations", () => {
    it("should return organizations", async () => {
      const mockOrgs = [{ _id: "org1" }, { _id: "org2" }];
      getAllOrganizations.mockResolvedValue(mockOrgs as any);

      const result = await service.getAllOrganizations();
      expect(result).toEqual(mockOrgs);
      expect(getAllOrganizations).toHaveBeenCalled();
    });

    it("should return empty array when none found", async () => {
      getAllOrganizations.mockResolvedValue([]);

      const result = await service.getAllOrganizations();
      expect(result).toEqual([]);
    });
  });
});
