import { POLICY, PROPERTY_SCORE_TABLE } from './policy-data.js';

const n = (v) => Number(v) || 0;
export const won = (v) => Math.round(n(v));
export const floor10 = (v) => Math.floor(n(v) / 10) * 10;

export function calcBasicPension2026(input) {
  const p = POLICY.basicPension[2026];
  const isCouple = input.household === 'couple';
  const threshold = isCouple ? p.selection.couple : p.selection.single;
  const regionDeduction = p.basicPropertyDeduction[input.region] ?? p.basicPropertyDeduction.metro;

  const workSelf = Math.max(0, n(input.workSelf) - p.workDeduction) * p.workRecognitionRate;
  const workSpouse = isCouple ? Math.max(0, n(input.workSpouse) - p.workDeduction) * p.workRecognitionRate : 0;
  const interestIncome = Math.max(0, n(input.interestMonthly) - p.monthlyInterestDeduction);
  const otherIncome = n(input.publicPensionSelf) + (isCouple ? n(input.publicPensionSpouse) : 0) + n(input.businessMonthly) + n(input.privatePensionMonthly) + n(input.otherMonthly) + interestIncome;
  const incomeEvaluation = workSelf + workSpouse + otherIncome;

  const generalNet = Math.max(0, n(input.generalProperty) - regionDeduction);
  const financialNet = Math.max(0, n(input.financialProperty) - p.financialPropertyDeduction);
  const convertibleProperty = Math.max(0, generalNet + financialNet - n(input.debt));
  const propertyConversion = convertibleProperty * p.annualPropertyConversionRate / 12 + n(input.luxuryProperty);
  const recognizedIncome = incomeEvaluation + propertyConversion;

  const ageEligible = n(input.age) >= 65;
  const occupationEligible = !input.excludedOccupationalPension;
  const incomeEligible = recognizedIncome <= threshold;
  const eligible = ageEligible && occupationEligible && incomeEligible;

  function personBase(nps, aBenefit) {
    let base = p.baseAmount;
    const npsVal = n(nps), aVal = n(aBenefit);
    let linkedReductionApplied = false;
    if (npsVal > p.npsBenefitThreshold && aVal > p.npsAThreshold) {
      const f1 = p.baseAmount * 2.5 - npsVal;
      const f2 = (p.baseAmount - (2 / 3) * aVal) + p.supplementaryAmount;
      base = Math.max(f1, f2);
      base = Math.max(p.supplementaryAmount, Math.min(p.baseAmount, base));
      linkedReductionApplied = true;
    }
    return { amount: floor10(base), linkedReductionApplied };
  }

  let applicant = personBase(input.publicPensionSelf, input.aBenefitSelf);
  let spouse = { amount: 0, linkedReductionApplied: false };
  const bothReceive = isCouple && !!input.bothReceive;
  if (bothReceive) spouse = personBase(input.publicPensionSpouse, input.aBenefitSpouse);

  if (!eligible) {
    return {
      year: 2026, eligible: false, ageEligible, occupationEligible, incomeEligible,
      threshold, incomeEvaluation: floor10(incomeEvaluation), propertyConversion: floor10(propertyConversion),
      recognizedIncome: floor10(recognizedIncome), monthlyBenefitHousehold: 0, applicantBenefit: 0, spouseBenefit: 0,
      linkedReductionApplied: applicant.linkedReductionApplied || spouse.linkedReductionApplied,
      reason: !ageEligible ? '만 65세 미만' : !occupationEligible ? '직역연금 제외대상으로 입력됨' : '소득인정액이 선정기준액을 초과'
    };
  }

  let applicantAfter = applicant.amount;
  let spouseAfter = spouse.amount;
  if (bothReceive) {
    applicantAfter = floor10(applicantAfter * (1 - p.coupleReductionRate));
    spouseAfter = floor10(spouseAfter * (1 - p.coupleReductionRate));
  }

  let householdBeforeReversal = applicantAfter + spouseAfter;
  let householdBenefit = householdBeforeReversal;
  const gap = Math.max(0, threshold - recognizedIncome);
  let reversalApplied = recognizedIncome + householdBeforeReversal > threshold;

  if (reversalApplied) {
    const floorHousehold = bothReceive ? p.baseAmount * p.reversalFloorCoupleHouseholdRate : p.baseAmount * p.reversalFloorSingleRate;
    householdBenefit = floor10(Math.max(floorHousehold, Math.min(householdBeforeReversal, gap)));
  }

  if (bothReceive && householdBeforeReversal > 0) {
    const ratio = applicantAfter / householdBeforeReversal;
    applicantAfter = floor10(householdBenefit * ratio);
    spouseAfter = Math.max(0, householdBenefit - applicantAfter);
  } else {
    applicantAfter = householdBenefit;
  }

  return {
    year: 2026, eligible: true, ageEligible, occupationEligible, incomeEligible,
    threshold, incomeEvaluation: floor10(incomeEvaluation), propertyConversion: floor10(propertyConversion),
    recognizedIncome: floor10(recognizedIncome), monthlyBenefitHousehold: floor10(householdBenefit),
    applicantBenefit: floor10(applicantAfter), spouseBenefit: floor10(spouseAfter),
    linkedReductionApplied: applicant.linkedReductionApplied || spouse.linkedReductionApplied,
    coupleReductionApplied: bothReceive,
    reversalApplied
  };
}

export function calcBasicPension2027Preview(input) {
  const p = POLICY.basicPension[2027];
  const band = input.band2027 || 'lower45to70';
  const base = p.benefitBands[band];
  const isCouple = input.household === 'couple';
  const bothReceive = isCouple && !!input.bothReceive;
  const reduction = bothReceive ? p.coupleReduction[band] : 0;
  const perPerson = floor10(base * (1 - reduction));
  return {
    year: 2027,
    status: 'proposal',
    band,
    baseAmount: base,
    perPerson,
    householdBenefit: bothReceive ? perPerson * 2 : perPerson,
    bothReceive,
    reductionRate: reduction,
    plannedStart: p.plannedStart,
    note: p.note
  };
}

export function propertyScoreFromWon(adjustedPropertyWon) {
  const wonVal = Math.max(0, n(adjustedPropertyWon));
  if (wonVal <= 0) return { points: 0, grade: 0, adjustedWon: 0 };
  const manwon = wonVal / 10000;
  for (let i = 0; i < PROPERTY_SCORE_TABLE.length; i++) {
    const [upper, points] = PROPERTY_SCORE_TABLE[i];
    if (manwon <= upper) return { points, grade: i + 1, adjustedWon: wonVal };
  }
  return { points: 2341, grade: 60, adjustedWon: wonVal };
}

export function calcRegionalHealth(year, input) {
  const p = POLICY.healthInsurance[year];
  const fullAnnual = n(input.interestAnnual) + n(input.dividendAnnual) + n(input.businessAnnual) + n(input.otherAnnual);
  const halfAnnual = n(input.wageAnnual) + n(input.pensionAnnual);
  const evaluatedAnnual = fullAnnual + halfAnnual * 0.5;
  const monthlyIncome = evaluatedAnnual / 12;

  let incomePremium = monthlyIncome * p.rate;
  if (p.regionalIncomeFloorPremium != null) {
    incomePremium = Math.max(incomePremium, p.regionalIncomeFloorPremium);
  }

  const rentAssessment = input.homeowner ? 0 : (n(input.rentDeposit) + n(input.monthlyRent) * 40) * 0.30;
  const rawProperty = n(input.propertyTaxBase) + rentAssessment;
  const adjustedProperty = Math.max(0, rawProperty - p.propertyBasicDeduction - n(input.eligibleHousingLoanDeduction));
  const score = propertyScoreFromWon(adjustedProperty);
  const propertyPremium = score.points * p.propertyPointWon;
  let health = incomePremium + propertyPremium;
  if (p.regionalTotalCeilingPremium != null) health = Math.min(health, p.regionalTotalCeilingPremium);
  health = floor10(health);

  let ltc = null;
  if (p.longTermCareRatioToHealth != null) ltc = floor10(health * p.longTermCareRatioToHealth);

  return {
    year, type: 'regional', evaluatedAnnual: floor10(evaluatedAnnual), monthlyIncome: floor10(monthlyIncome),
    incomePremium: floor10(incomePremium), rentAssessment: floor10(rentAssessment), rawProperty: floor10(rawProperty),
    adjustedProperty: floor10(adjustedProperty), propertyPoints: score.points, propertyGrade: score.grade,
    propertyPremium: floor10(propertyPremium), healthPremium: health, ltcPremium: ltc,
    totalPremium: ltc == null ? health : health + ltc,
    longTermCarePending: ltc == null, limitsProvisional: p.limitsStatus === 'provisional-2026'
  };
}

export function calcEmployeeHealth(year, input) {
  const p = POLICY.healthInsurance[year];
  const salary = n(input.salaryMonthly);
  const salaryHealthEmployee = floor10(salary * p.rate * 0.5);

  const fullAnnual = n(input.interestAnnual) + n(input.dividendAnnual) + n(input.businessAnnual) + n(input.otherAnnual);
  const halfAnnual = n(input.wageOutsideAnnual) + n(input.pensionAnnual);
  const totalOther = fullAnnual + halfAnnual;
  const excess = Math.max(0, totalOther - p.otherIncomeThresholdEmployee);
  let evaluatedExcessAnnual = 0;
  if (totalOther > 0 && excess > 0) {
    const excessRatio = excess / totalOther;
    evaluatedExcessAnnual = (fullAnnual + halfAnnual * 0.5) * excessRatio;
  }
  const extraMonthly = evaluatedExcessAnnual / 12;
  const extraHealth = floor10(extraMonthly * p.rate);
  const health = salaryHealthEmployee + extraHealth;
  let ltc = null;
  if (p.longTermCareRatioToHealth != null) ltc = floor10(health * p.longTermCareRatioToHealth);

  return {
    year, type: 'employee', salaryHealthEmployee, totalOtherAnnual: floor10(totalOther),
    excessOtherAnnual: floor10(excess), evaluatedExcessAnnual: floor10(evaluatedExcessAnnual), extraMonthly: floor10(extraMonthly),
    extraHealth, healthPremium: health, ltcPremium: ltc, totalPremium: ltc == null ? health : health + ltc,
    longTermCarePending: ltc == null, limitsProvisional: p.limitsStatus === 'provisional-2026'
  };
}
