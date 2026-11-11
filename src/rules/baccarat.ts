export type Side = 'P' | 'B' | 'T';
export type Mode = 'commission' | 'super6' | 'dragon';
export const BET_KEYS = ['P','B','T','PP','BP','D7','L6','L7','S6','B6','S7','B7','SL7'] as const;
export type Bet = typeof BET_KEYS[number];
export const LUCKY_KEYS:Bet[]=['L6','L7','S6','B6','S7','B7','SL7'];
export type Bets = Record<Bet, number>;
export const emptyBets = (): Bets => Object.fromEntries(BET_KEYS.map(k=>[k,0])) as Bets;
export type Card = {id:string;rank:number;suit:number};
export const value = (c:Card) => c.rank < 10 ? c.rank : 0;
export const points = (cards:Card[]) => cards.reduce((a,c)=>a+value(c),0)%10;
export const isNatural = (p:Card[],b:Card[])=>points(p)>=8||points(b)>=8;
export function bankerDraw(b:number, third:number|null):boolean {
 if(b>=7)return false;
 if(third===null)return b<=5;
 if(b<=2)return true;
 if(b===3)return third!==8;
 if(b===4)return third>=2&&third<=7;
 if(b===5)return third>=4&&third<=7;
 return third===6||third===7;
}
export type Result = {player:Card[];banker:Card[];p:number;b:number;winner:Side;pp:boolean;bp:boolean;dragon:boolean;natural:boolean};
export function result(player:Card[],banker:Card[]):Result {
 const p=points(player),b=points(banker),winner=p===b?'T':p>b?'P':'B';
 return {player:[...player],banker:[...banker],p,b,winner,pp:player[0].rank===player[1].rank,bp:banker[0].rank===banker[1].rank,dragon:winner==='B'&&banker.length===3&&b===7,natural:isNatural(player.slice(0,2),banker.slice(0,2))};
}
// All amounts are integer hundredths of one virtual chip. Returns INCLUDE stake.
export function settle(bets:Bets,r:Result,mode:Mode,table:LuckyTable=DEFAULT_LUCKY_TABLE) {
 const returns=emptyBets();
 for(const key of Object.keys(bets) as Bet[]) {
  const n=bets[key]; if(!BET_KEYS.includes(key))throw new Error('未知投注项目'); if(!Number.isSafeInteger(n)||n<0)throw new Error('下注须为非负整数分');
  if(key==='PP'&&r.pp||key==='BP'&&r.bp) returns[key]=n*12;
  if(key==='D7'&&r.dragon)returns[key]=n*41;
  const odds=luckyOdds(key,r,table);if(odds!==null)returns[key]=n*(odds+1);
  if(key==='T'&&r.winner==='T')returns[key]=n*9;
  if((key==='P'||key==='B')&&r.winner==='T')returns[key]=n;
  if(key==='P'&&r.winner==='P')returns[key]=n*2;
  if(key==='B'&&r.winner==='B')returns[key]=mode==='commission'?n+Number(BigInt(n)*95n/100n):mode==='super6'&&r.b===6?n+Number(BigInt(n)/2n):mode==='dragon'&&r.dragon?n:n*2;
 }
 const stake=Object.values(bets).reduce((a,b)=>a+b,0),paid=Object.values(returns).reduce((a,b)=>a+b,0);
 if(![stake,paid,paid-stake,...Object.values(returns)].every(Number.isSafeInteger))throw new Error('金额超出安全整数范围');
 return {returns,stake,paid,net:paid-stake};
}
export function play(draw:()=>Card):Result {
 const player=[draw()],banker=[draw()];player.push(draw());banker.push(draw());
 if(!isNatural(player,banker)) { if(points(player)<=5)player.push(draw());if(bankerDraw(points(banker),player[2]?value(player[2]):null))banker.push(draw()); }
 return result(player,banker);
}

export type LuckyTable={L6:{two:number;three:number};L7:{two:number;three:number};S6:number;B6:number;S7:number;B7:number;SL7:{four:number;five:number;six:number}};
export const DEFAULT_LUCKY_TABLE:LuckyTable={L6:{two:12,three:20},L7:{two:6,three:15},S6:22,B6:50,S7:15,B7:30,SL7:{four:30,five:40,six:100}};
export function luckyOdds(key:Bet,r:Result,t:LuckyTable=DEFAULT_LUCKY_TABLE):number|null {
 const six=r.winner==='B'&&r.b===6,seven=r.winner==='P'&&r.p===7;
 let odds:number|null=null;
 if(key==='L6'&&six)odds=r.banker.length===2?t.L6.two:t.L6.three;
 if(key==='L7'&&seven)odds=r.player.length===2?t.L7.two:t.L7.three;
 if(key==='S6'&&six&&r.banker.length===2)odds=t.S6;
 if(key==='B6'&&six&&r.banker.length===3)odds=t.B6;
 if(key==='S7'&&seven&&r.player.length===2)odds=t.S7;
 if(key==='B7'&&seven&&r.player.length===3)odds=t.B7;
 if(key==='SL7'&&seven&&r.b===6){const count=r.player.length+r.banker.length;odds=count===4?t.SL7.four:count===5?t.SL7.five:t.SL7.six;}
 if(odds!==null&&(!Number.isSafeInteger(odds)||odds<0||odds>10000))throw new Error('无效赔率');return odds;
}
