import { AppointmentService } from "../../services/appointment/appointment.service";
import { AppointmentRepository } from "../../repositories/appointment.repository";
import { OrganizationModel } from "../../models/organization.model";
import { AppointmentModel } from "../../models/appointment.model";
import { HttpError } from "../../errors/http-error";

jest.mock("../../models/organization.model");
jest.mock("../../models/appointment.model");
jest.mock("../../configs/email", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

const VALID_ID = "507f1f77bcf86cd799439011";
const VALID_ID_2 = "507f1f77bcf86cd799439012";
const VALID_ORG_ID = "507f1f77bcf86cd799439013";

describe("AppointmentService", () => {
  let service: AppointmentService;

  let createAppointment: jest.SpyInstance;
  let getAppointmentById: jest.SpyInstance;
  let getAppointmentByUser: jest.SpyInstance;
  let getAppointmentByOrganization: jest.SpyInstance;
  let updateAppointment: jest.SpyInstance;
  let cancelAppointment: jest.SpyInstance;
  let completeAppointment: jest.SpyInstance;
  let deleteAppointment: jest.SpyInstance;
  let checkAvailability: jest.SpyInstance;
  let getAppointmentByDateRange: jest.SpyInstance;
  let findAll: jest.SpyInstance;

  const mockAppointment = {
    _id: VALID_ID,
    organizationId: { toString: () => VALID_ORG_ID },
    userId: { toString: () => VALID_ID_2 },
    departmentId: VALID_ID,
    departmentName: "Cardiology",
    clientName: "John Doe",
    clientEmail: "john@example.com",
    clientPhoneNumber: "+977123456789",
    date: new Date("2025-01-15"),
    timeslot: { startTime: "09:00", endTime: "09:30" },
    status: "pending",
    paymentAmount: 500,
  };

  const mockOrganization = {
    _id: VALID_ORG_ID,
    departments: [{ _id: { toString: () => VALID_ID }, name: "Cardiology" }],
  };

  const mockUser = {
    _id: VALID_ID_2,
    role: "user",
  };

  beforeEach(() => {
    service = new AppointmentService();

    createAppointment = jest.spyOn(
      AppointmentRepository.prototype,
      "createAppointment",
    );
    getAppointmentById = jest.spyOn(
      AppointmentRepository.prototype,
      "getAppointmentById",
    );
    getAppointmentByUser = jest.spyOn(
      AppointmentRepository.prototype,
      "getAppointmentByUser",
    );
    getAppointmentByOrganization = jest.spyOn(
      AppointmentRepository.prototype,
      "getAppointmentByOrganization",
    );
    updateAppointment = jest.spyOn(
      AppointmentRepository.prototype,
      "updateAppointment",
    );
    cancelAppointment = jest.spyOn(
      AppointmentRepository.prototype,
      "cancelAppointment",
    );
    completeAppointment = jest.spyOn(
      AppointmentRepository.prototype,
      "completeAppointment",
    );
    deleteAppointment = jest.spyOn(
      AppointmentRepository.prototype,
      "deleteAppointment",
    );
    checkAvailability = jest.spyOn(
      AppointmentRepository.prototype,
      "checkAvailability",
    );
    getAppointmentByDateRange = jest.spyOn(
      AppointmentRepository.prototype,
      "getAppointmentByDateRange",
    );
    findAll = jest.spyOn(AppointmentRepository.prototype, "findAll");
  });

  afterEach(() => jest.restoreAllMocks());

  describe("createAppointment", () => {
    const appointmentData = {
      organizationId: VALID_ORG_ID,
      departmentId: VALID_ID,
      clientName: "John Doe",
      clientEmail: "john@example.com",
      clientPhoneNumber: "+977123456789",
      date: new Date("2025-01-15"),
      timeslot: { startTime: "09:00", endTime: "09:30", isAvailable: true },
      paymentAmount: 500,
      paymentMethod: "online" as const,
    };

    it("should throw 404 if organization not found", async () => {
      (OrganizationModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.createAppointment(appointmentData)).rejects.toThrow(
        new HttpError(404, "Organization not found"),
      );
    });

    it("should throw 409 if time slot already booked", async () => {
      (OrganizationModel.findById as jest.Mock).mockResolvedValue(
        mockOrganization,
      );
      (AppointmentModel.findOne as jest.Mock).mockResolvedValue(
        mockAppointment,
      );

      await expect(service.createAppointment(appointmentData)).rejects.toThrow(
        new HttpError(
          409,
          `This time slot is already booked for department: Cardiology`,
        ),
      );
    });

    it("should create appointment successfully", async () => {
      (OrganizationModel.findById as jest.Mock).mockResolvedValue(
        mockOrganization,
      );
      (AppointmentModel.findOne as jest.Mock).mockResolvedValue(null);
      createAppointment.mockResolvedValue(mockAppointment as any);

      const result = await service.createAppointment(appointmentData, mockUser);
      expect(result).toEqual(mockAppointment);
      expect(createAppointment).toHaveBeenCalledTimes(1);
    });
  });

  describe("getAppointmentById", () => {
    it("should throw 400 for invalid ID", async () => {
      await expect(service.getAppointmentById("bad-id")).rejects.toThrow(
        new HttpError(400, "Invaild appointment ID"),
      );
    });

    it("should return appointment when found", async () => {
      getAppointmentById.mockResolvedValue(mockAppointment as any);

      const result = await service.getAppointmentById(VALID_ID);
      expect(result).toEqual(mockAppointment);
    });
  });

  describe("getUserAppointments", () => {
    it("should throw 400 for invalid user ID", async () => {
      await expect(service.getUserAppointments("bad-id")).rejects.toThrow(
        new HttpError(400, "Invaild user ID"),
      );
    });
  });

  describe("cancelAppointment", () => {
    it("should throw 404 if appointment not found", async () => {
      getAppointmentById.mockResolvedValue(null);

      await expect(
        service.cancelAppointment(VALID_ID, mockUser),
      ).rejects.toThrow(new HttpError(404, "Appointment not found"));
    });

    it("should throw 400 if appointment already completed", async () => {
      const completedAppointment = {
        ...mockAppointment,
        status: "completed",
        userId: { toString: () => VALID_ID_2 },
      };
      getAppointmentById.mockResolvedValue(completedAppointment as any);
      const ownerUser = { _id: VALID_ID_2, role: "user" };

      await expect(
        service.cancelAppointment(VALID_ID, ownerUser),
      ).rejects.toThrow(
        new HttpError(400, "Cannot cancel a completed appointment"),
      );
    });
  });

  describe("completeAppointment", () => {
    it("should throw 403 if regular user tries to complete", async () => {
      getAppointmentById.mockResolvedValue(mockAppointment as any);

      await expect(
        service.completeAppointment(VALID_ID, mockUser),
      ).rejects.toThrow(
        new HttpError(
          403,
          "Only the organization or admin can mark appointments as completed",
        ),
      );
    });

    it("should throw 400 if already cancelled", async () => {
      const adminUser = { _id: "admin-id", role: "admin" };
      getAppointmentById.mockResolvedValue({
        ...mockAppointment,
        status: "cancelled",
      } as any);

      await expect(
        service.completeAppointment(VALID_ID, adminUser),
      ).rejects.toThrow(
        new HttpError(400, "Cannot complete a cancelled appointment"),
      );
    });

    it("should complete appointment as admin", async () => {
      const adminUser = { _id: "admin-id", role: "admin" };
      const completedResult = { ...mockAppointment, status: "completed" };

      getAppointmentById.mockResolvedValue(mockAppointment as any);
      completeAppointment.mockResolvedValue(completedResult as any);

      const result = await service.completeAppointment(VALID_ID, adminUser);
      expect(result.status).toBe("completed");
    });
  });

  describe("deleteAppointment", () => {
    it("should throw 400 for invalid ID", async () => {
      await expect(
        service.deleteAppointment("bad-id", "admin"),
      ).rejects.toThrow(new HttpError(400, "Invalid appointment ID"));
    });

    it("should delete appointment successfully", async () => {
      getAppointmentById.mockResolvedValue(mockAppointment as any);
      deleteAppointment.mockResolvedValue(true as any);

      const result = await service.deleteAppointment(VALID_ID, "admin");
      expect(result).toBe(true);
    });
  });

  describe("updateAppointment", () => {
    it("should throw 400 for invalid ID", async () => {
      await expect(
        service.updateAppointment("bad-id", {}, mockUser),
      ).rejects.toThrow(new HttpError(400, "Invalid appoitment ID"));
    });

    it("should throw 404 if appointment not found", async () => {
      getAppointmentById.mockResolvedValue(null);

      await expect(
        service.updateAppointment(VALID_ID, {}, mockUser),
      ).rejects.toThrow(new HttpError(404, "Appoitment not found"));
    });

    it("should update appointment as admin", async () => {
      const adminUser = { _id: "admin-id", role: "admin" };
      const updatedResult = { ...mockAppointment, clientName: "Updated Name" };

      getAppointmentById.mockResolvedValue(mockAppointment as any);
      updateAppointment.mockResolvedValue(updatedResult as any);

      const result = await service.updateAppointment(
        VALID_ID,
        { clientName: "Updated Name" } as any,
        adminUser,
      );
      expect(result.clientName).toBe("Updated Name");
    });
  });

  describe("getAllAppointments", () => {
    it("should return paginated appointments", async () => {
      findAll.mockResolvedValue({
        appointments: [mockAppointment],
        total: 1,
        totalPages: 1,
      } as any);

      const result = await service.getAllAppointments({ page: 1, limit: 10 });
      expect(result.appointments).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
