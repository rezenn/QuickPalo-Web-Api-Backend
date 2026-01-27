import { AuthController } from "../controllers/auth.controller";
import { AuthorizedMiddleware } from "../middlewares/authorized.middleware";
import { Router } from "express";
import { uploads } from "../middlewares/upload.middleware";
let authController = new AuthController();

const router = Router();
router.get("/get-user", AuthorizedMiddleware, authController.getUserById);
router.post("/register", authController.createUser);
router.post("/login", authController.loginUser);
router.get("/:id", authController.getOneUser);
router.get("/", authController.getAllUsers);
router.delete("/:id", authController.deleteUser);
router.put(
  "/update-user",
  AuthorizedMiddleware,
  uploads.single("profileImage"),
  authController.updateUser,
);

export default router;
