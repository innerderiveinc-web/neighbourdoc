import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BRAND_CONSTANTS,
  canAccessConsultation,
  detectEmergency,
  findJanAushadhiEquivalents,
  getConsultationPrice,
  getValidatedEnv,
  selectDoctorForConsultation,
  validatePrescriptionDrugs
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

  it("maps brand names to Jan Aushadhi generic equivalents with significant savings", () => {
    const augmentinMatches = findJanAushadhiEquivalents("Augmentin");
    assert.ok(augmentinMatches.length > 0);
    assert.equal(augmentinMatches[0].genericName, "Amoxicillin + Potassium Clavulanate 625mg");
    assert.equal(augmentinMatches[0].janAushadhiPriceInr, 35);
    assert.equal(augmentinMatches[0].brandAveragePriceInr, 185);
    assert.ok(augmentinMatches[0].savingsPercent > 75);

    const doloMatches = findJanAushadhiEquivalents("Dolo");
    assert.ok(doloMatches.length > 0);
    assert.equal(doloMatches[0].genericName, "Paracetamol 650mg");
  });

  it("strictly rejects Schedule X / narcotic psychotropics under Telemedicine Guidelines", () => {
    // Prohibited substance
    const badRx = validatePrescriptionDrugs("Tab Alprazolam 0.5mg at night for sleep");
    assert.equal(badRx.isCompliant, false);
    assert.ok(badRx.prohibitedDrugsFound.includes("alprazolam"));
    assert.match(badRx.warningMessage ?? "", /Schedule X/);

    // Compliant prescription with savings calculation
    const goodRx = validatePrescriptionDrugs("Augmentin 625mg 1 tab BD x 5 days\nPan-D 1 cap OD empty stomach");
    assert.equal(goodRx.isCompliant, true);
    assert.equal(goodRx.prohibitedDrugsFound.length, 0);
    assert.ok(goodRx.recommendations.length >= 2);
    assert.ok(goodRx.estimatedSavingsInr > 200); // Saves > ₹200 on these two medicines
  });

  it("validates environment variables and enforces production security", () => {
    // Development default env passes
    const devEnv = getValidatedEnv({
      NODE_ENV: "development",
      JWT_SECRET: "short-dev-key"
    });
    assert.equal(devEnv.NODE_ENV, "development");
    assert.equal(devEnv.JWT_SECRET, "short-dev-key");

    // Production with weak key throws validation error
    assert.throws(() => {
      getValidatedEnv({
        NODE_ENV: "production",
        JWT_SECRET: "short-key"
      });
    }, /at least 32 characters long/);

    // Production with strong key passes
    const prodEnv = getValidatedEnv({
      NODE_ENV: "production",
      JWT_SECRET: "super-secure-production-jwt-secret-key-at-least-32-chars"
    });
    assert.equal(prodEnv.NODE_ENV, "production");
    assert.equal(prodEnv.JWT_SECRET, "super-secure-production-jwt-secret-key-at-least-32-chars");
  });

  it("exposes unified brand constants and corporate attribution", () => {
    assert.equal(BRAND_CONSTANTS.BRAND_NAME, "NeighbourDoc");
    assert.equal(BRAND_CONSTANTS.CORPORATE_ENTITY, "Qsura India Pvt. Ltd.");
    assert.equal(BRAND_CONSTANTS.SLA_GUARANTEE_MINUTES, 15);
    assert.equal(BRAND_CONSTANTS.EMERGENCY_HELPLINES.nationalEmergency, "112");
  });
});
