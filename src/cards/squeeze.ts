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
export type DragDirection='up'|'down'|'left'|'right';
export function foldDirection(dx:number,dy:number):{direction:DragDirection;axis:0|1;sign:1|-1;distance:number}{
 if(Math.abs(dx)>Math.abs(dy))return {direction:dx<0?'left':'right',axis:0,sign:dx<0?1:-1,distance:Math.abs(dx)};
 return {direction:dy<0?'up':'down',axis:1,sign:dy<0?1:-1,distance:Math.abs(dy)};
}
/** Cylindrical paper curl: the fixed region stays flat; the folding region has continuous position and tangent. */
export function bendVertex(x:number,y:number,p:number,axis:0|1,sign:1|-1):[number,number,number]{
 const length=axis===0?.78:1.15,r=.11,fold=p*(length+Math.PI*r),v=axis===0?x:y,s=length/2-v*sign;
 if(s>=fold||p<=0)return [x,y,0];const d=fold-s,theta=Math.min(Math.PI,d/r),ns=d>Math.PI*r?fold+d-Math.PI*r:fold-r*Math.sin(theta),nv=(length/2-ns)*sign;
 return [axis===0?nv:x,axis===1?nv:y,r*(1-Math.cos(theta))];
}
