import {type Bets,type Mode,type Result,type Card,emptyBets,isNatural,points,bankerDraw,value,result,settle} from '../rules/baccarat';
import {type Shoe,newShoe,drawCard,needShoe} from '../rules/shoe';

export type Phase='predeal'|'betting'|'closing'|'awaitOpponent'|'awaitSqueeze'|'squeezing'|'drawing'|'result'|'settling'|'complete';
export type RecordRound=Result&{id:string;shoeId:string;time:number;mode:Mode;bets:Bets;net:number;paid:number;returns:Bets};
export type Game={version:2;shoe:Shoe;balance:number;bets:Bets;previous:Bets;undo:{bet:keyof Bets;amount:number}[];phase:Phase;player:Card[];banker:Card[];visible:number;revealed:string[];history:RecordRound[];current:RecordRound|null;mode:Mode;roundId:string;handStage:'initial'|'player'|'banker'|'done'};
export const initial=():Game=>({version:2,shoe:newShoe(),balance:10000000,bets:emptyBets(),previous:emptyBets(),undo:[],phase:'predeal',player:[],banker:[],visible:0,revealed:[],history:[],current:null,mode:'commission',roundId:'',handStage:'initial'});
export const total=(bets:Bets)=>Object.values(bets).reduce((a,b)=>a+b,0);
export const ordered=(g:Game)=>[g.player[0],g.banker[0],g.player[1],g.banker[1],g.player[2],g.banker[2]].filter(Boolean);
export const primarySide=(g:Game):'P'|'B'|null=>g.bets.B>0?'B':g.bets.P>0?'P':null;
export const oppositeSide=(side:'P'|'B')=>side==='P'?'B':'P';
export const squeezeCards=(g:Game)=>{const side=primarySide(g);const cards=side==='P'?g.player:side==='B'?g.banker:[];return cards.filter(c=>ordered(g).slice(0,g.visible).some(a=>a.id===c.id)&&!g.revealed.includes(c.id));};
export function place(g:Game,bet:keyof Bets,amount:number):Game {
 if(g.phase!=='betting'||amount>g.balance||amount<=0||!Number.isSafeInteger(amount)||amount%1000)return g;
 // A player chooses one main side to squeeze. Side bets can accompany either main bet.
 if(bet==='P'&&g.bets.B>0||bet==='B'&&g.bets.P>0)return g;
 return {...g,balance:g.balance-amount,bets:{...g.bets,[bet]:g.bets[bet]+amount},undo:[...g.undo,{bet,amount}]};
}
export function undo(g:Game):Game {if(g.phase!=='betting'||!g.undo.length)return g;const a=g.undo.at(-1)!;return {...g,balance:g.balance+a.amount,bets:{...g.bets,[a.bet]:g.bets[a.bet]-a.amount},undo:g.undo.slice(0,-1)};}
export function clear(g:Game):Game {if(g.phase!=='betting')return g;return {...g,balance:g.balance+total(g.bets),bets:emptyBets(),undo:[]};}
export function repeat(g:Game):Game {if(g.phase!=='betting')return g;const c=clear(g);if(total(c.previous)>c.balance||c.previous.P>0&&c.previous.B>0)return g;return {...c,balance:c.balance-total(c.previous),bets:{...c.previous},undo:(Object.keys(c.previous) as (keyof Bets)[]).filter(k=>c.previous[k]).map(bet=>({bet,amount:c.previous[bet]}))};}
export function begin(g:Game):Game {if(g.phase!=='betting'||!total(g.bets)||g.visible!==4)return g;return {...g,phase:'closing',roundId:crypto.randomUUID(),current:null,handStage:'initial'};}
export function openOpponent(g:Game):Game {
 if(g.phase!=='awaitOpponent')return g;
 const side=primarySide(g);
 if(!side)return {...g,revealed:ordered(g).slice(0,4).map(c=>c.id),phase:'squeezing'};
 const other=oppositeSide(side),cards=(other==='P'?g.player:g.banker).slice(0,2);
 return {...g,revealed:[...new Set([...g.revealed,...cards.map(c=>c.id)])],phase:'awaitSqueeze'};
}
export function startSqueeze(g:Game):Game {if(g.phase!=='awaitSqueeze')return g;return {...g,phase:'squeezing'};}
export function skipSqueeze(g:Game):Game {
 if(g.phase!=='squeezing'&&g.phase!=='awaitSqueeze')return g;
 const pending=squeezeCards(g);
 return {...g,phase:'squeezing',revealed:[...new Set([...g.revealed,...pending.map(c=>c.id)])]};
}
export function advance(g:Game):Game {
 if(g.phase==='predeal'){
  if(!g.player.length){const shoe=needShoe(g.shoe)?newShoe():{...g.shoe};const player=[drawCard(shoe)],banker=[drawCard(shoe)];player.push(drawCard(shoe));banker.push(drawCard(shoe));return {...g,shoe,player,banker,visible:1,revealed:[],phase:'predeal'};}
  return {...g,visible:Math.min(4,g.visible+1),phase:g.visible>=3?'betting':'predeal'};
 }
 if(g.phase==='closing')return {...g,phase:'awaitOpponent'};
 if(g.phase==='drawing'){
  const shown=ordered(g).slice(0,ordered(g).length);
  const side=primarySide(g);
  const revealOther=shown.filter(c=>!g.revealed.includes(c.id)&&(side===null||!(side==='P'?g.player:g.banker).some(a=>a.id===c.id))).map(c=>c.id);
  return {...g,visible:shown.length,revealed:[...new Set([...g.revealed,...revealOther])],phase:'squeezing'};
 }
 if(g.phase==='squeezing'&&ordered(g).slice(0,g.visible).every(c=>g.revealed.includes(c.id))){
  const shoe={...g.shoe};const player=[...g.player],banker=[...g.banker];
  if(g.handStage==='initial'&&!isNatural(player,banker)&&points(player)<=5){player.push(drawCard(shoe));return {...g,shoe,player,phase:'drawing',handStage:'player'};}
  if(g.handStage!=='banker'&&g.handStage!=='done'&&!isNatural(player.slice(0,2),banker.slice(0,2))&&bankerDraw(points(banker),player[2]?value(player[2]):null)){banker.push(drawCard(shoe));return {...g,shoe,banker,phase:'drawing',handStage:'banker'};}
  const r=result(player,banker),s=settle(g.bets,r,g.mode);
  return {...g,phase:'result',handStage:'done',current:{...r,...s,id:g.roundId,shoeId:g.shoe.id,time:Date.now(),mode:g.mode,bets:{...g.bets}}};
 }
 if(g.phase==='result')return {...g,phase:'settling'};
 if(g.phase==='settling'&&g.current){if(g.history.some(h=>h.id===g.current!.id))return {...g,phase:'complete'};return {...g,phase:'complete',balance:g.balance+g.current.paid,previous:{...g.bets},history:[...g.history,g.current]};}
 return g;
}
export function reveal(g:Game,id:string):Game {
 if(g.phase!=='squeezing'||g.revealed.includes(id)||!squeezeCards(g).some(c=>c.id===id))return g;
 return {...g,revealed:[...g.revealed,id]};
}
export function next(g:Game):Game {if(g.phase!=='complete')return g;return {...g,phase:'predeal',bets:emptyBets(),undo:[],current:null,player:[],banker:[],revealed:[],visible:0,handStage:'initial'};}
export function changeShoe(g:Game):Game {if(g.phase!=='betting')return g;const c=clear(g);return {...c,shoe:newShoe(),phase:'predeal',player:[],banker:[],visible:0,revealed:[]};}
/** Safely migrate local v1 sessions: preserve balance/history and refund any unsettled stake. */
export function migrate(old:unknown):Game {
 if(!old||typeof old!=='object')return initial();
 const state=old as Omit<Partial<Game>,'version'> & {version?:number};
 if(state.version===2)return state as Game;
 if(state.version!==1||!state.shoe||!state.history||!state.bets)return initial();
 const settled=state.phase==='complete'||state.phase==='settling'&&state.current&&state.history.some(r=>r.id===state.current!.id);
 const oldBalance=state.balance??10000000;
 const refund=settled?0:total(state.bets);
 const base=initial();
 return {...base,shoe:state.shoe,balance:oldBalance+refund,history:state.history,previous:state.previous??emptyBets(),mode:state.mode??'commission'};
}