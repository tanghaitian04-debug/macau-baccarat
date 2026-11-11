export type Side = 'P' | 'B' | 'T';
export type Mode = 'commission' | 'super6' | 'dragon';
export type Bet = 'P' | 'B' | 'T' | 'PP' | 'BP' | 'D7';
export type Bets = Record<Bet, number>;
export const emptyBets = (): Bets => ({P:0,B:0,T:0,PP:0,BP:0,D7:0});
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
export function settle(bets:Bets,r:Result,mode:Mode) {
 const returns=emptyBets();
 for(const key of Object.keys(bets) as Bet[]) {
  const n=bets[key]; if(!Number.isSafeInteger(n)||n<0||n%1000!==0)throw new Error('下注须为10筹码的整数倍');
  if(key==='PP'&&r.pp||key==='BP'&&r.bp) returns[key]=n*12;
  if(key==='D7'&&r.dragon)returns[key]=n*41;
  if(key==='T'&&r.winner==='T')returns[key]=n*9;
  if((key==='P'||key==='B')&&r.winner==='T')returns[key]=n;
  if(key==='P'&&r.winner==='P')returns[key]=n*2;
  if(key==='B'&&r.winner==='B')returns[key]=mode==='commission'?n*195/100:mode==='super6'&&r.b===6?n*3/2:mode==='dragon'&&r.dragon?n:n*2;
 }
 const stake=Object.values(bets).reduce((a,b)=>a+b,0),paid=Object.values(returns).reduce((a,b)=>a+b,0);
 return {returns,stake,paid,net:paid-stake};
}
export function play(draw:()=>Card):Result {
 const player=[draw()],banker=[draw()];player.push(draw());banker.push(draw());
 if(!isNatural(player,banker)) { if(points(player)<=5)player.push(draw());if(bankerDraw(points(banker),player[2]?value(player[2]):null))banker.push(draw()); }
 return result(player,banker);
}
