export const POLICY = {
  verifiedAt: '2026-10-03',
  basicPension: {
    2026: {
      status: 'confirmed',
      label: '2026 확정 기준',
      baseAmount: 349700,
      selection: { single: 2470000, couple: 3952000 },
      workDeduction: 1160000,
      workRecognitionRate: 0.70,
      monthlyInterestDeduction: 40000,
      basicPropertyDeduction: { metro: 135000000, city: 85000000, rural: 72500000 },
      financialPropertyDeduction: 20000000,
      annualPropertyConversionRate: 0.04,
      npsBenefitThreshold: 524550,
      npsAThreshold: 262270,
      supplementaryAmount: 174850,
      coupleReductionRate: 0.20,
      reversalFloorSingleRate: 0.10,
      reversalFloorCoupleHouseholdRate: 0.20,
      note: '2026년 국민연금공단·보건복지부 기준에 따른 간이 모의계산입니다.'
    },
    2027: {
      status: 'proposal',
      label: '2027 정부 예산안 미리보기',
      benefitBands: {
        lower30: 380000,
        lower30to45: 359000,
        lower45to70: 350000
      },
      coupleReduction: {
        lower30: 0.10,
        lower30to45: 0.10,
        lower45to70: 0.20
      },
      plannedStart: '2027-04',
      note: '2027년 지급액 차등안은 정부 예산안·법 개정 추진 단계입니다. 2027 선정기준액과 세부 산식은 아직 확정 고시 전이므로, 자격 판정은 확정할 수 없습니다.'
    }
  },
  healthInsurance: {
    2026: {
      status: 'confirmed',
      label: '2026 확정 기준',
      rate: 0.0719,
      propertyPointWon: 211.5,
      longTermCareRateOnIncome: 0.009448,
      longTermCareRatioToHealth: 0.009448 / 0.0719,
      regionalIncomeFloorPremium: 20160,
      regionalTotalCeilingPremium: 4591740,
      propertyBasicDeduction: 100000000,
      otherIncomeThresholdEmployee: 20000000,
      lowIncomeMonthlyBoundary: 280000
    },
    2027: {
      status: 'partial-confirmed',
      label: '2027 건보료율 확정 · 장기요양 미확정',
      rate: 0.0719,
      propertyPointWon: 211.5,
      longTermCareRateOnIncome: null,
      longTermCareRatioToHealth: null,
      regionalIncomeFloorPremium: 20160,
      regionalTotalCeilingPremium: 4591740,
      limitsStatus: 'provisional-2026',
      propertyBasicDeduction: 100000000,
      otherIncomeThresholdEmployee: 20000000,
      lowIncomeMonthlyBoundary: 280000,
      note: '2027 건강보험료율 7.19%와 지역가입자 재산점수당 211.5원은 확정되었습니다. 2027 장기요양보험료율과 지역보험료 상·하한은 아직 확정 전이므로 V1은 상·하한에 한해 2026 값을 잠정 적용합니다.'
    }
  }
};

export const PROPERTY_SCORE_TABLE = [
  [450,22],[900,44],[1350,66],[1800,97],[2250,122],[2700,146],[3150,171],[3600,195],[4050,219],[4500,244],
  [5020,268],[5590,294],[6220,320],[6930,344],[7710,365],[8590,386],[9570,412],[10700,439],[11900,465],[13300,490],
  [14800,516],[16400,535],[18300,559],[20400,586],[22700,611],[25300,637],[28100,659],[31300,681],[34900,706],[38800,731],
  [43200,757],[48100,785],[53600,812],[59700,841],[66500,881],[74000,921],[82400,961],[91800,1001],[103000,1041],[114000,1091],
  [127000,1141],[142000,1191],[158000,1241],[176000,1291],[196000,1341],[218000,1391],[242000,1451],[270000,1511],[300000,1571],[330000,1641],
  [363000,1711],[399300,1781],[439230,1851],[483153,1921],[531468,1991],[584615,2061],[643077,2131],[707385,2201],[778124,2271],[Infinity,2341]
];

export const SOURCES = [
  {
    title: '국민연금공단 — 2026 기초연금 수급요건',
    url: 'https://www.nps.or.kr/pbcpgdnc/mainbiz/getOHAG0059M0.do',
    detail: '2026 기준연금액 349,700원, 선정기준액 단독 247만원·부부 395.2만원'
  },
  {
    title: '국민연금공단 — 국민연금 연계감액 기준',
    url: 'https://www.nps.or.kr/elctcvlcpt/comm/getOHAC0000M5.do?menuId=MN24001038',
    detail: '2026 국민연금 급여액 524,550원·A급여액 262,270원 기준'
  },
  {
    title: '국민건강보험공단 — 2026 보험료율 안내',
    url: 'https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html',
    detail: '건강보험료율 7.19%, 재산점수당 211.5원, 장기요양 0.9448%'
  },
  {
    title: '보건복지부 — 2027 건강보험료율 결정',
    url: 'https://mohw.go.kr/gallery.es?act=view&bid=0003&list_no=380402&mid=a10605040000&tag=',
    detail: '2027 건강보험료율 7.19%, 재산점수당 211.5원 동결'
  },
  {
    title: '국가법령정보센터 — 지역가입자 재산점수 산정',
    url: 'https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1032090051',
    detail: '재산세 과세표준·무주택 전월세 평가액, 1억원 기본공제 및 재산등급 점수'
  },
  {
    title: '대한민국 정책브리핑 — 2027 예산안',
    url: 'https://www.korea.kr/news/policyFocusView.do?newsId=148971812&pWise=main&pWiseMain=F2&pkgId=49500845',
    detail: '2027 기초연금 정부안: 35만원→최대 38만원'
  }
];
