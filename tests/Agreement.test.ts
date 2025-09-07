import { describe, it, expect, beforeEach } from "vitest";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_TERMS = 101;
const ERR_INVALID_RECIPIENTS = 102;
const ERR_INVALID_FUNDS = 103;
const ERR_INVALID_MILESTONES = 104;
const ERR_AGREEMENT_ALREADY_EXISTS = 105;
const ERR_AGREEMENT_NOT_FOUND = 106;
const ERR_ALREADY_SIGNED = 108;
const ERR_INVALID_PARTY = 109;
const ERR_MAX_AGREEMENTS_EXCEEDED = 110;
const ERR_INVALID_GOALS = 111;
const ERR_INVALID_CONDITIONS = 112;
const ERR_INVALID_DURATION = 113;
const ERR_INVALID_PENALTIES = 114;
const ERR_INVALID_REWARDS = 115;
const ERR_INVALID_OVERSEERS = 116;
const ERR_INVALID_AMENDMENT = 117;
const ERR_AMENDMENT_NOT_ALLOWED = 118;
const ERR_INVALID_SIGNATURE_COUNT = 119;
const ERR_AGREEMENT_EXPIRED = 120;
const ERR_INVALID_STATUS = 121;
const ERR_INVALID_CURRENCY = 122;
const ERR_INVALID_EXCHANGE_RATE = 123;
const ERR_INVALID_REPORTING_INTERVAL = 124;
const ERR_INVALID_DISPUTE_PERIOD = 125;

interface Milestone {
  description: string;
  amount: number;
  deadline: number;
}

interface Agreement {
  creator: string;
  recipients: string[];
  overseers: string[];
  terms: string;
  goals: string;
  conditions: string;
  totalFunds: number;
  currency: string;
  milestones: Milestone[];
  duration: number;
  penalties: string;
  rewards: string;
  createdAt: number;
  signedCount: number;
  status: string;
  exchangeRate: number;
  reportingInterval: number;
  disputePeriod: number;
}

interface AgreementAmendment {
  amendmentTerms: string;
  amendmentTimestamp: number;
  amender: string;
}

class AgreementContractMock {
  state!: {
    nextAgreementId: number;
    maxAgreements: number;
    agreements: Map<number, Agreement>;
    agreementsByTermsHash: Map<string, number>;
    agreementSignatures: Map<number, string[]>;
    agreementAmendments: Map<number, AgreementAmendment>;
  };
  blockHeight = 0;
  caller = "ST1CREATOR";
  admin = "ST1CREATOR";
  constructor() {
    this.reset();
  }
  reset() {
    this.state = {
      nextAgreementId: 0,
      maxAgreements: 500,
      agreements: new Map(),
      agreementsByTermsHash: new Map(),
      agreementSignatures: new Map(),
      agreementAmendments: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1CREATOR";
    this.admin = "ST1CREATOR";
  }
  private sha256(input: string): string {
    return input;
  }
  createAgreement(
    recipients: string[],
    overseers: string[],
    terms: string,
    goals: string,
    conditions: string,
    totalFunds: number,
    currency: string,
    milestones: Milestone[],
    duration: number,
    penalties: string,
    rewards: string,
    exchangeRate: number,
    reportingInterval: number,
    disputePeriod: number
  ) {
    const nextId = this.state.nextAgreementId;
    if (nextId >= this.state.maxAgreements) return { ok: false, value: ERR_MAX_AGREEMENTS_EXCEEDED };
    if (recipients.length === 0 || recipients.length > 20) return { ok: false, value: ERR_INVALID_RECIPIENTS };
    if (overseers.length > 10) return { ok: false, value: ERR_INVALID_OVERSEERS };
    if (terms.length === 0) return { ok: false, value: ERR_INVALID_TERMS };
    if (goals.length === 0) return { ok: false, value: ERR_INVALID_GOALS };
    if (conditions.length === 0) return { ok: false, value: ERR_INVALID_CONDITIONS };
    if (totalFunds <= 0) return { ok: false, value: ERR_INVALID_FUNDS };
    if (!["USD", "EUR", "BTC"].includes(currency)) return { ok: false, value: ERR_INVALID_CURRENCY };
    if (milestones.length === 0 || milestones.length > 10) return { ok: false, value: ERR_INVALID_MILESTONES };
    if (duration <= 0) return { ok: false, value: ERR_INVALID_DURATION };
    if (penalties.length === 0) return { ok: false, value: ERR_INVALID_PENALTIES };
    if (rewards.length === 0) return { ok: false, value: ERR_INVALID_REWARDS };
    if (exchangeRate <= 0) return { ok: false, value: ERR_INVALID_EXCHANGE_RATE };
    if (reportingInterval <= 0) return { ok: false, value: ERR_INVALID_REPORTING_INTERVAL };
    if (disputePeriod <= 0) return { ok: false, value: ERR_INVALID_DISPUTE_PERIOD };
    const termsHash = this.sha256(terms);
    if (this.state.agreementsByTermsHash.has(termsHash)) return { ok: false, value: ERR_AGREEMENT_ALREADY_EXISTS };
    const newAgreement: Agreement = {
      creator: this.caller,
      recipients,
      overseers,
      terms,
      goals,
      conditions,
      totalFunds,
      currency,
      milestones,
      duration,
      penalties,
      rewards,
      createdAt: this.blockHeight,
      signedCount: 0,
      status: "pending",
      exchangeRate,
      reportingInterval,
      disputePeriod,
    };
    this.state.agreements.set(nextId, newAgreement);
    this.state.agreementsByTermsHash.set(termsHash, nextId);
    this.state.agreementSignatures.set(nextId, []);
    this.state.nextAgreementId++;
    return { ok: true, value: nextId + 1 };
  }
  signAgreement(id: number) {
    const agreement = this.state.agreements.get(id);
    if (!agreement) return { ok: false, value: ERR_AGREEMENT_NOT_FOUND };
    const signatures = this.state.agreementSignatures.get(id) || [];
    if (!agreement.recipients.includes(this.caller) && !agreement.overseers.includes(this.caller)) return { ok: false, value: ERR_INVALID_PARTY };
    if (signatures.includes(this.caller)) return { ok: false, value: ERR_ALREADY_SIGNED };
    if (agreement.status !== "pending") return { ok: false, value: ERR_INVALID_STATUS };
    signatures.push(this.caller);
    this.state.agreementSignatures.set(id, signatures);
    agreement.signedCount++;
    this.state.agreements.set(id, agreement);
    return { ok: true, value: true };
  }
  amendAgreement(id: number, newTerms: string) {
    const agreement = this.state.agreements.get(id);
    if (!agreement) return { ok: false, value: ERR_AGREEMENT_NOT_FOUND };
    if (agreement.creator !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (agreement.status !== "active") return { ok: false, value: ERR_AMENDMENT_NOT_ALLOWED };
    if (newTerms.length === 0) return { ok: false, value: ERR_INVALID_TERMS };
    const newHash = this.sha256(newTerms);
    if (this.state.agreementsByTermsHash.has(newHash)) return { ok: false, value: ERR_AGREEMENT_ALREADY_EXISTS };
    this.state.agreementsByTermsHash.delete(this.sha256(agreement.terms));
    this.state.agreementsByTermsHash.set(newHash, id);
    agreement.terms = newTerms;
    this.state.agreements.set(id, agreement);
    this.state.agreementAmendments.set(id, {
      amendmentTerms: newTerms,
      amendmentTimestamp: this.blockHeight,
      amender: this.caller,
    });
    return { ok: true, value: true };
  }
  activateAgreement(id: number) {
    const agreement = this.state.agreements.get(id);
    if (!agreement) return { ok: false, value: ERR_AGREEMENT_NOT_FOUND };
    if (agreement.creator !== this.caller) return { ok: false, value: ERR_NOT_AUTHORIZED };
    const requiredSigns = agreement.recipients.length + agreement.overseers.length;
    if (agreement.signedCount < requiredSigns) return { ok: false, value: ERR_INVALID_SIGNATURE_COUNT };
    if (agreement.status !== "pending") return { ok: false, value: ERR_INVALID_STATUS };
    agreement.status = "active";
    this.state.agreements.set(id, agreement);
    return { ok: true, value: true };
  }
  expireAgreement(id: number) {
    const agreement = this.state.agreements.get(id);
    if (!agreement) return { ok: false, value: ERR_AGREEMENT_NOT_FOUND };
    if (this.caller !== this.admin) return { ok: false, value: ERR_NOT_AUTHORIZED };
    if (this.blockHeight <= agreement.createdAt + agreement.duration) return { ok: false, value: ERR_AGREEMENT_EXPIRED };
    agreement.status = "expired";
    this.state.agreements.set(id, agreement);
    return { ok: true, value: true };
  }
  getAgreement(id: number) {
    const agreement = this.state.agreements.get(id);
    return agreement ? { ok: true, value: agreement } : { ok: false, value: null };
  }
}

describe("AgreementContract", () => {
  let contract: AgreementContractMock;
  beforeEach(() => (contract = new AgreementContractMock()));
  it("creates a valid agreement", () => {
    const result = contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    expect(result.ok).toBe(true);
    expect(contract.getAgreement(0)?.value?.terms).toBe("Terms");
  });
  it("rejects invalid recipients", () => {
    const result = contract.createAgreement(
      [],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    expect(result).toEqual({ ok: false, value: ERR_INVALID_RECIPIENTS });
  });
  it("rejects duplicate agreement", () => {
    contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    const result = contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    expect(result).toEqual({ ok: false, value: ERR_AGREEMENT_ALREADY_EXISTS });
  });
  it("signs agreement successfully", () => {
    contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    contract.caller = "ST2RECIPIENT";
    const result = contract.signAgreement(0);
    expect(result.ok).toBe(true);
    expect(contract.getAgreement(0)?.value?.signedCount).toBe(1);
  });
  it("rejects sign by invalid party", () => {
    contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    contract.caller = "ST4INVALID";
    const result = contract.signAgreement(0);
    expect(result).toEqual({ ok: false, value: ERR_INVALID_PARTY });
  });
  it("rejects amendment by non-creator", () => {
    contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    contract.caller = "ST2RECIPIENT";
    const result = contract.amendAgreement(0, "New Terms");
    expect(result).toEqual({ ok: false, value: ERR_NOT_AUTHORIZED });
  });
  it("activates agreement after all signatures", () => {
    contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    contract.caller = "ST2RECIPIENT";
    contract.signAgreement(0);
    contract.caller = "ST3OVERSEER";
    contract.signAgreement(0);
    contract.caller = "ST1CREATOR";
    const result = contract.activateAgreement(0);
    expect(result.ok).toBe(true);
    expect(contract.getAgreement(0)?.value?.status).toBe("active");
  });
  it("rejects activation without enough signatures", () => {
    contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    const result = contract.activateAgreement(0);
    expect(result).toEqual({ ok: false, value: ERR_INVALID_SIGNATURE_COUNT });
  });
  it("expires agreement successfully", () => {
    contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    contract.blockHeight = 366;
    const result = contract.expireAgreement(0);
    expect(result.ok).toBe(true);
    expect(contract.getAgreement(0)?.value?.status).toBe("expired");
  });
  it("rejects expire before duration", () => {
    contract.createAgreement(
      ["ST2RECIPIENT"],
      ["ST3OVERSEER"],
      "Terms",
      "Goals",
      "Conditions",
      1000,
      "USD",
      [{ description: "Milestone1", amount: 500, deadline: 100 }],
      365,
      "Penalties",
      "Rewards",
      1,
      30,
      60
    );
    contract.blockHeight = 100;
    const result = contract.expireAgreement(0);
    expect(result).toEqual({ ok: false, value: ERR_AGREEMENT_EXPIRED });
  });
});