import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/auth.controller";
import {
  adminMiddleware,
  authorizedMiddleware,
} from "../../middlewares/authorizedMiddleware";
import { Request, Response } from "express";

let adminUserController = new AdminUserController();

const router = Router();

router.post("/", adminUserController.createUser);
router.get("/:id", adminUserController.getOneUser);
router.get("/", adminUserController.getAllUsers);
router.put("/:id", adminUserController.updateUser);
router.delete("/:id", adminUserController.deleteUser);

router.get(
  "/dashboard",
  authorizedMiddleware,
  adminMiddleware,
  (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: "Welcome to admin" });
  }
);
router.post(
  "/register-organization",
  authorizedMiddleware,
  adminMiddleware,
  adminUserController.createOrganization
);

export default router;
