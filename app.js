import { POLICY, SOURCES } from './policy-data.js';
import { calcBasicPension2026, calcBasicPension2027Preview, calcRegionalHealth, calcEmployeeHealth } from './calculators.js';

let currentYear = 2026;
let lastPension = null;
let lastHealth = null;
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];
const fmt = (v) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(v)||0));
const money = (v) => `${fmt(v)}원`;

function go(id){
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===id));
  window.scrollTo({top:0,behavior:'smooth'});
  if(id==='summary') renderSummary();
}
document.addEventListener('click',e=>{ const el=e.target.closest('[data-go]'); if(el) go(el.dataset.go); });
document.addEventListener('keydown',e=>{ const el=e.target.closest('[data-go]'); if(el && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); go(el.dataset.go); } });

function updateYear(year){
  currentYear = year;
  $$('.year-btn').forEach(b=>b.classList.toggle('active',Number(b.dataset.year)===year));
  renderStatus();
  if(year===2027){
    $('#preview-2027-band').classList.remove('hidden');
    $('#pension-2026-fields').classList.add('hidden');
  } else {
    $('#preview-2027-band').classList.add('hidden');
    $('#pension-2026-fields').classList.remove('hidden');
  }
  $('#pension-result').innerHTML = `<div class="result-empty"><span>🧮</span><strong>${year}년 기준으로 계산합니다</strong><p>값을 확인한 뒤 계산 버튼을 눌러주세요.</p></div>`;
  $('#health-result').innerHTML = `<div class="result-empty"><span>🩺</span><strong>${year}년 기준으로 계산합니다</strong><p>가입자 유형과 금액을 입력하세요.</p></div>`;
  lastPension = null; lastHealth = null;
}
$$('.year-btn').forEach(b=>b.addEventListener('click',()=>updateYear(Number(b.dataset.year))));

function renderStatus(){
  const bp=POLICY.basicPension[currentYear], hi=POLICY.healthInsurance[currentYear];
  $('#pension-status').innerHTML = currentYear===2026
    ? `<span class="tag ok">확정</span><strong>2026 기준연금액 ${fmt(bp.baseAmount)}원</strong> · 선정기준액 단독 ${fmt(bp.selection.single)}원 / 부부 ${fmt(bp.selection.couple)}원`
    : `<span class="tag warn">정부안</span><strong>2027년 4월 시행 목표</strong> · 하위 30% 38만원 / 30~45% 35.9만원 / 45~70% 35만원. <u>최종 법·고시 확정 전</u>`;
  $('#health-status').innerHTML = currentYear===2026
    ? `<span class="tag ok">확정</span><strong>건강보험료율 7.19%</strong> · 재산점수당 211.5원 · 장기요양보험료율 0.9448%`
    : `<span class="tag ok">건보 확정</span><strong>2027 건강보험료율 7.19%</strong> · 재산점수당 211.5원 <span class="tag warn">장기요양 미확정</span> 장기요양보험료는 결과에서 제외합니다.`;
}

function toggleCouple(){
  const couple=$('#pension-form [name="household"]').value==='couple';
  $$('.couple-only').forEach(el=>el.classList.toggle('hidden',!couple));
}
$('#pension-form [name="household"]').addEventListener('change',toggleCouple);

function formObj(form){ return Object.fromEntries(new FormData(form).entries()); }
function numForm(o, names){ names.forEach(k=>o[k]=Number(o[k]||0)); return o; }

$('#pension-form').addEventListener('submit',e=>{
  e.preventDefault();
  const fd=formObj(e.currentTarget);
  fd.excludedOccupationalPension=$('#pension-form [name="excludedOccupationalPension"]').checked;
  fd.bothReceive=$('#pension-form [name="bothReceive"]').checked;
  numForm(fd,['age','workSelf','workSpouse','publicPensionSelf','publicPensionSpouse','businessMonthly','privatePensionMonthly','interestMonthly','otherMonthly','generalProperty','financialProperty','debt','luxuryProperty','aBenefitSelf','aBenefitSpouse']);
  if(currentYear===2026){ lastPension=calcBasicPension2026(fd); renderPension2026(lastPension); }
  else { lastPension=calcBasicPension2027Preview(fd); renderPension2027(lastPension); }
});

function renderPension2026(r){
  const pct=Math.min(100,(r.recognizedIncome/r.threshold)*100);
  if(!r.eligible){
    $('#pension-result').innerHTML=`<div class="result-top"><div class="result-kicker">2026 기초연금 모의판정</div><div class="result-amount">수급 어려움</div><span class="result-pill no">${r.reason}</span></div>
      <div class="metric-list"><div class="metric"><span>예상 소득인정액</span><strong>${money(r.recognizedIncome)}</strong></div><div class="metric"><span>선정기준액</span><strong>${money(r.threshold)}</strong></div></div>
      <div class="progress"><i style="width:${pct}%"></i></div><div class="explain"><strong>계산 구성</strong><br>소득평가액 ${money(r.incomeEvaluation)} + 재산 소득환산액 ${money(r.propertyConversion)}</div>
      <div class="result-alert">실제 판정은 행복이음 공적자료와 각종 특례·예외를 반영합니다. 경계선이면 국민연금공단 1355 또는 복지로에서 최종 확인하세요.</div>`;
    return;
  }
  $('#pension-result').innerHTML=`<div class="result-top"><div class="result-kicker">예상 월 기초연금</div><div class="result-amount">${money(r.monthlyBenefitHousehold)} <small>${r.spouseBenefit>0?'가구 합계':'본인'}</small></div><span class="result-pill">수급 가능성 있음</span></div>
    <div class="metric-list">
      <div class="metric"><span>소득인정액</span><strong>${money(r.recognizedIncome)}</strong></div>
      <div class="metric"><span>선정기준액</span><strong>${money(r.threshold)}</strong></div>
      <div class="metric"><span>소득평가액</span><strong>${money(r.incomeEvaluation)}</strong></div>
      <div class="metric"><span>재산 소득환산액</span><strong>${money(r.propertyConversion)}</strong></div>
      ${r.spouseBenefit>0?`<div class="metric"><span>본인 / 배우자</span><strong>${money(r.applicantBenefit)} / ${money(r.spouseBenefit)}</strong></div>`:''}
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="explain"><strong>감액 반영</strong><br>${r.coupleReductionApplied?'부부감액 적용 · ':''}${r.linkedReductionApplied?'국민연금 연계감액 적용 · ':''}${r.reversalApplied?'소득역전방지 감액 적용':'소득역전방지 감액 없음'}</div>
    <div class="result-alert">입력한 재산은 실제 행정 평가액과 다를 수 있습니다. 특히 주택·금융재산·부채·무료임차소득은 공적자료 확인 과정에서 차이가 날 수 있습니다.</div>`;
}
function renderPension2027(r){
  const labels={lower30:'소득 하위 30%',lower30to45:'하위 30~45%',lower45to70:'하위 45~70%'};
  $('#pension-result').innerHTML=`<div class="result-top"><div class="result-kicker">2027 정부안 미리보기</div><div class="result-amount">${money(r.householdBenefit)} <small>${r.bothReceive?'부부 합계':'1인'}</small></div><span class="result-pill">${labels[r.band]}</span></div>
    <div class="metric-list"><div class="metric"><span>정부안 기준 1인 지급액</span><strong>${money(r.baseAmount)}</strong></div><div class="metric"><span>부부감액률</span><strong>${Math.round(r.reductionRate*100)}%</strong></div><div class="metric"><span>시행 목표</span><strong>2027년 4월</strong></div></div>
    <div class="result-alert"><strong>확정액이 아닙니다.</strong> 2027 선정기준액과 소득구간 세부 판정기준은 아직 확정 고시 전입니다. 국회 심의·법 개정 결과에 따라 달라질 수 있습니다.</div>`;
}

function toggleHealthType(){
  const type=$('input[name="insuranceType"]:checked').value;
  $('#regional-fields').classList.toggle('hidden',type!=='regional');
  $('#employee-fields').classList.toggle('hidden',type!=='employee');
}
$$('input[name="insuranceType"]').forEach(i=>i.addEventListener('change',toggleHealthType));
$('#health-form [name="homeowner"]').addEventListener('change',e=>$('#rent-fields').classList.toggle('hidden',e.target.checked));

$('#health-form').addEventListener('submit',e=>{
  e.preventDefault();
  const type=$('input[name="insuranceType"]:checked').value;
  const f=formObj(e.currentTarget);
  if(type==='regional'){
    const data={
      interestAnnual:+f.rInterestAnnual||0, dividendAnnual:+f.rDividendAnnual||0, businessAnnual:+f.rBusinessAnnual||0, otherAnnual:+f.rOtherAnnual||0,
      wageAnnual:+f.rWageAnnual||0, pensionAnnual:+f.rPensionAnnual||0, propertyTaxBase:+f.propertyTaxBase||0,
      eligibleHousingLoanDeduction:+f.eligibleHousingLoanDeduction||0, homeowner:$('#health-form [name="homeowner"]').checked,
      rentDeposit:+f.rentDeposit||0, monthlyRent:+f.monthlyRent||0
    };
    lastHealth=calcRegionalHealth(currentYear,data);
  } else {
    const data={salaryMonthly:+f.salaryMonthly||0,interestAnnual:+f.eInterestAnnual||0,dividendAnnual:+f.eDividendAnnual||0,businessAnnual:+f.eBusinessAnnual||0,otherAnnual:+f.eOtherAnnual||0,wageOutsideAnnual:+f.eWageOutsideAnnual||0,pensionAnnual:+f.ePensionAnnual||0};
    lastHealth=calcEmployeeHealth(currentYear,data);
  }
  renderHealth(lastHealth);
});

function renderHealth(r){
  if(r.type==='regional'){
    $('#health-result').innerHTML=`<div class="result-top"><div class="result-kicker">예상 월 건강보험 부담</div><div class="result-amount">${money(r.totalPremium)} <small>${r.longTermCarePending?'건보만':'건보+장기요양'}</small></div><span class="result-pill">지역가입자</span></div>
      <div class="metric-list"><div class="metric"><span>건강보험료</span><strong>${money(r.healthPremium)}</strong></div><div class="metric"><span>소득분</span><strong>${money(r.incomePremium)}</strong></div><div class="metric"><span>재산분</span><strong>${money(r.propertyPremium)}</strong></div><div class="metric"><span>재산 점수</span><strong>${fmt(r.propertyPoints)}점 · ${r.propertyGrade||0}등급</strong></div>${r.ltcPremium!=null?`<div class="metric"><span>장기요양보험료</span><strong>${money(r.ltcPremium)}</strong></div>`:''}</div>
      <div class="explain"><strong>재산 계산</strong><br>1억원 기본공제 후 보험료 대상 재산 ${money(r.adjustedProperty)}${r.rentAssessment>0?` · 전월세 평가액 ${money(r.rentAssessment)}`:''}</div>
      ${r.longTermCarePending?`<div class="result-alert">2027 장기요양보험료율이 아직 확정되지 않아 건강보험료만 계산했습니다.</div>`:''}${r.limitsProvisional?`<div class="result-alert"><strong>2027 지역보험료 상·하한은 미확정</strong>이라 V1에서는 상·하한에 한해 2026 값을 잠정 적용했습니다. 일반 구간의 7.19%·재산점수당 211.5원은 2027 확정값입니다.</div>`:''}`;
  } else {
    $('#health-result').innerHTML=`<div class="result-top"><div class="result-kicker">예상 월 본인부담</div><div class="result-amount">${money(r.totalPremium)} <small>${r.longTermCarePending?'건보만':'건보+장기요양'}</small></div><span class="result-pill">직장가입자</span></div>
      <div class="metric-list"><div class="metric"><span>월급분 건강보험</span><strong>${money(r.salaryHealthEmployee)}</strong></div><div class="metric"><span>보수 외 소득 합계</span><strong>${money(r.totalOtherAnnual)}/년</strong></div><div class="metric"><span>2천만원 초과분</span><strong>${money(r.excessOtherAnnual)}/년</strong></div><div class="metric"><span>보수 외 추가 건보료</span><strong>${money(r.extraHealth)}</strong></div>${r.ltcPremium!=null?`<div class="metric"><span>장기요양보험료</span><strong>${money(r.ltcPremium)}</strong></div>`:''}</div>
      <div class="explain">근로·연금소득은 건강보험 보수 외 소득월액 산정에서 50%, 이자·배당·사업·기타소득은 100% 평가합니다.</div>
      ${r.longTermCarePending?`<div class="result-alert">2027 장기요양보험료율은 아직 확정 전이라 결과에 포함하지 않았습니다.</div>`:''}`;
  }
}

function renderSummary(){
  const box=$('#summary-content');
  if(!lastPension && !lastHealth){
    box.innerHTML=`<div class="summary-empty"><h2>아직 계산 결과가 없습니다</h2><p>기초연금과 건강보험료를 계산하면 여기에 자동으로 모아드립니다.</p><div class="summary-actions" style="justify-content:center"><button class="primary" data-go="pension">기초연금부터 계산</button><button class="secondary" data-go="health">건강보험 계산</button></div></div>`;return;
  }
  const pension=lastPension ? (lastPension.monthlyBenefitHousehold ?? lastPension.householdBenefit ?? 0) : 0;
  const health=lastHealth ? lastHealth.totalPremium : 0;
  const net=pension-health;
  box.innerHTML=`<div class="summary-grid">
    <div class="summary-card"><h3>받는 돈 · 기초연금</h3><div class="summary-big">+ ${money(pension)}</div><p>${lastPension?currentYear+'년 계산 결과':'아직 계산하지 않음'}</p></div>
    <div class="summary-card"><h3>내는 돈 · 건강보험</h3><div class="summary-big">- ${money(health)}</div><p>${lastHealth?(lastHealth.longTermCarePending?'장기요양 미포함':'장기요양 포함'):'아직 계산하지 않음'}</p></div>
    <div class="summary-card summary-net"><h3>단순 월 순액 비교</h3><div class="summary-big">${net>=0?'+ ':''}${money(net)}</div><p>기초연금 예상액에서 건강보험·장기요양 본인부담 추정액을 단순 차감한 참고값입니다. 실제 가처분소득과는 다릅니다.</p></div>
  </div>`;
}

$('#sources-list').innerHTML=SOURCES.map(s=>`<div class="source-item"><a href="${s.url}" target="_blank" rel="noopener">${s.title} ↗</a><p>${s.detail}</p></div>`).join('');
renderStatus();toggleCouple();toggleHealthType();
