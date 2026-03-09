import { Router } from "express";
import ServiceController from "../controllers/ServiceController.ts";

const ServiceRouter = Router();

// Service CRUD
ServiceRouter.get("/services", ServiceController.getAll);
ServiceRouter.get("/services/:id", ServiceController.getById);
ServiceRouter.post("/services", ServiceController.create);
ServiceRouter.put("/services/:id", ServiceController.update);
ServiceRouter.delete("/services/:id", ServiceController.delete);
ServiceRouter.patch("/services/:id/active", ServiceController.toggleActive);

// Payment history per service
ServiceRouter.get("/services/:id/payments", ServiceController.getPaymentHistory);

// Payments for a month (all services)
ServiceRouter.get("/services-payments", ServiceController.getPaymentsForMonth);
ServiceRouter.post("/services-payments", ServiceController.addPayment);
ServiceRouter.delete("/services-payments/:id", ServiceController.deletePayment);

// Summaries
ServiceRouter.get("/services-summary", ServiceController.getMonthlySummary);
ServiceRouter.get("/services-annual-summary", ServiceController.getAnnualSummary);

export default ServiceRouter;
