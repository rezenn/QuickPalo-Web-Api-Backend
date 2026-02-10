import { AuthController } from "../../controllers/user/auth.controller";
import { AuthorizedMiddleware } from "../../middlewares/authorized.middleware";

import { Router } from "express";
import { uploads } from "../../middlewares/upload.middleware";
let authController = new AuthController();

const router = Router();

router.get("/organizations", authController.getAllOrganizations);

router.get("/get-user", AuthorizedMiddleware, authController.getUserById);
router.post("/register", authController.createUser);
router.post("/login", authController.loginUser);
router.get("/users", authController.getAllUsers);
router.get("/:id", authController.getOneUser);
router.delete("/:id", authController.deleteUser);
router.put(
  "/update-user",
  AuthorizedMiddleware,
  uploads.single("profilePicture"),
  authController.updateUser,
);

router.post("/request-password-reset", authController.requestPasswordChange);
router.post("/reset-password/:token", authController.resetPassword);
export default router;
