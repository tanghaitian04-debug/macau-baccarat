export type Vec3=[number,number,number];
export const SHOE_EXIT:Vec3=[1.05,.72,-1.6];
export const CARD_DURATION={slow:1500,standard:1000,fast:650} as const;
export const mix=(a:Vec3,b:Vec3,t:number):Vec3=>t>=1?[...b]:t<=0?[...a]:a.map((v,i)=>v+(b[i]-v)*t) as Vec3;
export function cardDestination(player:boolean,index:number):Vec3{return [player?-1.75+index*.69:1+index*.69,.56,-.03+(index===2?.27:0)];}
export function dealPose(destination:Vec3,progress:number){
 const u=Math.max(0,Math.min(1,progress)),release:Vec3=[destination[0]<0?-.55:.65,.60,-1.35];
 const card=u>=1?[...destination] as Vec3:u<.25?SHOE_EXIT:u<.66?mix(SHOE_EXIT,release,(u-.25)/.41):mix(release,destination,(u-.66)/.34);
 // Fingers contact the card from extraction until release; only the final felt slide is free.
 const wrist=u<.25?mix([.6,1.0,-1.8],SHOE_EXIT,u/.25):u<.66?card:mix(release,[.6,1.0,-1.8],(u-.66)/.34);
 return {card,wrist,grip:u>=.2&&u<.66};
}
