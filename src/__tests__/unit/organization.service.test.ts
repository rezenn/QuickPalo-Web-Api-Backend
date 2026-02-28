import { OrganizationDetailsService } from "../../services/organization/organization.service";
import { OrganizationModel } from "../../models/organization.model";
import { HttpError } from "../../errors/http-error";

jest.mock("../../models/organization.model");

describe("OrganizationDetailsService", () => {
  let service: OrganizationDetailsService;

  beforeEach(() => {
    service = new OrganizationDetailsService();
    jest.clearAllMocks();
  });

  describe("createOrganizationDetails", () => {
    it("should throw 409 if details already exist", async () => {
      (OrganizationModel.findOne as jest.Mock).mockResolvedValue({
        _id: "existing",
      });

      await expect(
        service.createOrganizationDetails("user123", {} as any),
      ).rejects.toThrow(
        new HttpError(409, "Organization details already exist"),
      );
    });

    it("should create and return organization details", async () => {
      (OrganizationModel.findOne as jest.Mock).mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue(undefined);
      const mockInstance = {
        save: saveMock,
        organizationName: "City Hospital",
      };
      (OrganizationModel as any).mockImplementation(() => mockInstance);

      const result = await service.createOrganizationDetails("user123", {
        organizationName: "City Hospital",
      } as any);

      expect(saveMock).toHaveBeenCalled();
      expect(result.organizationName).toBe("City Hospital");
    });
  });

  describe("getOrganizationByUserId", () => {
    it("should return organization when found", async () => {
      const mockOrg = { _id: "org123", organizationName: "City Hospital" };
      (OrganizationModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockOrg),
      });

      const result = await service.getOrganizationByUserId("user123");
      expect(result).toEqual(mockOrg);
    });

    it("should throw 404 if not found", async () => {
      (OrganizationModel.findOne as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(service.getOrganizationByUserId("user123")).rejects.toThrow(
        new HttpError(404, "Organization details not found"),
      );
    });
  });

  describe("updateOrganizationDetails", () => {
    it("should update and return organization", async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);
      const mockOrg = {
        organizationName: "Old Name",
        save: saveMock,
      };
      (OrganizationModel.findOne as jest.Mock).mockResolvedValue(mockOrg);

      const result = await service.updateOrganizationDetails("user123", {
        organizationName: "New Name",
      });

      expect(saveMock).toHaveBeenCalled();
      expect(result.organizationName).toBe("New Name");
    });

    it("should throw 404 if organization not found", async () => {
      (OrganizationModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateOrganizationDetails("user123", { organizationName: "X" }),
      ).rejects.toThrow(new HttpError(404, "Organization details not found"));
    });
  });

  describe("getOrganizationById", () => {
    it("should throw 400 for invalid ID", async () => {
      await expect(service.getOrganizationById("invalid-id")).rejects.toThrow(
        new HttpError(400, "Invalid organization ID"),
      );
    });

    it("should throw 404 if no result from aggregate", async () => {
      (OrganizationModel.aggregate as jest.Mock).mockResolvedValue([]);

      await expect(
        service.getOrganizationById("507f1f77bcf86cd799439011"),
      ).rejects.toThrow(new HttpError(404, "Organization not found"));
    });

    it("should return organization when found", async () => {
      const mockOrg = {
        _id: "507f1f77bcf86cd799439011",
        organizationName: "City Hospital",
      };
      (OrganizationModel.aggregate as jest.Mock).mockResolvedValue([mockOrg]);

      const result = await service.getOrganizationById(
        "507f1f77bcf86cd799439011",
      );
      expect(result).toEqual(mockOrg);
    });
  });
});
