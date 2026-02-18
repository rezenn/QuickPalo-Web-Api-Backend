import { Request, Response } from "express";
import { UserService } from "../../services/user/user.service";
import {
  RegisterUserDto,
  UpdateUserDto,
  LoginUserDto,
} from "../../dtos/user.dto";
import z from "zod";
import { HttpError } from "../../errors/http-error";

let userService = new UserService();
export class AuthController {
  async createUser(req: Request, res: Response) {
    try {
      const parsedData = RegisterUserDto.safeParse(req.body);
      if (!parsedData.success) {
        return res
          .status(400)
          .json({ success: false, message: z.prettifyError(parsedData.error) });
      }

      const newUser = await userService.registerUser(parsedData.data);
      return res.status(201).json({
        success: true,
        message: "Registered successfully",
        data: newUser,
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
      const user = await userService.getOneUser(userId);
      return res.status(200).json({
        success: true,
        data: user,
        message: "User fetched",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Servicee Error",
      });
    }
  }
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
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

  async getAllOrganizations(req: Request, res: Response) {
    try {
      const {
        city,
        organizationType,
        page = 1,
        limit = 10,
        isActive = "true",
        isVerified = "false",
      } = req.query;
      const userRole = req.user?.role;

      let showActiveOnly = true;
      let showVerifiedOnly = false;

      if (userRole === "admin") {
        showActiveOnly = isActive === "true";
        showVerifiedOnly = isVerified === "true";
      } else if (userRole === "organization") {
        showActiveOnly = true;
        showVerifiedOnly = false;
      } else {
        showActiveOnly = true;
        showVerifiedOnly = false;
      }
      const organizations = await userService.getAllOrganizations({
        city: city as string,
        organizationType: organizationType as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        isActive: isActive === "true",
        isVerified: isVerified === "true",
      });

      return res.status(200).json({
        success: true,
        data: organizations.data,
        pagination: organizations.pagination,
        message: "Organizations fetched successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
  async getOrganizationById(req: Request, res: Response) {
    try {
      const organizationId = req.params.id;

      const organization =
        await userService.getOrganizationById(organizationId);

      return res.status(200).json({
        success: true,
        data: organization,
        message: "Organization fetched successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      await userService.deleteOneUser(userId);
      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Servicee Error",
      });
    }
  }
  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID not provided" });
      }

      const parsedData = UpdateUserDto.safeParse(req.body);
      if (!parsedData.success) {
        return res
          .status(400)
          .json({ success: false, message: z.prettifyError(parsedData.error) });
      }

      const updatedUser = await userService.updateUser(
        userId,
        parsedData.data,
        req.file,
      );

      if (!updatedUser) {
        throw new HttpError(500, "Failed to update user");
      }

      const userObj = updatedUser.toObject();
      delete userObj.password;

      if (userObj.profilePicture) {
        userObj.imageUrl = `${req.protocol}://${req.get("host")}/uploads/profile/${userObj.profilePicture}`;
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: userObj,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async loginUser(req: Request, res: Response) {
    try {
      const parsedData = LoginUserDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          meassge: z.prettifyError(parsedData.error),
        });
      }
      const { token, user } = await userService.loginUser(parsedData.data);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: user,
        token,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async getUserById(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      const user = await userService.getUserById(userId);
      const userObj = user?.toObject();
      if (userObj.profilePicture) {
        userObj.imageUrl = `${req.protocol}://${req.get("host")}/uploads/profile/${userObj.profilePicture}`;
      } else {
        userObj.imageUrl = null;
      }
      return res.status(200).json({
        success: true,
        message: "User featched successfully",
        data: user,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
  async requestPasswordChange(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const user = await userService.sendResetPasswordEmail(email);
      return res.status(200).json({
        success: true,
        data: user,
        message: "Password reset email sent",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
  async resetPassword(req: Request, res: Response) {
    try {
      const token = req.params.token;
      const { newPassword } = req.body;
      await userService.resetPassword(token, newPassword);
      return res.status(200).json({
        success: true,
        message: "Password has been reset successfully.",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode ?? 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
