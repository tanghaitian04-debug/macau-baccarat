export type Squeeze={active:boolean;progress:number;revealed:boolean};
export function squeezeStep(s:Squeeze,event:'start'|'drag'|'cancel'|'release'|'open',amount=0):Squeeze {
 if(s.revealed)return s;
 if(event==='open')return {active:false,progress:1,revealed:true};
 if(event==='start')return {...s,active:true};
 if(event==='cancel')return {active:false,progress:0,revealed:false};
 if(event==='drag'&&s.active){const progress=Math.max(0,Math.min(1,amount));return {active:true,progress,revealed:progress>=.98};}
 if(event==='release')return {active:false,progress:s.revealed?1:0,revealed:s.revealed};
 return s;
}
