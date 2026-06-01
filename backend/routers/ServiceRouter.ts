import { Router } from "express";
import ServiceController from "../controllers/ServiceController.ts";
import InstallmentController from "../controllers/InstallmentController.ts";

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

// Installment expenses
ServiceRouter.get("/installments", InstallmentController.getAll);
ServiceRouter.post("/installments", InstallmentController.create);
ServiceRouter.put("/installments/:id", InstallmentController.update);
ServiceRouter.delete("/installments/:id", InstallmentController.delete);
ServiceRouter.get("/installments-payments", InstallmentController.getPaymentsForMonth);
ServiceRouter.post("/installments-payments", InstallmentController.addPayment);
ServiceRouter.delete("/installments-payments/:id", InstallmentController.deletePayment);
ServiceRouter.get("/installments-summary", InstallmentController.getMonthlySummary);

export default ServiceRouter;
