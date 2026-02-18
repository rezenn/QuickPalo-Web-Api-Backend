import { UserRepository } from "../../repositories/user.repository";

import { HttpError } from "../../errors/http-error";

import { streamServerClient } from "../../configs/stream";

let userRepository = new UserRepository();

export class ChatService {
  async generateStreamToken(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    const streamRole = user.role === "organization" ? "user" : user.role;

    // image URL
    const imageUrl = user.profilePicture
      ? `${process.env.BASE_URL}/uploads/profile/${user.profilePicture}`
      : undefined;

    await streamServerClient.upsertUser({
      id: user._id.toString(),
      name: user.fullName,
      role: streamRole,
      image: imageUrl,
    });

    // Create Stream token
    const token = streamServerClient.createToken(user._id.toString());

    return {
      apiKey: process.env.STREAM_API_KEY,
      token,
      userId: user._id.toString(),
      user: {
        id: user._id.toString(),
        name: user.fullName,
        image: imageUrl,
        role: user.role,
      },
    };
  }

  async sendMessageToOrganization(
    senderId: string,
    orgUserId: string,
    message: string,
  ) {
    try {
      const sender = await userRepository.getUserById(senderId);
      const organizationUser = await userRepository.getUserById(orgUserId);

      if (!sender || !organizationUser) {
        throw new HttpError(404, "User not found");
      }

      const senderIdStr = sender._id.toString();
      const orgUserIdStr = organizationUser._id.toString();

      const senderRole = sender.role === "organization" ? "user" : sender.role;
      const orgRole =
        organizationUser.role === "organization"
          ? "user"
          : organizationUser.role;

      console.log("Upserting users with roles:", {
        sender: { role: sender.role, mappedRole: senderRole },
        org: { role: organizationUser.role, mappedRole: orgRole },
      });

      // Upsert users to Stream with more complete info
      await streamServerClient.upsertUsers([
        {
          id: senderIdStr,
          name: sender.fullName,
          role: sender.role,
          image: sender.profilePicture
            ? `${process.env.BASE_URL}/uploads/profile/${sender.profilePicture}`
            : undefined,
        },
        {
          id: orgUserIdStr,
          name: organizationUser.fullName,
          role: orgRole,
          image: organizationUser.profilePicture
            ? `${process.env.BASE_URL}/uploads/profile/${organizationUser.profilePicture}`
            : undefined,
        },
      ]);

      const channelId = [senderIdStr, orgUserIdStr].sort().join("_");

      let channel;
      try {
        channel = streamServerClient.channel("messaging", channelId);
        await channel.watch();
      } catch (error) {
        channel = streamServerClient.channel("messaging", channelId, {
          members: [senderIdStr, orgUserIdStr],
          created_by_id: senderIdStr,
        });
        await channel.create();
      }

      // Send message
      const messageResponse = await channel.sendMessage({
        text: message,
        user_id: senderIdStr,
      });

      return {
        channelId,
        message: messageResponse.message,
      };
    } catch (error: any) {
      console.error("STREAM ERROR:", error);
      throw new HttpError(500, error.message || "Stream error");
    }
  }
}
