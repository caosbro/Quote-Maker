const CONFIG={
  pin:"2468",
  minCharge:80,
  multiplier:1.5,
  waste:{
    mixed:{label:"Mixed Waste",unit:"tonne",price:170},
    wood:{label:"Wood",unit:"tonne",price:110},
    soil:{label:"Soil",unit:"tonne",price:80},
    rubble:{label:"Rubble",unit:"tonne",price:80},
    mattresses:{label:"Mattresses",unit:"each",price:50},
    fridges:{label:"Fridges",unit:"each",price:50}
  },
  common:{
    "2 Seater Sofa":.08,"3 Seater Sofa":.11,"Washing Machine":.07,"Tumble Dryer":.06,
    "Fridge Freezer":.10,"Single Mattress":.025,"Double Mattress":.035,"Wardrobe":.08,
    "Chest of Drawers":.05,"Black Bags":.02,"Carpet":.05,"Garden Waste":.08,"Builders Waste":.10
  },
  weights:{
    "2 Seater Sofa":"0.08 t","3 Seater Sofa":"0.11 t","Washing Machine":"0.07 t","Tumble Dryer":"0.06 t",
    "Fridge Freezer":"0.10 t","Single Mattress":"0.025 t","Double Mattress":"0.035 t","Wardrobe":"0.08 t",
    "Chest of Drawers":"0.05 t","Black Bags":"0.02 t each","Carpet":"0.05 t","Garden Waste":"0.08 t","Builders Waste":"0.10 t"
  }
};
let state=loadState();
const $=sel=> sel.startsWith("#")?document.querySelector(sel): (sel.includes("[")||sel.includes(".")||sel.includes(" "))?document.querySelector(sel):document.getElementById(sel);
const money=n=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(Number(n)||0);
const todayISO=()=>new Date().toISOString();
function loadState(){return JSON.parse(localStorage.getItem("epc_quotes")||"[]")}
function saveState(){localStorage.setItem("epc_quotes",JSON.stringify(state))}
function nextQuote(){let max=state.reduce((m,q)=>Math.max(m,parseInt((q.number||"").split("-").pop())||0),0)+1;return `EPC-${new Date().getFullYear()}-${String(max).padStart(5,"0")}`}
function toast(t){const e=$("toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}
function buildWaste(){
  $("wasteRows").innerHTML=Object.entries(CONFIG.waste).map(([key,w])=>{
    const step=w.unit==="each"?1:.1;
    const val=state.draft?.waste?.[key]||0;
    return `<div class="waste-row" data-key="${key}">
      <div><div class="waste-title">${w.label}</div><div class="waste-sub">${money(w.price)} / ${w.unit}</div></div>
      <div class="qty"><button data-act="minus">−</button><input data-qty type="number" min="0" step="${step}" value="${val}" inputmode="decimal"><button data-act="plus">+</button></div>
    </div>`}).join("");
}
function buildCommon(){
  $("commonItems").innerHTML=Object.entries(CONFIG.common).map(([name,w])=>`<button data-common="${name}">${name}<span>est. ${CONFIG.weights[name]}</span></button>`).join("");
}
function buildExtras(){
  const extras=[["Difficult access",20],["Upstairs flats",50],["Heavy lifting",50]];
  $("extras").innerHTML=extras.map(([n,v])=>`<button data-extra="${n}" data-value="${v}">${n}<span>+${money(v)}</span></button>`).join("");
}
function init(){
  buildWaste();buildCommon();buildExtras();
  $("quoteNumber").value=nextQuote();
  $("customerName").value="";$("customerPhone").value="";$("customerAddress").value="";$("jobNotes").value="";
  if(!state.draft)state.draft={waste:{},extras:{},customLabour:0,priceMode:"standard",customPrice:80,payment:"Outstanding"};
  bind();
  recalc();
}
function bind(){
  $("wasteRows").onclick=e=>{const row=e.target.closest(".waste-row");if(!row)return;const key=row.dataset.key;const input=row.querySelector("[data-qty]");const step=Number(input.step);let v=Number(input.value)||0;if(e.target.dataset.act==="plus")v+=step;if(e.target.dataset.act==="minus")v=Math.max(0,v-step);input.value=cleanNum(v);recalc()};
  $("wasteRows").oninput=()=>recalc();
  $("commonItems").onclick=e=>{const b=e.target.closest("[data-common]");if(!b)return;const name=b.dataset.common;const kg=CONFIG.common[name];let target="mixed";if(name.includes("Mattress"))target="mattresses";if(name==="Fridge Freezer")target="fridges";if(target==="mixed"){$(`[data-key="${target}"] [data-qty]`).value=cleanNum((Number($(`[data-key="${target}"] [data-qty]`).value)||0)+kg)}else{$(`[data-key="${target}"] [data-qty]`).value=cleanNum((Number($(`[data-key="${target}"] [data-qty]`).value)||0)+1)}recalc();toast(`${name} added`)};
  $("extras").onclick=e=>{const b=e.target.closest("[data-extra]");if(!b)return;b.classList.toggle("active");recalc()};
  document.querySelectorAll(".price-options button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".price-options button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("customPriceWrap").classList.toggle("hidden",b.dataset.price!=="custom");recalc()});
  document.querySelectorAll(".payment-grid button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".payment-grid button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("paymentStatus").textContent=b.dataset.payment});
  ["customerName","customerPhone","customerAddress","jobNotes","customLabour","customPrice"].forEach(id=>$(id).addEventListener("input",recalc));
  $("calculateBtn").onclick=()=>{recalc();toast("Quote calculated")};
  $("clearBtn").onclick=clearQuote;
  $("saveBtn").onclick=saveQuote;
  $("whatsappBtn").onclick=sendWhatsApp;
  $("savedBtn").onclick=showDashboard;
  $("weightsBtn").onclick=()=>{$("weightsModal").classList.remove("hidden")};
  $("closeWeights").onclick=()=>$("weightsModal").classList.add("hidden");
  $("customerBtn").onclick=showCustomer;
  $("backOwnerBtn").onclick=()=>showScreen("ownerScreen");
  $("lockBtn").onclick=()=>showDashboard();
  $("closeCosts").onclick=()=>$("costDrawer").classList.add("hidden");
  $("dashboardBack").onclick=()=>showScreen("ownerScreen");
  $("pinCancel").onclick=()=>$("pinModal").classList.add("hidden");
  $("pinSubmit").onclick=checkPin;
}
function cleanNum(n){return Math.round(n*1000)/1000}
function getData(){
  const waste={};document.querySelectorAll(".waste-row").forEach(r=>waste[r.dataset.key]=Number(r.querySelector("[data-qty]").value)||0);
  const extras={};document.querySelectorAll("[data-extra].active").forEach(b=>extras[b.dataset.extra]=Number(b.dataset.value));
  const extraTotal=Object.values(extras).reduce((a,b)=>a+b,0)+(Number($("customLabour").value)||0);
  const wasteCost=Object.entries(waste).reduce((s,[k,v])=>s+v*CONFIG.waste[k].price,0);
  const labourBase=jobType(waste);
  const labour=labourBase+extraTotal;
  const totalCost=wasteCost+labour;
  const mode=document.querySelector(".price-options .selected")?.dataset.price||"standard";
  let quote=totalCost*1.5;if(mode==="plus10")quote=totalCost*1.5*1.1;if(mode==="plus20")quote=totalCost*1.5*1.2;if(mode==="custom")quote=Number($("customPrice").value)||CONFIG.minCharge;
  quote=Math.max(CONFIG.minCharge,quote);
  return {waste,extras,extraTotal,wasteCost,labourBase,labour,totalCost,quote,mode};
}
function jobType(w){
  const soil=w.soil>0,rubble=w.rubble>0,other=Object.entries(w).some(([k,v])=>v>0&&!["soil","rubble"].includes(k));
  if((soil||rubble)&&other)return 150;
  if((soil||rubble)&&!other)return 130;
  return 60;
}

function clearQuote(){
  document.querySelectorAll("[data-qty]").forEach(i=>i.value=0);
  document.querySelectorAll("#extras [data-extra].active").forEach(b=>b.classList.remove("active"));
  ["customerName","customerPhone","customerAddress","jobNotes","customLabour","customPrice"].forEach(id=>{const e=$(id); if(e) e.value="";});
  document.querySelectorAll(".price-options button,.payment-grid button").forEach(b=>b.classList.remove("selected"));
  if($("paymentStatus")) $("paymentStatus").textContent="";
  if($("customPriceWrap")) $("customPriceWrap").classList.add("hidden");
  recalc();
  toast("Quote cleared");
}
function recalc(){
  const d=getData();$("quoteTotal").textContent=money(d.quote);$("customerPriceDisplay").textContent=money(d.quote);
  $("paymentStatus").textContent=document.querySelector(".payment-grid .selected")?.dataset.payment||"Outstanding";
}
function showScreen(id){["ownerScreen","customerScreen","dashboardScreen"].forEach(x=>$(x).classList.toggle("hidden",x!==id))}
function showCustomer(){recalc();showScreen("customerScreen")}
function showDashboard(){ $("pinInput").value="";$("pinModal").classList.remove("hidden"); }
function checkPin(){if($("pinInput").value===CONFIG.pin){$("pinModal").classList.add("hidden");renderDashboard();showScreen("dashboardScreen")}else toast("Incorrect PIN")}
function saveQuote(){
  const d=getData();const payment=document.querySelector(".payment-grid .selected")?.dataset.payment||"Outstanding";
  const q={number:$("quoteNumber").value||nextQuote(),date:todayISO(),name:$("customerName").value.trim(),phone:$("customerPhone").value.trim(),address:$("customerAddress").value.trim(),notes:$("jobNotes").value.trim(),payment,quote:d.quote,cost:d.totalCost,profit:d.quote-d.totalCost,waste:d.waste,labour:d.labour,labourBase:d.labourBase,extraLabour:d.extraTotal};
  if(!q.name&&!q.address)toast("Add customer details first");
  state.unshift(q);saveState();$("quoteNumber").value=nextQuote();toast("Quote saved");return q;
}
function sendWhatsApp(){
  const d=getData();const text=`EVANS PROPERTY CLEARANCE%0A%0A${encodeURIComponent(d.quote?money(d.quote):money(80))}%0A%0AWaste Removal Quote%0A%0A${encodeURIComponent($("customerName").value||"Customer")}`;
  window.open(`https://wa.me/?text=${text}`,"_blank");
}
function renderDashboard(){
  const now=new Date(),day=now.toISOString().slice(0,10),weekStart=new Date(now);weekStart.setDate(now.getDate()-((now.getDay()+6)%7));weekStart.setHours(0,0,0,0);const month=now.getMonth();
  const paid=q=>q.payment==="Paid"||q.payment==="Cash"||q.payment==="Bank Transfer";
  const outstanding=state.filter(q=>q.payment==="Outstanding").reduce((s,q)=>s+q.quote,0);
  const daily=state.filter(q=>q.date.slice(0,10)===day).reduce((s,q)=>s+q.profit,0);
  const weekly=state.filter(q=>new Date(q.date)>=weekStart).reduce((s,q)=>s+q.profit,0);
  const monthly=state.filter(q=>{const d=new Date(q.date);return d.getMonth()===month&&d.getFullYear()===now.getFullYear()}).reduce((s,q)=>s+q.profit,0);
  $("dailyProfit").textContent=money(daily);$("weeklyProfit").textContent=money(weekly);$("monthlyProfit").textContent=money(monthly);$("outstandingTotal").textContent=money(outstanding);
  const wk=state.filter(q=>new Date(q.date)>=weekStart),quoted=wk.reduce((s,q)=>s+q.quote,0),paidTotal=wk.filter(paid).reduce((s,q)=>s+q.quote,0),out=wk.filter(q=>q.payment==="Outstanding").reduce((s,q)=>s+q.quote,0),profit=wk.reduce((s,q)=>s+q.profit,0);
  $("weekQuoted").textContent=money(quoted);$("weekPaid").textContent=money(paidTotal);$("weekOutstanding").textContent=money(out);$("weekProfit").textContent=money(profit);
  $("savedList").innerHTML=state.length?state.map((q,i)=>`<div class="quote-record"><strong>${q.number} — ${q.name||"No name"}</strong><div class="muted">${new Date(q.date).toLocaleDateString("en-GB")} · ${q.payment}</div><div>${money(q.quote)} · Profit ${money(q.profit)}</div><div class="record-actions"><button data-view="${i}">CUSTOMER VIEW</button><button data-cost="${i}">SHOW MY COSTS</button></div></div>`).join(""):"<p>No saved quotes yet.</p>";
  $("savedList").onclick=e=>{if(e.target.dataset.view!==undefined){const q=state[Number(e.target.dataset.view)];$("customerPriceDisplay").textContent=money(q.quote);showScreen("customerScreen")}if(e.target.dataset.cost!==undefined){const q=state[Number(e.target.dataset.cost)];showCosts(q)}};
}
function showCosts(q=getData()){
  const d=q.wasteCost!==undefined?q:{wasteCost:getData().wasteCost,labour:q.labour||0,labourBase:q.labourBase||0,extraLabour:q.extraLabour||0,cost:q.cost||getData().totalCost,quote:q.quote||getData().quote,profit:q.profit||((q.quote||0)-(q.cost||0))};
  let html=`<div class="cost-line"><span>Waste / tip costs</span><strong>${money(d.wasteCost)}</strong></div><div class="cost-line"><span>Base labour</span><strong>${money(d.labourBase)}</strong></div><div class="cost-line"><span>Extra labour</span><strong>${money(d.extraLabour)}</strong></div><div class="cost-line"><span>Total costs</span><strong>${money(d.cost||d.totalCost)}</strong></div><div class="cost-line"><span>Customer quote</span><strong>${money(d.quote)}</strong></div><div class="cost-total">Profit: ${money(d.profit)}</div>`;
  $("costBreakdown").innerHTML=html;$("costDrawer").classList.remove("hidden");
}
$("weightsTable").innerHTML=Object.entries(CONFIG.weights).map(([n,w])=>`<div class="weight-row"><span>${n}</span><strong>${w}</strong></div>`).join("");
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
init();
