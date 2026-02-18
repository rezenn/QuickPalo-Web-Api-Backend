import { Request, Response } from "express";

import { ChatService } from "../../services/chat/chat.service";

let chatService = new ChatService();
export class ChatController {
  async getStreamToken(req: Request, res: Response) {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized" });
      }

      const data = await chatService.generateStreamToken(userId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async sendMessageToOrganization(req: Request, res: Response) {
    try {
      const senderId = req.user?._id;

      if (!senderId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { orgUserId, message } = req.body;

      if (!orgUserId || !message) {
        return res.status(400).json({
          success: false,
          message: "orgUserId and message are required",
        });
      }

      const result = await chatService.sendMessageToOrganization(
        senderId.toString(),
        orgUserId,
        message,
      );

      return res.status(200).json({
        success: true,
        data: result,
        members: [senderId, orgUserId],
      });
    } catch (error: any) {
      console.error("SEND MESSAGE ERROR:", error);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
