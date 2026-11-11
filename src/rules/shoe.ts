import {type Card} from './baccarat';
export type Shoe = {id:string;cards:Card[];cursor:number;cut:number;burned:number};
export function randomBelow(n:number) {
 const max=0x100000000,limit=Math.floor(max/n)*n,a=new Uint32Array(1);let x:number;
 do{crypto.getRandomValues(a);x=a[0];}while(x>=limit);return x%n;
}
export function newShoe():Shoe {
 const cards:Card[]=[];for(let deck=0;deck<8;deck++)for(let suit=0;suit<4;suit++)for(let rank=1;rank<=13;rank++)cards.push({id:`${deck}-${suit}-${rank}`,rank,suit});
 for(let i=cards.length-1;i>0;i--){const j=randomBelow(i+1);[cards[i],cards[j]]=[cards[j],cards[i]];}
 // Official option: discard a number of cards equal to the deck count.
 return {id:crypto.randomUUID(),cards,cursor:8,cut:cards.length-14,burned:8};
}
export function drawCard(shoe:Shoe):Card {if(shoe.cursor>=shoe.cards.length)throw new Error('牌靴已空');return shoe.cards[shoe.cursor++];}
export const needShoe=(shoe:Shoe)=>shoe.cursor>=shoe.cut||shoe.cards.length-shoe.cursor<6;
