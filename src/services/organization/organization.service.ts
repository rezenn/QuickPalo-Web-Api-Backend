import { OrganizationModel } from "../../models/organization.model";
import { HttpError } from "../../errors/http-error";
import { CreateOrganizationDetailsDto } from "../../dtos/organization.dto";

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

    Object.assign(organization, data);
    await organization.save();

    return organization;
  }
}
