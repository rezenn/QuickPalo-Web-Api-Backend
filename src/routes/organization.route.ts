// routes/organization-details.routes.ts
import { Router } from "express";
import { AuthorizedMiddleware } from "../middlewares/authorized.middleware"; // adjust path
import { OrganizationDetailsController } from "../controllers/organization.controller";

const router = Router();
const controller = new OrganizationDetailsController();

// All routes below require a JWT and role === "organization"
router.post(
  "/me/details",
  AuthorizedMiddleware,
  controller.createDetails.bind(controller),
);

router.get(
  "/me/details",
  AuthorizedMiddleware,
  controller.getMyDetails.bind(controller),
);

router.put(
  "/me/details",
  AuthorizedMiddleware,
  controller.updateMyDetails.bind(controller),
);

router.delete(
  "/me/details",
  AuthorizedMiddleware,
  controller.deleteMyDetails.bind(controller),
);

export default router;
