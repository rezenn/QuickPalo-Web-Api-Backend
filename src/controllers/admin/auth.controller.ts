import z, { success } from "zod";
import { Request, Response } from "express";
import { RegisterUserDto, UpdateUserDto } from "../../dtos/user.dto";
import { AdminUserService } from "../../services/admin/user.service";
import { CreateOrganizationDto } from "../../dtos/organization.dto";

let adminUserService = new AdminUserService();

export class AdminUserController {
  async createUser(req: Request, res: Response) {
    try {
      const parsedData = RegisterUserDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const newAdmin = await adminUserService.registerUser(parsedData.data);
      return res.status(201).json({
        success: true,
        message: "register successful",
        data: newAdmin,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server Error",
      });
    }
  }

  async getOneUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const user = await adminUserService.getOneUser(userId);
      return res
        .status(200)
        .json({ success: true, data: user, message: "User fetched" });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server Error",
      });
    }
  }
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await adminUserService.getAllUsers();
      return res.status(200).json({
        success: true,
        data: users,
        message: "Users fetched successfully",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Servicee Error",
      });
    }
  }
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      await adminUserService.deleteOneUser(userId);
      return res.status(200).json({ success: true, message: "User deleted" });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Servicee Error",
      });
    }
  }
  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const parsed = UpdateUserDto.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsed.error),
        });
      }

      const user = await adminUserService.updateOneUser(userId, parsed.data);
      return res.status(200).json({
        success: true,
        data: user,
        message: "User data Updated successfully",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Servicee Error",
      });
    }
  }
  async createOrganization(req: Request, res: Response) {
    try {
      const parsed = CreateOrganizationDto.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsed.error),
        });
      }
      const org = await adminUserService.createOrganization(parsed.data);

      return res.status(201).json({
        success: true,
        message: "Organization created successfully",
        data: org,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Servicee Error",
      });
    }
  }
}
