import { AuthController } from "../controllers/auth.controller";
import { Router } from "express";
let authController = new AuthController();

const router = Router();

router.post("/register", authController.createUser);
router.post("/login", authController.loginUser);
router.get("/:id", authController.getOneUser);
router.get("/", authController.getAllUsers);
router.put("/:id", authController.updateUser);
router.delete("/:id", authController.deleteUser);

export default router;
