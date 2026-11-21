const assert=require('node:assert/strict');require('../engine.js');const E=globalThis.GridEngine;
for(const mode of ['smart','edf','fcfs'])for(const capacity of [7,10,14,21])for(const fault of [false,true])for(const solar of [false,true]){
 const r=E.run(E.BASE,{capacity,fault,solar},mode);
 assert.equal(r.slots.length,10);assert.equal(r.violations,0);
 for(const s of r.slots){assert(s.load<=s.limit+1e-7);assert(s.bays.filter(Boolean).length<=(fault?2:3));for(const a of s.bays.filter(Boolean))assert(a.power<=7+1e-7)}
 for(let i=0;i<E.BASE.length;i++){assert(r.delivered[i]<=E.demand(E.BASE[i])+1e-7);assert(r.remaining[i]>=-1e-7);for(let t=0;t<10;t++)if(t>=E.BASE[i].due*2)assert.equal(r.allocations[i][t],0)}
 assert(Math.abs(r.unmet+r.delivered.reduce((a,b)=>a+b,0)-r.total)<1e-7);
}
console.log('PASS: 48 configurations × capacity, bay, energy, deadline and conservation checks');
