import {describe,it,expect} from 'vitest';
import {bankerDraw,play,settle,result,emptyBets,type Card,type Mode} from '../src/rules/baccarat';
import {newShoe,drawCard} from '../src/rules/shoe';
const c=(rank:number,suit=0):Card=>({id:`${rank}-${suit}`,rank:rank||10,suit});
function run(ranks:number[]){let n=0;const r=play(()=>c(ranks[n++]));return {r,n};}
describe('Punto Banco complete drawing matrix',()=>{
 for(let b=0;b<=9;b++)for(let t=0;t<10;t++)it(`banker ${b}, player third ${t}`,()=>{const allowed=[[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,8,9],[0,1,2,3,4,5,6,7,9],[2,3,4,5,6,7],[4,5,6,7],[6,7],[],[],[]];expect(bankerDraw(b,t)).toBe(allowed[b].includes(t));});
 for(let b=0;b<=9;b++)it(`player stands banker ${b}`,()=>expect(bankerDraw(b,null)).toBe(b<=5));
 for(let p=0;p<=9;p++)for(let b=0;b<=9;b++)it(`initial ${p}/${b} complete deal order`,()=>{const {r,n}=run([p,b,0,0,4,5]);if(p>=8||b>=8){expect(n).toBe(4);expect(r.natural).toBe(true);}else{expect(r.player.length).toBe(p<=5?3:2);expect(r.player[0].rank).toBe(p||10);expect(r.banker[0].rank).toBe(b||10);expect(n).toBe(r.player.length+r.banker.length);const expectBank=p<=5?b<=2||b===3||b===4||b===5:b<=5;expect(r.banker.length).toBe(expectBank?3:2);}});
 it('8 and 9 natural suppress both third cards',()=>{for(const ranks of [[8,2,0,0],[2,9,0,0],[9,8,0,0]])expect(run(ranks).n).toBe(4);});
});
describe('integer payouts, independent bets',()=>{
 const bets={...emptyBets(),P:10000,B:10000,T:10000,PP:10000,BP:10000,D7:10000};
 const tie=result([c(4),c(4,1)],[c(9),c(9,1)]);
 it('tie refunds both main stakes, pays 8:1 and both pairs 11:1',()=>{expect(settle(bets,tie,'commission').returns).toEqual({...emptyBets(),P:10000,B:10000,T:90000,PP:120000,BP:120000,D7:0});});
 it('5% commission returns principal separately',()=>{const r=result([c(2),c(3)],[c(4),c(3)]);expect(settle({...emptyBets(),B:10000},r,'commission')).toMatchObject({stake:10000,paid:19500,net:9500});});
 it('super6 half profit for either two or three card six',()=>{for(const hand of [[c(3),c(3)],[c(1),c(2),c(3)]])expect(settle({...emptyBets(),B:10000},result([c(1),c(2)],hand),'super6').paid).toBe(15000);});
 it('dragon three-card seven main push / player loss / side payout',()=>{const r=result([c(2),c(3)],[c(1),c(2),c(4)]);expect(settle(bets,r,'dragon').returns).toMatchObject({B:10000,P:0,T:0,D7:410000});});
 it('two-card seven is not dragon',()=>{const r=result([c(1),c(2)],[c(3),c(4)]);expect(r.dragon).toBe(false);expect(settle(bets,r,'dragon').returns).toMatchObject({B:20000,D7:0});});
 it('dragon bet wins in all modes',()=>{for(const m of ['commission','super6','dragon'] as Mode[])expect(settle(bets,result([c(1),c(2)],[c(1),c(2),c(4)]),m).returns.D7).toBe(410000);});
 it('J and Q do not form pair',()=>expect(result([c(11),c(12)],[c(3),c(4)]).pp).toBe(false));
 it('fixed point stays integer even smallest permitted bet',()=>{for(const mode of ['commission','super6','dragon'] as Mode[])expect(Number.isSafeInteger(settle({...emptyBets(),B:1000},result([c(1),c(2)],[c(3),c(3)]),mode).paid)).toBe(true);});
});
describe('physical eight-deck shoe',()=>{
 it('416 unique physical cards, 8 burned, 14 behind cut',()=>{const s=newShoe();expect(s.cards.length).toBe(416);expect(new Set(s.cards.map(c=>c.id)).size).toBe(416);expect(s.cursor).toBe(8);expect(s.cut).toBe(402);const seen=new Set<string>();while(s.cursor<416){const card=drawCard(s);expect(seen.has(card.id)).toBe(false);seen.add(card.id);}expect(seen.size).toBe(408);expect(()=>drawCard(s)).toThrow();});
 it('draw after snapshot retains physical identity',()=>{const s=newShoe(),clone=structuredClone(s);expect(drawCard(s)).toEqual(drawCard(clone));});
});
