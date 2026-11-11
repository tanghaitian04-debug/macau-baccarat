import {type Bets,type Mode,type Result,type Card,emptyBets,isNatural,points,bankerDraw,value,result,settle} from '../rules/baccarat';
import {type Shoe,newShoe,drawCard,needShoe} from '../rules/shoe';
export type Phase='betting'|'closing'|'dealing'|'squeezing'|'drawing'|'result'|'settling'|'complete';
export type RecordRound=Result&{id:string;shoeId:string;time:number;mode:Mode;bets:Bets;net:number;paid:number;returns:Bets};
export type Game={version:1;shoe:Shoe;balance:number;bets:Bets;previous:Bets;undo:{bet:keyof Bets;amount:number}[];phase:Phase;player:Card[];banker:Card[];visible:number;revealed:string[];history:RecordRound[];current:RecordRound|null;mode:Mode;roundId:string;handStage:'initial'|'player'|'banker'|'done'};
export const initial=():Game=>({version:1,shoe:newShoe(),balance:10000000,bets:emptyBets(),previous:emptyBets(),undo:[],phase:'betting',player:[],banker:[],visible:0,revealed:[],history:[],current:null,mode:'commission',roundId:'',handStage:'initial'});
export const total=(bets:Bets)=>Object.values(bets).reduce((a,b)=>a+b,0);
export const ordered=(g:Game)=>[g.player[0],g.banker[0],g.player[1],g.banker[1],g.player[2],g.banker[2]].filter(Boolean);
export function place(g:Game,bet:keyof Bets,amount:number):Game {if(g.phase!=='betting'||amount>g.balance||amount<=0||!Number.isSafeInteger(amount)||amount%1000)return g;return {...g,balance:g.balance-amount,bets:{...g.bets,[bet]:g.bets[bet]+amount},undo:[...g.undo,{bet,amount}]};}
export function undo(g:Game):Game {if(g.phase!=='betting'||!g.undo.length)return g;const a=g.undo.at(-1)!;return {...g,balance:g.balance+a.amount,bets:{...g.bets,[a.bet]:g.bets[a.bet]-a.amount},undo:g.undo.slice(0,-1)};}
export function clear(g:Game):Game {if(g.phase!=='betting')return g;return {...g,balance:g.balance+total(g.bets),bets:emptyBets(),undo:[]};}
export function repeat(g:Game):Game {if(g.phase!=='betting')return g;const c=clear(g);if(total(c.previous)>c.balance)return g;return {...c,balance:c.balance-total(c.previous),bets:{...c.previous},undo:(Object.keys(c.previous) as (keyof Bets)[]).filter(k=>c.previous[k]).map(bet=>({bet,amount:c.previous[bet]}))};}
export function begin(g:Game):Game {if(g.phase!=='betting'||!total(g.bets))return g;if(needShoe(g.shoe))g={...g,shoe:newShoe()};return {...g,phase:'closing',roundId:crypto.randomUUID(),current:null,player:[],banker:[],visible:0,revealed:[],handStage:'initial'};}
export function advance(g:Game):Game {
 if(g.phase==='closing'){const shoe={...g.shoe};const player=[drawCard(shoe)],banker=[drawCard(shoe)];player.push(drawCard(shoe));banker.push(drawCard(shoe));return {...g,shoe,player,banker,phase:'dealing'};}
 if(g.phase==='dealing')return {...g,visible:Math.min(4,g.visible+1),phase:g.visible>=3?'squeezing':'dealing'};
 if(g.phase==='drawing')return {...g,visible:ordered(g).length,phase:'squeezing'};
 if(g.phase==='squeezing'&&ordered(g).every(c=>g.revealed.includes(c.id))){
  const shoe={...g.shoe};const player=[...g.player],banker=[...g.banker];
  if(g.handStage==='initial'&&!isNatural(player,banker)&&points(player)<=5){player.push(drawCard(shoe));return {...g,shoe,player,phase:'drawing',handStage:'player'};}
  if(g.handStage!=='banker'&&g.handStage!=='done'&&!isNatural(player.slice(0,2),banker)&&bankerDraw(points(banker),player[2]?value(player[2]):null)){banker.push(drawCard(shoe));return {...g,shoe,banker,phase:'drawing',handStage:'banker'};}
  const r=result(player,banker),s=settle(g.bets,r,g.mode);return {...g,phase:'result',handStage:'done',current:{...r,...s,id:g.roundId,shoeId:g.shoe.id,time:Date.now(),mode:g.mode,bets:{...g.bets}}};
 }
 if(g.phase==='result')return {...g,phase:'settling'};
 if(g.phase==='settling'&&g.current){if(g.history.some(h=>h.id===g.current!.id))return {...g,phase:'complete'};return {...g,phase:'complete',balance:g.balance+g.current.paid,previous:{...g.bets},history:[...g.history,g.current]};}
 return g;
}
export function reveal(g:Game,id:string):Game {if(g.phase!=='squeezing'||!ordered(g).some(c=>c.id===id)||g.revealed.includes(id))return g;return {...g,revealed:[...g.revealed,id]};}
export function next(g:Game):Game {if(g.phase!=='complete')return g;return {...g,phase:'betting',bets:emptyBets(),undo:[],current:null,player:[],banker:[],revealed:[],visible:0};}
export function changeShoe(g:Game):Game {if(g.phase!=='betting')return g;return {...clear(g),shoe:newShoe()};}
