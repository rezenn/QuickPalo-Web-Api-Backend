import { AuthController } from "../controllers/auth.controller";
import { AuthorizedMiddleware } from "../middlewares/authorized.middleware";
import { Router } from "express";
import { uploads } from "../middlewares/upload.middleware";
let authController = new AuthController();

const router = Router();

router.post("/register", authController.createUser);
router.post("/login", authController.loginUser);
router.get("/:id", authController.getOneUser);
router.get("/", authController.getAllUsers);
router.put("/:id", authController.updateUser);
router.delete("/:id", authController.deleteUser);
router.put(
  "/update-profile",
  AuthorizedMiddleware,
  uploads.single("profile"),
  authController.updateUser,
);

export default router;
