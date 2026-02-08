import { Request, Response } from "express";
import z from "zod";
import {
  CreateOrganizationDetailsDto,
  UpdateOrganizationDetailsDto,
} from "../dtos/organization.dto";
import { OrganizationDetailsService } from "../services/organization.service";

const organizationDetailsService = new OrganizationDetailsService();

export class OrganizationDetailsController {
  async createDetails(req: Request, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId || req.user?.role !== "organization") {
        return res.status(403).json({
          success: false,
          message: "Only organizations can create details",
        });
      }

      const parsed = CreateOrganizationDetailsDto.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues.map((e) => e.message).join(", "),
        });
      }

      const organization =
        await organizationDetailsService.createOrganizationDetails(
          userId.toString(),
          parsed.data,
        );

      return res.status(201).json({
        success: true,
        message: "Organization details created successfully",
        data: organization,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getMyDetails(req: Request, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId || req.user?.role !== "organization") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const organization =
        await organizationDetailsService.getOrganizationByUserId(
          userId.toString(),
        );

      return res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async updateMyDetails(req: Request, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId || req.user?.role !== "organization") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const parsed = UpdateOrganizationDetailsDto.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues.map((e) => e.message).join(", "),
        });
      }

      const organization =
        await organizationDetailsService.updateOrganizationDetails(
          userId.toString(),
          parsed.data,
        );

      return res.status(200).json({
        success: true,
        message: "Organization details updated successfully",
        data: organization,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async deleteMyDetails(req: Request, res: Response) {
    try {
      const userId = req.user?._id;

      if (!userId || req.user?.role !== "organization") {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const org = await organizationDetailsService.getOrganizationByUserId(
        userId.toString(),
      );

      await org.deleteOne();

      return res.status(200).json({
        success: true,
        message: "Organization details deleted successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}
