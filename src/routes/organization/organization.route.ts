import { Router } from "express";
import { AuthorizedMiddleware } from "../../middlewares/authorized.middleware";
import { AuthController } from "../../controllers/user/auth.controller";

import { OrganizationDetailsController } from "../../controllers/organization/organization.controller";

const router = Router();
let authController = new AuthController();

const controller = new OrganizationDetailsController();

router.get("/", authController.getAllOrganizations);

router.get(
  "/details",
  AuthorizedMiddleware,
  controller.getMyDetails.bind(controller),
);

router.get(
  "/:id",
  AuthorizedMiddleware,
  authController.getOrganizationById.bind(authController),
);

router.post(
  "/details",
  AuthorizedMiddleware,
  controller.createDetails.bind(controller),
);

router.put(
  "/details",
  AuthorizedMiddleware,
  controller.updateMyDetails.bind(controller),
);

router.delete(
  "/details",
  AuthorizedMiddleware,
  controller.deleteMyDetails.bind(controller),
);

export default router;
