import { Router } from "express";
import { MessageController } from "../../controllers/message/message.controller";
import { AuthorizedMiddleware } from "../../middlewares/authorized.middleware";

let messageController = new MessageController();
const router = Router();

router.get(
  "/stream-token",
  AuthorizedMiddleware,
  messageController.getStreamToken,
);
router.post(
  "/send-to-org",
  AuthorizedMiddleware,
  messageController.sendMessageToOrganization,
);

export default router;
