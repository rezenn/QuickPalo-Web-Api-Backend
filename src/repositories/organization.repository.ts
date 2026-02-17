import { OrganizationModel, IOrganization } from "../models/organization.model";

export interface IOrganizationRepository {
  createOrganization(orgData: Partial<IOrganization>): Promise<IOrganization>;
  getOrganizationById(orgId: string): Promise<IOrganization | null>;
  getOrganizationByUserId(userId: string): Promise<IOrganization | null>;
  getAllOrganizations(): Promise<IOrganization[]>;
  updateOrganization(
    orgId: string,
    updateData: Partial<IOrganization>,
  ): Promise<IOrganization | null>;
  deleteOrganization(orgId: string): Promise<boolean>;
  searchOrganizations(query: any): Promise<IOrganization[]>;
}

export class OrganizationRepository implements IOrganizationRepository {
  async createOrganization(
    orgData: Partial<IOrganization>,
  ): Promise<IOrganization> {
    const organization = new OrganizationModel(orgData);
    await organization.save();
    return organization;
  }

  async getOrganizationById(orgId: string): Promise<IOrganization | null> {
    const organization = await OrganizationModel.findById(orgId).populate(
      "userId",
      "fullName email phoneNumber profilePicture",
    );
    return organization;
  }

  async getOrganizationByUserId(userId: string): Promise<IOrganization | null> {
    const organization = await OrganizationModel.findOne({ userId }).populate({
      path: "userId",
      select: "fullName email phoneNumber profilePicture",
    });
    return organization;
  }

  async getAllOrganizations(): Promise<IOrganization[]> {
    const organizations = await OrganizationModel.find()
      .populate({
        path: "userId",
        select: "fullName email phoneNumber profilePicture",
      })
      .sort({ createdAt: -1 });
    return organizations;
  }

  async updateOrganization(
    orgId: string,
    updateData: Partial<IOrganization>,
  ): Promise<IOrganization | null> {
    const organization = await OrganizationModel.findByIdAndUpdate(
      orgId,
      updateData,
      { new: true },
    ).populate({
      path: "userId",
      select: "fullName email phoneNumber profilePicture",
    });
    return organization;
  }

  async deleteOrganization(orgId: string): Promise<boolean> {
    const result = await OrganizationModel.findByIdAndDelete(orgId);
    return result ? true : false;
  }

  async searchOrganizations(query: any): Promise<IOrganization[]> {
    const organizations = await OrganizationModel.find(query)
      .populate({
        path: "userId",
        select: "fullName email phoneNumber profilePicture",
      })
      .sort({ createdAt: -1 });
    return organizations;
  }
}
