import z, { success } from "zod";
import { Request, Response } from "express";
import { RegisterUserDto, UpdateUserDto } from "../../dtos/user.dto";
import { AdminUserService } from "../../services/admin/user.service";
import { CreateNewUserDto } from "../../dtos/admin.dto";
import { HttpError } from "../../errors/http-error";
import { CreateOrganizationDto } from "../../dtos/organization.dto";

let adminUserService = new AdminUserService();

interface QueryParams {
  page?: string;
  size?: string;
  search?: string;
  role?: string;
}
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

      const userObj = user.toObject();
      delete userObj.password;

      if (userObj.profilePicture) {
        userObj.imageUrl = `${req.protocol}://${req.get("host")}/uploads/profile/${userObj.profilePicture}`;
      }

      return res
        .status(200)
        .json({ success: true, data: userObj, message: "User fetched" });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server Error",
      });
    }
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const { page, size, search, role }: QueryParams = req.query;

      const result = await adminUserService.getAllUsers({
        page: page || "1",
        size: size || "10",
        search: search || "",
        role: role,
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: "Users fetched successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAllOrganizations(req: Request, res: Response) {
    try {
      const organizations = await adminUserService.getAllOrganizations();
      return res.status(200).json({
        success: true,
        data: organizations,
        message: "Organizations fetched successfully",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Service Error",
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
        message: error.message || "Internal Service Error",
      });
    }
  }
  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;

      const parsedData = UpdateUserDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const userUpdate = await adminUserService.updateOneUser(
        userId,
        parsedData.data,
        req.file,
      );

      const userObj = userUpdate.toObject();
      delete userObj.password;

      if (userObj.profilePicture) {
        userObj.imageUrl = `${req.protocol}://${req.get("host")}/uploads/profile/${userObj.profilePicture}`;
      }
      return res.status(200).json({
        success: true,
        data: userObj,
        message: "User data Updated successfully",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Service Error",
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
      const org = await adminUserService.createOrganization(
        parsed.data,
        req.file,
      );

      const orgObj = org.toObject();
      delete orgObj.password;

      if (orgObj.profilePicture) {
        orgObj.imageUrl = `${req.protocol}://${req.get("host")}/uploads/profile/${orgObj.profilePicture}`;
      }

      return res.status(201).json({
        success: true,
        message: "Organization created successfully",
        data: org,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Service Error",
      });
    }
  }

  async createNewUser(req: Request, res: Response) {
    try {
      const parsed = CreateNewUserDto.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsed.error),
        });
      }
      const user = await adminUserService.createNewUser(parsed.data, req.file);
      const userObj = user.toObject();
      delete userObj.password;

      if (userObj.profilePicture) {
        userObj.imageUrl = `${req.protocol}://${req.get("host")}/uploads/profile/${userObj.profilePicture}`;
      }
      return res.status(201).json({
        success: true,
        message: "New user created successfully",
        data: user,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Service Error",
      });
    }
  }
}
