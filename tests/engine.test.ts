import {describe,it,expect} from 'vitest';
import * as E from '../src/game/engine';
import {squeezeStep} from '../src/cards/squeeze';
function finish(g:E.Game){for(let n=0;n<30&&g.phase!=='complete';n++){if(g.phase==='squeezing')for(const c of E.ordered(g))g=E.reveal(g,c.id);g=E.advance(g);}return g;}
describe('state machine',()=>{
 it('no empty deal, repeat click cannot draw extra cards, bets lock',()=>{let g=E.initial();expect(E.begin(g)).toBe(g);g=E.place(g,'B',10000);g=E.begin(g);expect(E.begin(g)).toBe(g);expect(E.place(g,'P',10000)).toBe(g);g=E.advance(g);expect(g.shoe.cursor).toBe(12);expect(E.begin(g)).toBe(g);});
 it('unrevealed cards cannot settle, third draw is automatic',()=>{let g=E.begin(E.place(E.initial(),'B',10000));g=E.advance(g);for(let i=0;i<4;i++)g=E.advance(g);expect(g.phase).toBe('squeezing');expect(E.advance(g)).toBe(g);const done=finish(g);expect(done.phase).toBe('complete');expect(done.history).toHaveLength(1);});
 it('settlement exactly once, balance and refund conserve chips',()=>{const g=E.place(E.initial(),'P',10000),done=finish(E.begin(g));expect(done.balance).toBe(10000000-10000+done.current!.paid);expect(E.advance(done)).toBe(done);expect(E.next(done).balance).toBe(done.balance);});
 it('undo, clear, repeat previous work',()=>{let g=E.place(E.place(E.initial(),'P',10000),'PP',1000);g=E.undo(g);expect(g.bets.PP).toBe(0);expect(E.clear(g).balance).toBe(10000000);g=E.next(finish(E.begin(g)));g=E.repeat(g);expect(g.bets.P).toBe(10000);});
 it('new shoe preserves historical archive and resets current road identity',()=>{let g=E.next(finish(E.begin(E.place(E.initial(),'P',10000))));const id=g.shoe.id;g=E.changeShoe(g);expect(g.shoe.id).not.toBe(id);expect(g.history).toHaveLength(1);expect(g.history.filter(h=>h.shoeId===g.shoe.id)).toHaveLength(0);});
 it('serialized in-flight game resumes same cards and one settlement',()=>{let g=E.begin(E.place(E.initial(),'B',1000));g=E.advance(g);const clone=JSON.parse(JSON.stringify(g));const a=finish(g),b=finish(clone);expect(a.player).toEqual(b.player);expect(a.banker).toEqual(b.banker);expect(a.balance).toBe(b.balance);expect(b.history).toHaveLength(1);});
 it('1000 sequential rounds never repeat a physical card within a shoe',()=>{let g=E.initial();const used=new Map<string,Set<string>>();for(let i=0;i<1000;i++){g=finish(E.begin(E.place(g,'B',1000)));expect(g.phase).toBe('complete');const id=g.shoe.id,set=used.get(id)??new Set<string>();for(const c of E.ordered(g)){expect(set.has(c.id)).toBe(false);set.add(c.id);}used.set(id,set);g=E.next(g);}expect(g.history).toHaveLength(1000);});
});
describe('squeeze cancellation',()=>{
 const init={active:false,progress:0,revealed:false};
 it('cancel / pointer interruption returns to concealed',()=>{let s=squeezeStep(init,'start');s=squeezeStep(s,'drag',.4);expect(s.progress).toBe(.4);expect(squeezeStep(s,'cancel')).toEqual(init);});
 it('release partial springs back, full reveal stays',()=>{let s=squeezeStep(init,'start');s=squeezeStep(s,'drag',.8);expect(squeezeStep(s,'release')).toEqual(init);s=squeezeStep(s,'drag',1);expect(s.revealed).toBe(true);expect(squeezeStep(s,'release').revealed).toBe(true);});
 it('inactive movement cannot expose cards',()=>expect(squeezeStep(init,'drag',1)).toEqual(init));
});
