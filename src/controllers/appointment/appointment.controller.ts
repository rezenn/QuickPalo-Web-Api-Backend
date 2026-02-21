import { Request, Response } from "express";
import { AppointmentService } from "../../services/appointment/appointment.service";
import { CreateAppointmentDto } from "../../dtos/appointment.dto";
import z from "zod";
import { HttpError } from "../../errors/http-error";

let appointmentService = new AppointmentService();

export class AppointmentController {
  async createAppointment(req: Request, res: Response) {
    try {
      const parsedData = CreateAppointmentDto.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const newAppointment = await appointmentService.createAppointment(
        parsedData.data,
        req.user,
      );

      return res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: newAppointment,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getAppointmentById(req: Request, res: Response) {
    try {
      const appointmentId = req.params.id;

      const appointment =
        await appointmentService.getAppointmentById(appointmentId);

      return res.status(200).json({
        success: true,
        message: "Appointment fetched successfully",
        data: appointment,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getUserAppointments(req: Request, res: Response) {
    try {
      const userId = req.user?._id?.toString();

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const appointments = await appointmentService.getUserAppointments(userId);

      return res.status(200).json({
        success: true,
        message: "User appointments fetched successfully",
        data: appointments,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getOrganizationAppointments(req: Request, res: Response) {
    try {
      const organizationId = req.params.organizationId;
      const { status, startDate, endDate, departmentId } = req.query;

      // Check if user has access to this organization's appointments
      const userRole = req.user?.role;
      const userId = req.user?._id?.toString();

      if (userRole !== "admin" && userId !== organizationId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view these appointments",
        });
      }

      const filters: any = {};
      if (status) filters.status = status;
      if (departmentId) filters.departmentId = departmentId;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const appointments = await appointmentService.getOrganizationAppointments(
        organizationId,
        filters,
      );

      return res.status(200).json({
        success: true,
        message: "Organization appointments fetched successfully",
        data: appointments,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async updateAppointment(req: Request, res: Response) {
    try {
      const appointmentId = req.params.id;

      const parsedData = CreateAppointmentDto.partial().safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const updatedAppointment = await appointmentService.updateAppointment(
        appointmentId,
        parsedData.data,
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: "Appointment updated successfully",
        data: updatedAppointment,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async cancelAppointment(req: Request, res: Response) {
    try {
      const appointmentId = req.params.id;
      //   const userId = req.user?._id?.toString();
      //   const userRole = req.user?.role || "user";

      const cancelledAppointment = await appointmentService.cancelAppointment(
        appointmentId,
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully",
        data: cancelledAppointment,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async completeAppointment(req: Request, res: Response) {
    try {
      const appointmentId = req.params.id;

      const completedAppointment = await appointmentService.completeAppointment(
        appointmentId,
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: "Appointment completed successfully",
        data: completedAppointment,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async deleteAppointment(req: Request, res: Response) {
    try {
      const appointmentId = req.params.id;
      const userRole = req.user?.role || "user";

      await appointmentService.deleteAppointment(appointmentId, userRole);

      return res.status(200).json({
        success: true,
        message: "Appointment deleted successfully",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async checkAvailability(req: Request, res: Response) {
    try {
      const { organizationId, date, startTime, endTime } = req.query;

      if (!organizationId || !date || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message:
            "Organization ID, date, start time, and end time are required",
        });
      }

      const availability = await appointmentService.checkAvailability(
        organizationId as string,
        new Date(date as string),
        startTime as string,
        endTime as string,
      );

      return res.status(200).json({
        success: true,
        message: "Availability checked successfully",
        data: availability,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getAllAppointments(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        organizationId,
        userId,
        startDate,
        endDate,
      } = req.query;

      const userRole = req.user?.role;

      // Only admins can view all appointments
      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can view all appointments",
        });
      }

      const result = await appointmentService.getAllAppointments({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as string,
        organizationId: organizationId as string,
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      return res.status(200).json({
        success: true,
        message: "Appointments fetched successfully",
        data: result.appointments,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getAppointmentsByDateRange(req: Request, res: Response) {
    try {
      const { organizationId, startDate, endDate } = req.query;

      if (!organizationId || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Organization ID, start date, and end date are required",
        });
      }

      const appointments = await appointmentService.getAppointmentsByDateRange(
        organizationId as string,
        new Date(startDate as string),
        new Date(endDate as string),
        req.user,
      );

      return res.status(200).json({
        success: true,
        message: "Appointments fetched successfully",
        data: appointments,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}
