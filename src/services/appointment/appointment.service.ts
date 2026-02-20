import { AppointmentRepository } from "../../repositories/appointment.repository";
import { CreateAppointmentDtoType } from "../../dtos/appointment.dto";
import { HttpError } from "../../errors/http-error";
import mongoose from "mongoose";
import { OrganizationModel } from "../../models/organization.model";
import { UserModel } from "../../models/user.model";
import { sendEmail } from "../../configs/email";

let appointmentRepository = new AppointmentRepository();

export class AppointmentService {
  async createAppointment(
    appointmentData: CreateAppointmentDtoType,
    userId?: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(appointmentData.organizationId)) {
      throw new HttpError(400, "Invalid organization ID");
    }

    const organization = await OrganizationModel.findById(
      appointmentData.organizationId,
    );
    if (!organization) {
      throw new HttpError(404, "Organization not found");
    }

    const departmentExists = organization.departments?.some(
      (dept: any) =>
        dept._id?.toString() === appointmentData.departmentId ||
        dept.name === appointmentData.departmentName,
    );
    if (
      !departmentExists &&
      organization.departments &&
      organization.departments.length > 0
    ) {
      throw new HttpError(400, "Department not found in this organization");
    }
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (organization.advanceBookingDays || 7));
    const appointmentDate = new Date(appointmentData.date);
    if (appointmentDate > maxDate) {
      throw new HttpError(
        400,
        `Appointment can only be booked up to ${organization.advanceBookingDays || 7} days in advance`,
      );
    }

    const isAvailable = await appointmentRepository.checkAvailability(
      appointmentData.organizationId,
      appointmentData.date,
      appointmentData.timeslot.startTime,
      appointmentData.timeslot.endTime,
    );
    if (!isAvailable) {
      throw new HttpError(409, "Time slot is not available");
    }
    const newAppointment = await appointmentRepository.createAppointment({
      ...appointmentData,
      userId: userId || appointmentData.userId || "guest",
    });

    await this.sendAppointmentConfirmationEmail(newAppointment);

    return newAppointment;
  }

  async getAppointmentById(appointmentId: string) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new HttpError(400, "Invaild appointment ID");
    }
    const appointment =
      await appointmentRepository.getAppointmentById(appointmentId);
    if (!appointmentId) {
      throw new HttpError(404, "Appoitment not found");
    }
    return appointment;
  }

  async getUserAppointments(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new HttpError(400, "Invaild user ID");
    }
    const appointments =
      await appointmentRepository.getAppointmentByUser(userId);
    return appointments;
  }

  async getOrganizationAppointments(
    organizationId: string,
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      departmentId?: string;
    },
  ) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new HttpError(400, "Invalid organization ID");
    }

    const appointments =
      await appointmentRepository.getAppointmentByOrganization(
        organizationId,
        filters,
      );
    return appointments;
  }

  async updateAppointment(
    appointmentId: string,
    updateData: Partial<CreateAppointmentDtoType>,
    userId: string,
    userRole: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new HttpError(400, "Invalid appoitment ID");
    }
    const existingAppoitment =
      await appointmentRepository.getAppointmentById(appointmentId);

    if (!existingAppoitment) {
      throw new HttpError(404, "Appoitment not found");
    }

    if (
      userRole !== "admin" &&
      existingAppoitment.userId.toString() !== userId &&
      existingAppoitment.organizationId.toString() !== userId
    ) {
      throw new HttpError(
        403,
        "You do not have permission to update this appoitment",
      );
    }

    if (updateData.timeslot || updateData.date) {
      const newDate = updateData.date || existingAppoitment.date;
      const newTimeslot = updateData.timeslot || existingAppoitment.timeslot;
    }

    const updateAppointment = await appointmentRepository.updateAppointment(
      appointmentId,
      updateData,
    );

    if (!updateAppointment) {
      throw new HttpError(500, "Failed to update appoitment");
    }

    await this.sendAppointmentUpdateEmail(updateAppointment);

    return updateAppointment;
  }

  async cancelAppointment(
    appointmentId: string,
    userId: string,
    userRole: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new HttpError(400, "Invalid appoitment ID");
    }

    const existingAppoitment =
      await appointmentRepository.getAppointmentById(appointmentId);

    if (!existingAppoitment) {
      throw new HttpError(404, "Appoitment not found");
    }

    if (
      userRole !== "admin" &&
      existingAppoitment.userId.toString() !== userId &&
      existingAppoitment.organizationId.toString() !== userId
    ) {
      throw new HttpError(
        403,
        "You do not have permission to cancel this appoitment",
      );
    }

    if (existingAppoitment.status === "completed") {
      throw new HttpError(400, "Cannot cancel a completed appointment");
    }

    if (existingAppoitment.status === "cancelled") {
      throw new HttpError(400, "Appoitment is already cancelled");
    }

    const cancelledAppointment =
      await appointmentRepository.cancelAppointment(appointmentId);

    if (!cancelledAppointment) {
      throw new HttpError(500, "Failed to cancel appointment");
    }

    await this.sendAppointmentCancellationEmail(cancelledAppointment);
    return cancelledAppointment;
  }

  async completeAppointment(appointmentId: string, organizationId: string) {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new HttpError(400, "Invalid appoitment ID");
    }

    const existingAppointment =
      await appointmentRepository.getAppointmentById(appointmentId);

    if (!existingAppointment) {
      throw new HttpError(404, "Appointment not found");
    }
    if (existingAppointment.organizationId.toString() !== organizationId) {
      throw new HttpError(
        403,
        "Only the organization can mark appointments as completed",
      );
    }

    if (existingAppointment.status === "cancelled") {
      throw new HttpError(400, "Cannot complete a cancelled appointment");
    }

    if (existingAppointment.status === "completed") {
      throw new HttpError(400, "Appointment is already completed");
    }
    const completedAppointment =
      await appointmentRepository.completeAppointment(appointmentId);

    if (!completedAppointment) {
      throw new HttpError(500, "Failed to complete appointment");
    }

    return completedAppointment;
  }
  async deleteAppointment(appointmentId: string, userRole: string) {
    if (userRole !== "admin") {
      throw new HttpError(403, "Only admins can delete appointments");
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new HttpError(400, "Invalid appointment ID");
    }

    const existingAppointment =
      await appointmentRepository.getAppointmentById(appointmentId);

    if (!existingAppointment) {
      throw new HttpError(404, "Appointment not found");
    }
    const result = await appointmentRepository.deleteAppointment(appointmentId);

    if (!result) {
      throw new HttpError(500, "Failed to delete appointment");
    }

    return result;
  }
  async checkAvailability(
    organizationId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new HttpError(400, "Invalid organization ID");
    }

    const isAvailable = await appointmentRepository.checkAvailability(
      organizationId,
      date,
      startTime,
      endTime,
    );

    return { isAvailable };
  }

  async getAppointmentsByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new HttpError(400, "Invalid organization ID");
    }

    const appointments = await appointmentRepository.getAppointmentByDateRange(
      organizationId,
      startDate,
      endDate,
    );

    return appointments;
  }
  async getAllAppointments(filters: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    organizationId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const result = await appointmentRepository.findAll(filters);
    return result;
  }

  private async sendAppointmentConfirmationEmail(appointment: any) {
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Appointment Confirmed!</h2>
          </div>
          <div class="content">
            <p>Dear ${appointment.clientName},</p>
            <p>Your appointment has been confirmed. Here are the details:</p>
            
            <div class="details">
              <p><strong>Organization:</strong> ${appointment.organizationId}</p>
              <p><strong>Department:</strong> ${appointment.departmentName}</p>
              <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${appointment.timeslot.startTime} - ${appointment.timeslot.endTime}</p>
              <p><strong>Status:</strong> ${appointment.status}</p>
            </div>
            
            <p>You can view and manage your appointment here:</p>
            <p><a href="${CLIENT_URL}/appointments/${appointment._id}">View Appointment</a></p>
            
            <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing our service!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(appointment.clientEmail, "Appointment Confirmation", html);
  }

  private async sendAppointmentUpdateEmail(appointment: any) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Appointment Updated</h2>
          </div>
          <div class="content">
            <p>Dear ${appointment.clientName},</p>
            <p>Your appointment has been updated. Here are the new details:</p>
            
            <div class="details">
              <p><strong>Organization:</strong> ${appointment.organizationId}</p>
              <p><strong>Department:</strong> ${appointment.departmentName}</p>
              <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${appointment.timeslot.startTime} - ${appointment.timeslot.endTime}</p>
              <p><strong>Status:</strong> ${appointment.status}</p>
            </div>
            
            <p>If you have any questions, please contact the organization directly.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing our service!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(appointment.clientEmail, "Appointment Updated", html);
  }

  private async sendAppointmentCancellationEmail(appointment: any) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Appointment Cancelled</h2>
          </div>
          <div class="content">
            <p>Dear ${appointment.clientName},</p>
            <p>Your appointment has been cancelled. Here are the details of the cancelled appointment:</p>
            
            <div class="details">
              <p><strong>Organization:</strong> ${appointment.organizationId}</p>
              <p><strong>Department:</strong> ${appointment.departmentName}</p>
              <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${appointment.timeslot.startTime} - ${appointment.timeslot.endTime}</p>
            </div>
            
            <p>If you'd like to book another appointment, please visit our website.</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing our service!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(appointment.clientEmail, "Appointment Cancelled", html);
  }
}
