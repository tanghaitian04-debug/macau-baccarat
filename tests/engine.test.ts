import {describe,it,expect} from 'vitest';
import * as E from '../src/game/engine';
import {squeezeStep} from '../src/cards/squeeze';
import {foldDirection} from '../src/cards/CardMesh';

function ready(g=E.initial()) {for(let n=0;n<6&&g.phase==='predeal';n++)g=E.advance(g);expect(g.phase).toBe('betting');return g;}
function finish(g:E.Game,side:'B'|'P'|'T'='B'){
 for(let n=0;n<35&&g.phase!=='complete';n++){
  if(g.phase==='predeal'){g=E.advance(g);continue;}
  if(g.phase==='betting'){g=E.begin(E.place(g,side,1000));continue;}
  if(g.phase==='awaitOpponent'){g=E.openOpponent(g);continue;}
  if(g.phase==='awaitSqueeze'){g=E.startSqueeze(g);continue;}
  if(g.phase==='squeezing')for(const c of E.squeezeCards(g))g=E.reveal(g,c.id);
  g=E.advance(g);
 }
 return g;
}

describe('pre-deal and side-locked reveal game flow',()=>{
 it('deals four face-down cards in P B P B order before betting',()=>{
  let g=E.initial();expect(g.phase).toBe('predeal');const cursor=g.shoe.cursor;
  g=E.advance(g);expect(g.visible).toBe(1);expect(g.shoe.cursor).toBe(cursor+4);
  expect(E.ordered(g).map(c=>c.id)).toEqual([g.player[0].id,g.banker[0].id,g.player[1].id,g.banker[1].id]);
  g=ready(g);expect(g.visible).toBe(4);expect(g.revealed).toEqual([]);
  expect(E.begin(g)).toBe(g);
 });
 it('one principal side at a time; other side is opened on the table first',()=>{
  let g=ready();g=E.place(g,'B',1000);expect(E.place(g,'P',1000)).toBe(g);
  g=E.advance(E.begin(g));expect(g.phase).toBe('awaitOpponent');expect(g.revealed).toHaveLength(0);
  g=E.openOpponent(g);expect(g.phase).toBe('awaitSqueeze');expect(g.revealed).toEqual(g.player.map(c=>c.id));
  expect(E.reveal(g,g.banker[0].id)).toBe(g);
  g=E.startSqueeze(g);expect(E.reveal(g,g.player[0].id)).toBe(g);
  expect(E.squeezeCards(g)).toEqual(g.banker);
  g=E.reveal(g,g.banker[0].id);expect(g.revealed).toHaveLength(3);
 });
 it('player-main bet opens banker cards and can only squeeze player',()=>{
  let g=E.advance(E.begin(E.place(ready(),'P',1000)));g=E.openOpponent(g);
  expect(g.revealed).toEqual(g.banker.map(c=>c.id));g=E.startSqueeze(g);
  expect(E.squeezeCards(g)).toEqual(g.player);
  expect(E.reveal(g,g.banker[0].id)).toBe(g);
 });
 it('side-only bet has no squeeze choice and immediately shows both hands',()=>{
  let g=E.advance(E.begin(E.place(ready(),'PP',1000)));g=E.openOpponent(g);
  expect(g.phase).toBe('squeezing');expect(g.revealed).toHaveLength(4);
  expect(E.squeezeCards(g)).toEqual([]);
 });
 it('skip squeeze only reveals the chosen side',()=>{
  let g=E.advance(E.begin(E.place(ready(),'B',1000)));g=E.openOpponent(g);
  const after=E.skipSqueeze(g);expect(after.phase).toBe('squeezing');expect(after.revealed).toHaveLength(4);
 });
 it('refresh while cards are face-down preserves physical cards and chips',()=>{
  const g=E.place(ready(),'B',1000),clone=E.migrate(JSON.parse(JSON.stringify(g)));
  expect(clone.player).toEqual(g.player);expect(clone.banker).toEqual(g.banker);expect(clone.balance).toBe(g.balance);
 });
 it('keeps stake, winnings, history and next-round predeal consistent',()=>{
  let g=finish(E.place(ready(),'B',1000));expect(g.phase).toBe('complete');expect(g.history).toHaveLength(1);
  expect(g.balance).toBe(10000000-1000+g.current!.paid);
  expect(E.advance(g)).toBe(g);g=E.next(g);expect(g.phase).toBe('predeal');
  expect(g.player).toHaveLength(0);expect(ready(g).revealed).toHaveLength(0);
 });
 it('undo, clear, repeat and change shoe still work',()=>{
  let g=E.place(E.place(ready(),'P',10000),'PP',1000);g=E.undo(g);expect(g.bets.PP).toBe(0);
  expect(E.clear(g).balance).toBe(10000000);
  const done=finish(g,'P');g=ready(E.next(done));g=E.repeat(g);expect(g.bets.P).toBe(10000);
  const previous=g.shoe.id;g=E.changeShoe(g);expect(g.phase).toBe('predeal');expect(g.shoe.id).not.toBe(previous);expect(g.history).toHaveLength(1);
 });
 it('1000 rounds have no duplicate physical card in same shoe',()=>{
  let g=E.initial();const seen=new Map<string,Set<string>>();for(let n=0;n<1000;n++){
   g=finish(g);expect(g.phase).toBe('complete');const cards=seen.get(g.shoe.id)??new Set<string>();for(const c of E.ordered(g)){expect(cards.has(c.id)).toBe(false);cards.add(c.id);}seen.set(g.shoe.id,cards);g=E.next(g);
  }expect(g.history).toHaveLength(1000);
 });
 it('legacy in-flight v1 state refunds unsettled stake and keeps completed history',()=>{
  const g=E.place(ready(),'B',1000),old={...g,version:1,phase:'dealing'};
  const saved=E.migrate(old);expect(saved.phase).toBe('predeal');expect(saved.balance).toBe(10000000);
  const complete=finish(g),restored=E.migrate({...complete,version:1});expect(restored.balance).toBe(complete.balance);expect(restored.history).toHaveLength(1);
 });
});
describe('four-direction squeeze gestures',()=>{
 const init={active:false,progress:0,revealed:false};
 it('maps each swipe to the opposite folding edge',()=>{
  expect(foldDirection(0,-100)).toMatchObject({direction:'up',axis:1,sign:1});
  expect(foldDirection(0,100)).toMatchObject({direction:'down',axis:1,sign:-1});
  expect(foldDirection(-100,0)).toMatchObject({direction:'left',axis:0,sign:1});
  expect(foldDirection(100,0)).toMatchObject({direction:'right',axis:0,sign:-1});
 });
 it('cancel resets progress and revealed false',()=>{let s=squeezeStep(init,'start');s=squeezeStep(s,'drag',.4);expect(squeezeStep(s,'cancel')).toEqual(init);});
 it('partial release springs back, full drag reveals',()=>{let s=squeezeStep(init,'start');s=squeezeStep(s,'drag',.8);expect(squeezeStep(s,'release')).toEqual(init);s=squeezeStep(s,'start');s=squeezeStep(s,'drag',1);expect(s.revealed).toBe(true);});
});