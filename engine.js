/* GridSathi scheduling engine. Pure JS; deterministic; no server or external packages.
   This is a constrained heuristic, NOT a CP-SAT or proven optimal solver.
   Time is discretized into 30-minute slots; vehicles occupy at most one bay/slot.
*/
(function(root){'use strict';
const COLORS=['#e83c62','#4168ed','#f17719','#4db886','#51b1d0','#e5b80c','#9a68df','#ef8c5b'];
const BASE=[
{id:'EV-1',name:'Tata Nexon EV',battery:32,soc:42,target:55,due:1,arrival:0},
{id:'EV-2',name:'BYD Atto 3',battery:60,soc:40,target:70,due:3,arrival:0},
{id:'EV-3',name:'MG ZS EV',battery:40,soc:30,target:58,due:1.5,arrival:0},
{id:'EV-4',name:'Kia EV6',battery:70,soc:55,target:82,due:5,arrival:0},
{id:'EV-5',name:'Hyundai Kona',battery:40,soc:45,target:70,due:2,arrival:0},
{id:'EV-6',name:'Mahindra XUV400',battery:40,soc:51,target:66,due:1.5,arrival:0}
];
const TARIFF=[6.5,6.5,5,5,4.5,4.5,5,6,7.5,8.5];
function demand(ev){return Math.max(0,(ev.target-ev.soc)*ev.battery/100)}
function solarAt(t,enabled){return enabled?[0,0,1,2,3,4,3,2,1,0][t]:0}
function clock(t){const mins=600+Math.round(t*30);return `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`}
function run(vehicles,options={},mode='smart'){
 const cap=Number(options.capacity??14),fault=!!options.fault,brownout=!!options.brownout,solar=!!options.solar;
 const n=10,slots=[],remaining=vehicles.map(demand),delivered=vehicles.map(()=>0),allocations=vehicles.map(()=>Array(n).fill(0));
 const maxBays=fault?2:3,gridCap=Math.min(cap,brownout?10:Infinity),peakMax=gridCap+4;
 for(let t=0;t<n;t++){
  const siteLimit=gridCap+solarAt(t,solar),bayAssignments=Array(maxBays).fill(null);let left=siteLimit;
  const eligible=vehicles.map((ev,i)=>({ev,i,need:remaining[i],dueSlot:Math.round(ev.due*2),arrivalSlot:Math.round((ev.arrival||0)*2)})).filter(x=>x.need>0.000001&&x.arrivalSlot<=t&&t<x.dueSlot);
  const priority=x=>{if(mode==='fcfs')return [x.arrivalSlot,x.i];if(mode==='edf')return [x.dueSlot,x.i];
    const availableSlots=Math.max(1,x.dueSlot-t),slack=availableSlots*3.5-x.need;return [slack,x.dueSlot,x.i]};
  eligible.sort((a,b)=>{let p=priority(a),q=priority(b);for(let k=0;k<p.length;k++)if(p[k]!==q[k])return p[k]-q[k];return 0});
  // Each slot allocates a vehicle to at most one bay; max 7 kW per bay.
  for(let b=0;b<maxBays;b++){
    const choice=eligible.find(x=>remaining[x.i]>0.000001&&!bayAssignments.some(z=>z?.i===x.i));
    if(!choice||left<0.000001)break;
    const power=Math.min(7,left,remaining[choice.i]/0.5);
    if(power<0.000001)break;
    const energy=power*0.5;remaining[choice.i]=Math.max(0,remaining[choice.i]-energy);delivered[choice.i]+=energy;allocations[choice.i][t]=power;
    bayAssignments[b]={i:choice.i,id:choice.ev.id,power};left-=power;
  }
  slots.push({t,time:clock(t),tariff:TARIFF[t],solar:solarAt(t,solar),limit:siteLimit,gridLimit:gridCap,load:siteLimit-left,bays:bayAssignments});
 }
 const unmet=remaining.reduce((a,b)=>a+b,0),total=vehicles.reduce((a,v)=>a+demand(v),0);
 const onTime=vehicles.filter((v,i)=>remaining[i]<0.00001).length;
 const cost=slots.reduce((a,s)=>a+s.load*0.5*s.tariff,0);
 const peak=Math.max(0,...slots.map(s=>s.load));
 const fractions=vehicles.map((v,i)=>demand(v)>0?delivered[i]/demand(v):1);
 const fairness=fractions.reduce((a,b)=>a+b,0)**2/(vehicles.length*fractions.reduce((a,b)=>a+b*b,0)||1);
 const violations=slots.filter(s=>s.load>s.limit+1e-7).length;
 return {mode,vehicles,slots,remaining,delivered,allocations,unmet,total,onTime,cost,peak,fairness,violations,gridCap,peakMax,maxBays};
}
root.GridEngine={BASE,COLORS,TARIFF,demand,clock,run};
})(typeof window!=='undefined'?window:globalThis);
