import { Router } from "express";
import { AppointmentController } from "../../controllers/appointment/appointment.controller";
import { AuthorizedMiddleware } from "../../middlewares/authorized.middleware";

let appointmentController = new AppointmentController();

const router = Router();

router.get("/availability", appointmentController.checkAvailability);

router.post("/", AuthorizedMiddleware, appointmentController.createAppointment);
router.get(
  "/user",
  AuthorizedMiddleware,
  appointmentController.getUserAppointments,
);
router.get(
  "/organization/:organizationId",
  AuthorizedMiddleware,
  appointmentController.getOrganizationAppointments,
);
router.get(
  "/date-range",
  AuthorizedMiddleware,
  appointmentController.getAppointmentsByDateRange,
);
router.get(
  "/:id",
  AuthorizedMiddleware,
  appointmentController.getAppointmentById,
);
router.put(
  "/:id",
  AuthorizedMiddleware,
  appointmentController.updateAppointment,
);
router.patch(
  "/:id/cancel",
  AuthorizedMiddleware,
  appointmentController.cancelAppointment,
);
router.patch(
  "/:id/complete",
  AuthorizedMiddleware,
  appointmentController.completeAppointment,
);

// admin routes
router.get("/", AuthorizedMiddleware, appointmentController.getAllAppointments);
router.delete(
  "/:id",
  AuthorizedMiddleware,
  appointmentController.deleteAppointment,
);

export default router;
