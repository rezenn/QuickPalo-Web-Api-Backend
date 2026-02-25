import { OrganizationModel } from "../../models/organization.model";
import { HttpError } from "../../errors/http-error";
import { CreateOrganizationDetailsDto } from "../../dtos/organization.dto";
import mongoose from "mongoose";

export class OrganizationDetailsService {
  async createOrganizationDetails(
    userId: string,
    data: CreateOrganizationDetailsDto,
  ) {
    const existing = await OrganizationModel.findOne({ userId });
    if (existing) {
      throw new HttpError(409, "Organization details already exist");
    }

    const organization = new OrganizationModel({
      userId,
      ...data,
    });

    await organization.save();
    return organization;
  }

  async getOrganizationByUserId(userId: string) {
    const organization = await OrganizationModel.findOne({ userId }).populate(
      "userId",
      "fullName email phoneNumber profilePicture",
    );

    if (!organization) {
      throw new HttpError(404, "Organization details not found");
    }

    return organization;
  }

  async updateOrganizationDetails(userId: string, data: any) {
    const organization = await OrganizationModel.findOne({ userId });

    if (!organization) {
      throw new HttpError(404, "Organization details not found");
    }

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        (organization as any)[key] = data[key];
      }
    });
    await organization.save();

    return organization;
  }

  // In your organization.service.ts or wherever you fetch organization data

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
        $addFields: {
          // Ensure departments have _id
          departments: {
            $map: {
              input: "$departments",
              as: "dept",
              in: {
                $mergeObjects: [
                  "$$dept",
                  {
                    _id: {
                      $cond: {
                        if: { $ifNull: ["$$dept._id", false] },
                        then: "$$dept._id",
                        else: { $toString: "$$dept._id" }, // Convert to string if exists
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
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
          departments: 1, // Now includes _id
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
}
