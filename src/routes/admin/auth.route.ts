import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/auth.controller";
import {
  AdminMiddleware,
  AuthorizedMiddleware,
} from "../../middlewares/authorized.middleware";
import { Request, Response } from "express";
import { uploads } from "../../middlewares/upload.middleware";

let adminUserController = new AdminUserController();

const router = Router();
router.post("/", adminUserController.createUser);
router.post(
  "/register-organization",
  AuthorizedMiddleware,
  AdminMiddleware,
  uploads.single("profilePicture"),
  adminUserController.createOrganization,
);
router.post(
  "/create-user",
  AuthorizedMiddleware,
  AdminMiddleware,
  uploads.single("profilePicture"),
  adminUserController.createNewUser,
);
router.put(
  "/:id",
  AuthorizedMiddleware,
  AdminMiddleware,
  uploads.single("profilePicture"),
  adminUserController.updateUser,
);
router.get(
  "/users",
  AuthorizedMiddleware,
  AdminMiddleware,
  adminUserController.getAllUsers,
);
router.get(
  "/organizations",
  AuthorizedMiddleware,
  AdminMiddleware,
  adminUserController.getAllOrganizations,
);
// router.get(
//   "/:id",
//   AuthorizedMiddleware,
//   AdminMiddleware,
//   adminUserController.getOneUser,
// );
router.delete(
  "/:id",
  AuthorizedMiddleware,
  AdminMiddleware,
  adminUserController.deleteUser,
);

export default router;
