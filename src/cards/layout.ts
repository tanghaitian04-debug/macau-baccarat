/** Fixed coordinates in a conventional two-column pip deck, measured from the top-left. */
export type Pip=readonly [number,number];
const pair=(y:number):Pip[]=>[[.28,y],[.72,y]];
export const PIP_LAYOUTS:Readonly<Record<number,readonly Pip[]>>={
 1:[[.5,.5]],2:[[.5,.22],[.5,.78]],3:[[.5,.22],[.5,.5],[.5,.78]],
 4:[...pair(.22),...pair(.78)],5:[...pair(.22),[.5,.5],...pair(.78)],
 6:[...pair(.22),...pair(.5),...pair(.78)],
 7:[...pair(.22),[.5,.36],...pair(.5),...pair(.78)],
 8:[...pair(.22),[.5,.36],...pair(.5),[.5,.64],...pair(.78)],
 9:[...pair(.18),...pair(.39),[.5,.5],...pair(.61),...pair(.82)],
 10:[...pair(.18),[.5,.285],...pair(.39),...pair(.61),[.5,.715],...pair(.82)]
};
export type CardFaceMode='macau'|'standard';
/** Analytic back-face visibility of a material point on the cylindrical fold.
 * GPU depth testing still determines occlusion: this helper never drives printed pips. */
export function frontFacingAt(u:number,v:number,p:number,axis:0|1,sign:1|-1){
 const length=axis===0?.78:1.15,r=.11,coord=axis===0?(u-.5)*length:(.5-v)*length;
 const s=length/2-coord*sign,d=p*(length+Math.PI*r)-s;
 return d>Math.PI*r/2;
}
