import { Router } from "express";
import { ChatController } from "../../controllers/chat/chat.controller";
import { AuthorizedMiddleware } from "../../middlewares/authorized.middleware";

let chatController = new ChatController();
const router = Router();

router.get(
  "/stream-token",
  AuthorizedMiddleware,
  chatController.getStreamToken,
);
router.post(
  "/send-to-org",
  AuthorizedMiddleware,
  chatController.sendMessageToOrganization,
);

export default router;
