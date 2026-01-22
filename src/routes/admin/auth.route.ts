import { Router } from "express";
import { AdminUserController } from "../../controllers/admin/auth.controller";
import {
  AdminMiddleware,
  AuthorizedMiddleware,
} from "../../middlewares/authorized.middleware";
import { Request, Response } from "express";

let adminUserController = new AdminUserController();

const router = Router();

router.get(
  "/dashboard",
  AuthorizedMiddleware,
  AdminMiddleware,
  (req: Request, res: Response) => {
    res.status(200).json({ success: true, message: "Welcome to admin" });
  },
);
router.post(
  "/register-organization",
  AuthorizedMiddleware,
  AdminMiddleware,
  adminUserController.createOrganization,
);

router.post("/", adminUserController.createUser);
router.get("/:id", adminUserController.getOneUser);
router.get("/", adminUserController.getAllUsers);
router.put("/:id", adminUserController.updateUser);
router.delete("/:id", adminUserController.deleteUser);

//
export default router;
