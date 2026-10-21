import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canAccessConsultation,
  detectEmergency,
  getConsultationPrice,
  selectDoctorForConsultation
} from "../index.ts";
import type { DoctorCandidate } from "../index.ts";

describe("NeighbourDoc core healthcare logic", () => {
  it("blocks emergency symptoms and returns an audit-safe reason", () => {
    const result = detectEmergency("Patient has chest pain and breathing difficulty");

    assert.equal(result.blocked, true);
    assert.equal(result.urgencyLevel, "emergency");
    assert.deepEqual(result.matchedTerms, ["chest pain", "breathing difficulty"]);
    assert.match(result.message, /nearest hospital/);
  });

  it("detects multi-lingual emergency red flags including toxins, snake bites, and stroke", () => {
    const snakeBite = detectEmergency("Khet me kaam karte waqt saanp ne kaat liya");
    assert.equal(snakeBite.blocked, true);
    assert.ok(snakeBite.matchedTerms.includes("saanp ne kaat liya"));

    const stroke = detectEmergency("Sudden paralysis on right side and loss of consciousness");
    assert.equal(stroke.blocked, true);
    assert.ok(stroke.matchedTerms.includes("paralysis"));
    assert.ok(stroke.matchedTerms.includes("loss of consciousness"));

    const poison = detectEmergency("Accidental pesticide poisoning in child");
    assert.equal(poison.blocked, true);
    assert.ok(poison.matchedTerms.includes("poisoning"));
  });

  it("prices supported consultation plans in paise", () => {
    assert.deepEqual(getConsultationPrice("basic"), { amount: 4900, label: "Basic", currency: "INR" });
    assert.deepEqual(getConsultationPrice("priority"), { amount: 9900, label: "Priority", currency: "INR" });
    assert.deepEqual(getConsultationPrice("family_monthly"), { amount: 19900, label: "Family Monthly", currency: "INR" });
  });

  it("assigns a verified available doctor by city, language, then round-robin age", () => {
    const doctors: DoctorCandidate[] = [
      {
        id: "late",
        city: "Kanpur",
        languages: ["Hindi"],
        verified: true,
        available: true,
        lastAssignedAt: "2026-05-12T06:00:00.000Z"
      },
      {
        id: "oldest",
        city: "Kanpur",
        languages: ["Hindi", "English"],
        verified: true,
        available: true,
        lastAssignedAt: "2026-05-12T05:00:00.000Z"
      },
      {
        id: "wrong-city",
        city: "Lucknow",
        languages: ["Hindi"],
        verified: true,
        available: true,
        lastAssignedAt: "2026-05-12T04:00:00.000Z"
      },
      {
        id: "unverified",
        city: "Kanpur",
        languages: ["Hindi"],
        verified: false,
        available: true,
        lastAssignedAt: null
      }
    ];

    assert.equal(selectDoctorForConsultation(doctors, { city: "Kanpur", language: "Hindi" })?.id, "oldest");
  });

  it("enforces role-based consultation access", () => {
    assert.equal(canAccessConsultation({ role: "admin" }, { patientUserId: "p1", doctorUserId: "d1" }), true);
    assert.equal(canAccessConsultation({ role: "patient", userId: "p1" }, { patientUserId: "p1", doctorUserId: "d1" }), true);
    assert.equal(canAccessConsultation({ role: "doctor", userId: "d1" }, { patientUserId: "p1", doctorUserId: "d1" }), true);
    assert.equal(
      canAccessConsultation({ role: "partner", organizationId: "org1" }, { patientUserId: "p1", doctorUserId: "d1", organizationId: "org2" }),
      false
    );
  });
});
