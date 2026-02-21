import { UserRepository } from "../../repositories/user.repository";
import {
  LoginUserDto,
  RegisterUserDto,
  UpdateUserDto,
} from "../../dtos/user.dto";
import bcryptjs from "bcryptjs";
import fs from "fs";
import path from "path";
import { HttpError } from "../../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../configs";
import { sendEmail } from "../../configs/email";
import { OrganizationModel } from "../../models/organization.model";
import mongoose from "mongoose";

let userRepository = new UserRepository();

export class UserService {
  async registerUser(userData: RegisterUserDto) {
    const checkEmail = await userRepository.getUserByEmail(userData.email);

    if (checkEmail) {
      throw new HttpError(409, "Email already in use");
    }
    const hasedPassword = await bcryptjs.hash(userData.password, 10);

    const newUser = await userRepository.createUser({
      ...userData,
      password: hasedPassword,
      role: "user",
    });
    return newUser;
  }

  async getOneUser(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  async deleteOneUser(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const result = await userRepository.deleteUser(userId);
    if (!result) {
      throw new HttpError(500, "Failed to delete user");
    }
    return result;
  }

  async updateUser(
    userId: string,
    data: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await userRepository.getUserById(userId);
    if (!user) throw new HttpError(404, "User not found");
    if (data.role) {
      delete data.role;
    }
    if (data.email) {
      delete data.email;
    }
    if (data.password) {
      delete data.password;
    }
    if (file) {
      // delete old image if exists
      if (user.profilePicture) {
        const oldImagePath = path.resolve(
          process.cwd(),
          "uploads/profile",
          user.profilePicture,
        );

        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      // store only filename
      data.profilePicture = file.filename;
    }

    if (data.email && user.email !== data.email) {
      const checkEmail = await userRepository.getUserByEmail(data.email);
      if (checkEmail) throw new HttpError(409, "Email already in use");
    }

    if (data.password) {
      data.password = await bcryptjs.hash(data.password, 10);
    }

    return await userRepository.updateUser(userId, data);
  }

  async getAllUsers() {
    const users = await userRepository.getNormalUsers();

    if (!users || users.length === 0) {
      return [];
    }

    return users;
  }

  async getOrganizationById(organizationId: string) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new HttpError(400, "Invalid organization ID");
    }

    const organization = await OrganizationModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(organizationId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                fullName: 1,
                email: 1,
                phoneNumber: 1,
                profilePicture: 1,
                role: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          userId: 1,
          organizationName: 1,
          organizationType: 1,
          description: 1,
          street: 1,
          city: 1,
          state: 1,
          contactEmail: 1,
          contactPhone: 1,
          workingHours: 1,
          departments: 1,
          fees: 1,
          appointmentDuration: 1,
          advanceBookingDays: 1,
          timeSlots: 1,
          isActive: 1,
          isVerified: 1,
          createdAt: 1,
          updatedAt: 1,
          user: 1,
        },
      },
    ]);

    if (!organization || organization.length === 0) {
      throw new HttpError(404, "Organization not found");
    }

    return organization[0];
  }

  async getAllOrganizations(filters: {
    city?: string;
    organizationType?: string;
    page: number;
    limit: number;
    isActive?: boolean;
    isVerified?: boolean;
  }) {
    const {
      city,
      organizationType,
      page,
      limit,
      isActive = true,
      isVerified,
    } = filters;

    const query: any = { isActive };

    if (city) query.city = { $regex: new RegExp(city, "i") };
    if (organizationType) query.organizationType = organizationType;
    if (isVerified !== undefined) query.isVerified = isVerified;

    const organizations = await OrganizationModel.aggregate([
      { $match: query },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                fullName: 1,
                email: 1,
                phoneNumber: 1,
                profilePicture: 1,
                role: 1,
              },
            },
          ],
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          userId: 1,
          organizationName: 1,
          organizationType: 1,
          description: 1,
          street: 1,
          city: 1,
          state: 1,
          contactEmail: 1,
          contactPhone: 1,
          workingHours: 1,
          departments: 1,
          fees: 1,
          appointmentDuration: 1,
          advanceBookingDays: 1,
          timeSlots: 1,
          isActive: 1,
          isVerified: 1,
          createdAt: 1,
          updatedAt: 1,
          user: {
            _id: "$user._id",
            fullName: "$user.fullName",
            email: "$user.email",
            phoneNumber: "$user.phoneNumber",
            profilePicture: "$user.profilePicture",
          },
        },
      },

      { $sort: { createdAt: -1 } },

      // Pagination
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: "count" }],
          totalPages: [
            { $count: "count" },
            {
              $addFields: {
                totalPages: { $ceil: { $divide: ["$count", limit] } },
              },
            },
            { $project: { totalPages: 1 } },
          ],
        },
      },
    ]);

    return {
      data: organizations[0]?.data || [],
      pagination: {
        page,
        limit,
        total: organizations[0]?.total[0]?.count || 0,
        totalPages: organizations[0]?.totalPages[0]?.totalPages || 0,
        hasNextPage: page < (organizations[0]?.totalPages[0]?.totalPages || 0),
        hasPrevPage: page > 1,
      },
    };
  }

  async loginUser(loginData: LoginUserDto) {
    const user = await userRepository.getUserByEmail(loginData.email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const vaildPassword = await bcryptjs.compare(
      loginData.password,
      user.password,
    );

    if (!vaildPassword) {
      throw new HttpError(401, "Invaild credentials");
    }

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "30d",
    });
    return { token, user };
  }
  async getUserById(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    return user;
  }

  async sendResetPasswordEmail(email?: string) {
    const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
    if (!email) {
      throw new HttpError(400, "Email is required");
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiry
    const resetLink = `${CLIENT_URL}/reset-password?token=${token}`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          background-color: #B61BE1; 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
        }
        .header h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content { 
          padding: 30px; 
        }
        .details { 
          background-color: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #B61BE1;
        }
        .details p {
          margin: 10px 0;
        }
    
        .button-container {
          text-align: center;
          color: white; 
          margin: 30px 0;
        }
        .button { 
          display: inline-block; 
          padding: 14px 32px; 
          background-color: #B61BE1; 
          color: white !important;
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: bold;
          font-size: 16px;
          transition: background-color 0.3s;
          border: none;
        }
     
        .footer { 
          margin-top: 30px; 
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          font-size: 14px; 
          color: #6c757d; 
          text-align: center; 
        }
        .footer p {
          margin: 5px 0;
        }
        .expiry-note {
          font-size: 14px;
          color: #6c757d;
          text-align: center;
          margin: 15px 0;
        }
        .link-fallback {
          background-color: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          font-family: monospace;
          word-break: break-all;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Password Reset Request</h2>
        </div>
        
        <div class="content">
          <p>Dear <strong>${user.fullName || "User"}</strong>,</p>
          <p>We received a request to reset the password for your QuickPalo account. To proceed with resetting your password, click the button below:</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          
          <div class="details">
            <p><strong> Request Details:</strong></p>
            <p>• <strong>Account Email:</strong> ${user.email}</p>
            <p>• <strong>Request Time:</strong> ${new Date().toLocaleString()}</p>
            <p>• <strong>Token Expiry:</strong> 1 hour from request</p>
          </div>

          <div class="expiry-note">
            This password reset link will expire in <strong>1 hour</strong> for security reasons.
          </div>
          
        </div>
        
        <div class="footer">
          <p>--- <strong>QuickPalo</strong> ---</p>
          <p style="margin-top: 15px; font-size: 12px;">
            This is an automated message, please do not reply to this email.<br>
            &copy; ${new Date().getFullYear()} QuickPalo. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    await sendEmail(user.email, "Password Reset Request - QuickPalo", html);
    return user;
  }

  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpError(400, "Token and new password are required");
      }
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const user = await userRepository.getUserById(userId);
      if (!user) {
        throw new HttpError(404, "User not found");
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      await userRepository.updateUser(userId, { password: hashedPassword });
      return user;
    } catch (error) {
      throw new HttpError(400, "Invalid or expired token");
    }
  }
}
