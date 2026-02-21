import { QueryFilter } from "mongoose";
import { AppointmentModel, IAppointment } from "../models/appointment.model";
import { CreateAppointmentDtoType } from "../dtos/appointment.dto";
import mongoose from "mongoose";
import { OrganizationModel } from "../models/organization.model";

export interface IAppointmentRepository {
  createAppointment(
    appointmentData: Partial<IAppointment>,
  ): Promise<IAppointment>;
  getAppointmentById(userId: string): Promise<IAppointment | null>;
  getAppointmentByUser(userId: string): Promise<IAppointment[]>;
  getAppointmentByOrganization(
    organizationId: string,
    filter?: any,
  ): Promise<IAppointment[]>;
  updateAppointment(
    appointmentId: string,
    updateData: Partial<IAppointment>,
  ): Promise<IAppointment | null>;
  deleteAppointment(appointmentId: string): Promise<boolean | null>;
  cancelAppointment(appointmentId: string): Promise<IAppointment | null>;
  completeAppointment(appointmentId: string): Promise<IAppointment | null>;
  checkAvailability(
    organizationId: string,
    date: Date,
    startTime: string,
    endTime: string,
    departmentId?: string,
  ): Promise<{
    isAvailable: boolean;
    bookedCount?: number;
    departmentName?: string;
    maxCapacity?: number;
  }>;
  getAppointmentByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<IAppointment[]>;
  findAll({
    page,
    limit,
    search,
    status,
    organizationId,
    userId,
    startDate,
    endDate,
  }: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    organizationId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    appointments: IAppointment[];
    total: number;
    totalPages: number;
  }>;
}

export class AppointmentRepository implements IAppointmentRepository {
  async createAppointment(
    appointmentData: Partial<IAppointment>,
  ): Promise<IAppointment> {
    const appointment = new AppointmentModel(appointmentData);
    await appointment.save();
    return appointment;
  }

  async getAppointmentById(
    appointmentId: string,
  ): Promise<IAppointment | null> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return null;
    }
    const appointment = await AppointmentModel.findById(appointmentId);
    return appointment;
  }

  async getAppointmentByUser(userId: string): Promise<IAppointment[]> {
    const appointments = await AppointmentModel.find({ userId }).sort({
      date: -1,
      "timeslot.startTime": -1,
    });
    return appointments;
  }
  async getAppointmentByOrganization(
    organizationId: string,
    filters?: any,
  ): Promise<IAppointment[]> {
    const query: any = { organizationId };

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }
    if (filters?.departmentId) {
      query.departmentId = filters.departmentId;
    }
    const appointments = await AppointmentModel.find(query).sort({
      date: -1,
      "timeslot.startTime": -1,
    });
    return appointments;
  }
  async updateAppointment(
    appointmentId: string,
    updateData: Partial<IAppointment>,
  ): Promise<IAppointment | null> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return null;
    }
    const updateAppointment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true },
    );
    return updateAppointment;
  }
  async deleteAppointment(appointmentId: string): Promise<boolean | null> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return null;
    }
    const result = await AppointmentModel.findByIdAndDelete(appointmentId);
    return result ? true : false;
  }
  async cancelAppointment(appointmentId: string): Promise<IAppointment | null> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return null;
    }
    const cancelledAppointment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      { status: "cancelled" },
      { new: true },
    );
    return cancelledAppointment;
  }
  async completeAppointment(
    appointmentId: string,
  ): Promise<IAppointment | null> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return null;
    }
    const completedAppoitment = await AppointmentModel.findByIdAndUpdate(
      appointmentId,
      { status: "completed" },
      { new: true },
    );
    return completedAppoitment;
  }
  async checkAvailability(
    organizationId: string,
    date: Date,
    startTime: string,
    endTime: string,
    departmentId?: string, // Make departmentId optional
  ): Promise<{
    isAvailable: boolean;
    bookedCount?: number;
    departmentName?: string;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Base query
    const query: any = {
      organizationId,
      date: { $gte: startOfDay, $lte: endOfDay },
      "timeslot.startTime": startTime,
      "timeslot.endTime": endTime,
      status: { $nin: ["cancelled", "completed"] },
    };

    if (departmentId) {
      query.departmentId = departmentId;

      const conflictingAppointment = await AppointmentModel.findOne(query);

      if (conflictingAppointment) {
        const organization = await OrganizationModel.findById(organizationId);
        const department = organization?.departments?.find(
          (dept: any) => dept._id?.toString() === departmentId,
        );

        return {
          isAvailable: false,
          bookedCount: 1,
          departmentName: department?.name,
        };
      }

      return { isAvailable: true, bookedCount: 0 };
    } else {
      const count = await AppointmentModel.countDocuments(query);
      return {
        isAvailable: count === 0,
        bookedCount: count,
      };
    }
  }
  async getAppointmentByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<IAppointment[]> {
    throw new Error("Method not implemented.");
  }
  async findAll({
    page,
    limit,
    search,
    status,
    organizationId,
    userId,
    startDate,
    endDate,
  }: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    organizationId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    appointments: IAppointment[];
    total: number;
    totalPages: number;
  }> {
    let filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (organizationId && mongoose.Types.ObjectId.isValid(organizationId)) {
      filter.organizationId = organizationId;
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    if (search) {
      filter.$or = [
        { clientName: { $regex: search, $options: "i" } },
        { clientEmail: { $regex: search, $options: "i" } },
        { clientPhoneNumber: { $regex: search, $options: "i" } },
        { departmentName: { $regex: search, $options: "i" } },
      ];
    }
    const [appointments, total] = await Promise.all([
      AppointmentModel.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ date: -1, createdAt: -1 }),
      AppointmentModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { appointments, total, totalPages };
  }
}
