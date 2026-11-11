import {type Bets,type Bet,type Mode,type Result,type Card,emptyBets,isNatural,points,bankerDraw,value,result,settle,LUCKY_KEYS,BET_KEYS} from '../rules/baccarat';
import {type Shoe,newShoe,drawCard,needShoe} from '../rules/shoe';
export type Phase='predeal'|'betting'|'closing'|'awaitOpponent'|'revealingOpponent'|'awaitSqueeze'|'squeezing'|'checking'|'drawing'|'revealingThird'|'result'|'settling'|'complete';
export type RecordRound=Result&{id:string;shoeId:string;time:number;mode:Mode;bets:Bets;net:number;paid:number;returns:Bets};
export type Game={version:3;shoe:Shoe;balance:number;bets:Bets;previous:Bets;undo:{bet:Bet;amount:number}[];phase:Phase;player:Card[];banker:Card[];visible:number;revealed:string[];history:RecordRound[];current:RecordRound|null;mode:Mode;roundId:string;handStage:'initial'|'player'|'banker'|'done';luckyFirst50:boolean;flipQueue:string[];flipIndex:number};
export const initial=():Game=>({version:3,shoe:newShoe(),balance:10000000,bets:emptyBets(),previous:emptyBets(),undo:[],phase:'predeal',player:[],banker:[],visible:0,revealed:[],history:[],current:null,mode:'commission',roundId:'',handStage:'initial',luckyFirst50:false,flipQueue:[],flipIndex:0});
export const total=(bets:Bets)=>Object.values(bets).reduce((a,b)=>a+b,0);
export const ordered=(g:Game)=>[g.player[0],g.banker[0],g.player[1],g.banker[1],g.player[2],g.banker[2]].filter(Boolean);
export const primarySide=(g:Game):'P'|'B'|null=>g.bets.B>0?'B':g.bets.P>0?'P':null;
export const oppositeSide=(side:'P'|'B')=>side==='P'?'B':'P';
export const shoeRounds=(g:Game)=>g.history.filter(h=>h.shoeId===g.shoe.id).length;
export const luckyAllowed=(g:Game)=>!g.luckyFirst50||shoeRounds(g)<50;
export const canBet=(g:Game,bet:Bet)=>g.phase==='betting'&&BET_KEYS.includes(bet)&&(!LUCKY_KEYS.includes(bet)||luckyAllowed(g))&&!(bet==='P'&&g.bets.B>0||bet==='B'&&g.bets.P>0);
export const squeezeCards=(g:Game)=>{const side=primarySide(g);const cards=side==='P'?g.player:side==='B'?g.banker:[];return cards.filter(c=>ordered(g).slice(0,g.visible).some(a=>a.id===c.id)&&!g.revealed.includes(c.id));};
export function place(g:Game,bet:Bet,amount:number):Game {if(!canBet(g,bet)||amount>g.balance||amount<=0||!Number.isSafeInteger(amount)||amount%1000||!Number.isSafeInteger(g.bets[bet]+amount))return g;return {...g,balance:g.balance-amount,bets:{...g.bets,[bet]:g.bets[bet]+amount},undo:[...g.undo,{bet,amount}]};}
export function undo(g:Game):Game {if(g.phase!=='betting'||!g.undo.length)return g;const a=g.undo.at(-1)!;return {...g,balance:g.balance+a.amount,bets:{...g.bets,[a.bet]:g.bets[a.bet]-a.amount},undo:g.undo.slice(0,-1)};}
export function clear(g:Game):Game {if(g.phase!=='betting')return g;return {...g,balance:g.balance+total(g.bets),bets:emptyBets(),undo:[]};}
export function repeat(g:Game):Game {if(g.phase!=='betting')return g;const c=clear(g);if(total(c.previous)>c.balance||c.previous.P>0&&c.previous.B>0||!luckyAllowed(c)&&LUCKY_KEYS.some(k=>c.previous[k]>0))return g;return {...c,balance:c.balance-total(c.previous),bets:{...c.previous},undo:BET_KEYS.filter(k=>c.previous[k]).map(bet=>({bet,amount:c.previous[bet]}))};}
export function setLuckyLimit(g:Game,enabled:boolean):Game {if(g.phase!=='betting'&&g.phase!=='predeal')return g;let updated={...g,luckyFirst50:enabled};if(!luckyAllowed(updated)){const refund=LUCKY_KEYS.reduce((a,k)=>a+g.bets[k],0),bets={...g.bets};LUCKY_KEYS.forEach(k=>bets[k]=0);updated={...updated,balance:g.balance+refund,bets,undo:g.undo.filter(a=>!LUCKY_KEYS.includes(a.bet))};}return updated;}
export function begin(g:Game):Game {if(g.phase!=='betting'||!total(g.bets)||g.visible!==4)return g;return {...g,phase:'closing',roundId:crypto.randomUUID(),current:null,handStage:'initial'};}
function flip(g:Game,ids:string[],phase:'revealingOpponent'|'revealingThird'):Game {return {...g,phase,flipQueue:ids,flipIndex:0,revealed:[...new Set([...g.revealed,...ids.slice(0,1)])]};}
export function openOpponent(g:Game):Game {if(g.phase!=='awaitOpponent')return g;const side=primarySide(g),cards=side?(side==='B'?g.player:g.banker).slice(0,2):ordered(g).slice(0,4);return flip(g,cards.map(c=>c.id),'revealingOpponent');}
export function startSqueeze(g:Game):Game {return g.phase==='awaitSqueeze'&&primarySide(g)?{...g,phase:'squeezing'}:g;}
export function skipSqueeze(g:Game):Game {if(g.phase!=='squeezing'&&g.phase!=='awaitSqueeze')return g;return {...g,phase:'squeezing',revealed:[...new Set([...g.revealed,...squeezeCards(g).map(c=>c.id)])]};}
export function advance(g:Game):Game {
 if(g.phase==='predeal'){
  if(!g.player.length){const shoe=needShoe(g.shoe)?newShoe():{...g.shoe};const player=[drawCard(shoe)],banker=[drawCard(shoe)];player.push(drawCard(shoe));banker.push(drawCard(shoe));return {...g,shoe,player,banker,visible:1,revealed:[],phase:'predeal'};}
  if(g.visible<4)return {...g,visible:g.visible+1};return {...g,phase:'betting'};
 }
 if(g.phase==='closing')return {...g,phase:'awaitOpponent'};
 if(g.phase==='revealingOpponent') {const i=g.flipIndex+1;if(i<g.flipQueue.length)return {...g,flipIndex:i,revealed:[...new Set([...g.revealed,g.flipQueue[i]])]};return {...g,flipQueue:[],phase:primarySide(g)?'awaitSqueeze':'checking'};}
 if(g.phase==='drawing') {const shown=ordered(g),card=shown.at(-1)!,side=primarySide(g),own=side&&(side==='P'?g.player:g.banker).some(c=>c.id===card.id);const updated={...g,visible:shown.length};return own?{...updated,phase:'awaitSqueeze'}:flip(updated,[card.id],'revealingThird');}
 if(g.phase==='revealingThird')return {...g,phase:'checking',flipQueue:[]};
 if(g.phase==='squeezing'&&ordered(g).slice(0,g.visible).every(c=>g.revealed.includes(c.id)))return {...g,phase:'checking'};
 if(g.phase==='checking'){
  if(!ordered(g).every(c=>g.revealed.includes(c.id)))return g;
  const shoe={...g.shoe},player=[...g.player],banker=[...g.banker];
  if(g.handStage==='initial'&&!isNatural(player,banker)&&points(player)<=5){player.push(drawCard(shoe));return {...g,shoe,player,phase:'drawing',handStage:'player'};}
  if(g.handStage!=='banker'&&g.handStage!=='done'&&!isNatural(player.slice(0,2),banker.slice(0,2))&&bankerDraw(points(banker),player[2]?value(player[2]):null)){banker.push(drawCard(shoe));return {...g,shoe,banker,phase:'drawing',handStage:'banker'};}
  const r=result(player,banker),s=settle(g.bets,r,g.mode);return {...g,phase:'result',handStage:'done',current:{...r,...s,id:g.roundId,shoeId:g.shoe.id,time:Date.now(),mode:g.mode,bets:{...g.bets}}};
 }
 if(g.phase==='result')return {...g,phase:'settling'};
 if(g.phase==='settling'&&g.current){if(g.history.some(h=>h.id===g.current!.id))return {...g,phase:'complete'};return {...g,phase:'complete',balance:g.balance+g.current.paid,previous:{...g.bets},history:[...g.history,g.current]};}return g;
}
export function reveal(g:Game,id:string):Game {if(g.phase!=='squeezing'||g.revealed.includes(id)||!squeezeCards(g).some(c=>c.id===id))return g;return {...g,revealed:[...g.revealed,id]};}
export function next(g:Game):Game {if(g.phase!=='complete')return g;return {...g,phase:'predeal',bets:emptyBets(),undo:[],current:null,player:[],banker:[],revealed:[],visible:0,handStage:'initial',flipQueue:[],flipIndex:0};}
export function changeShoe(g:Game):Game {if(g.phase!=='betting')return g;return {...clear(g),shoe:newShoe(),phase:'predeal',player:[],banker:[],visible:0,revealed:[],handStage:'initial',flipQueue:[],flipIndex:0};}
function normalizedBets(value:Partial<Bets>|undefined):Bets {return {...emptyBets(),...value};}
export function migrate(old:unknown):Game {
 if(!old||typeof old!=='object')return initial();const state=old as Omit<Partial<Game>,'version'>&{version?:number};
 if(state.version===3)return state as Game;
 if((state.version!==1&&state.version!==2)||!state.shoe||!state.history||!state.bets)return initial();
 const bets=normalizedBets(state.bets),previous=normalizedBets(state.previous),history=state.history.map(h=>({...h,bets:normalizedBets(h.bets),returns:normalizedBets(h.returns)}));
 if(state.version===2){const g={...initial(),...state,version:3 as const,bets,previous,history,flipQueue:[],flipIndex:0};return g;}
 const settled=state.phase==='complete'||state.phase==='settling'&&state.current&&state.history.some(r=>r.id===state.current!.id);
 return {...initial(),shoe:state.shoe,balance:(state.balance??10000000)+(settled?0:total(bets)),history,previous,mode:state.mode??'commission'};
}
