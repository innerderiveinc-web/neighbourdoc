import { api, ok, readJson, requireRole } from "../../_server";
import type { SystemSettings } from "@neighbordoc/shared";

export async function GET(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  return ok(api.getSettings());
}

export async function PATCH(request: Request) {
  const guard = requireRole(request, ["admin", "superadmin"]);
  if (!guard.authorized) return guard.response;

  const body = await readJson<Partial<SystemSettings>>(request);
  const patch: Partial<SystemSettings> = {};

  if (body.basicConsultationFee !== undefined) {
    patch.basicConsultationFee = Math.max(1, Number(body.basicConsultationFee));
  }
  if (body.priorityConsultationFee !== undefined) {
    patch.priorityConsultationFee = Math.max(1, Number(body.priorityConsultationFee));
  }
  if (body.doctorPayoutShare !== undefined) {
    patch.doctorPayoutShare = Math.max(0, Number(body.doctorPayoutShare));
  }
  if (body.slaCallbackMinutes !== undefined) {
    patch.slaCallbackMinutes = Math.max(1, Number(body.slaCallbackMinutes));
  }
  if (typeof body.emergencyHelpline === "string" && body.emergencyHelpline.trim()) {
    patch.emergencyHelpline = body.emergencyHelpline.trim();
  }
  if (typeof body.supportPhone === "string" && body.supportPhone.trim()) {
    patch.supportPhone = body.supportPhone.trim();
  }
  if (typeof body.maintenanceMode === "boolean") {
    patch.maintenanceMode = body.maintenanceMode;
  }
  if (typeof body.maintenanceMessage === "string") {
    patch.maintenanceMessage = body.maintenanceMessage.trim();
  }
  if (body.activeOtpProvider && ["mock", "msg91", "twilio"].includes(body.activeOtpProvider)) {
    patch.activeOtpProvider = body.activeOtpProvider;
  }
  if (body.activePaymentGateway && ["mock", "razorpay"].includes(body.activePaymentGateway)) {
    patch.activePaymentGateway = body.activePaymentGateway;
  }

  const updated = api.updateSettings(patch, {
    id: guard.user?.sub,
    name: guard.user?.name
  });

  return ok(updated);
}

export async function PUT(request: Request) {
  return PATCH(request);
}
