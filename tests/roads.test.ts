import {describe,it,expect} from 'vitest';
import {bigRoad,derivedColors,derivedRoad,type RoadRound} from '../src/roads/roads';
const rounds=(s:string):RoadRound[]=>[...s].map(winner=>({winner:winner as RoadRound['winner'],pp:false,bp:false}));
describe('six-row baccarat roads',()=>{
 it('new columns, ties overlay, leading ties',()=>{const r=bigRoad(rounds('TTBBTPPPBT'));expect(r.cells.map(c=>[c.x,c.y,c.ties])).toEqual([[0,0,2],[0,1,1],[1,0,0],[1,1,0],[1,2,0],[2,0,1]]);expect(bigRoad(rounds('TT')).leading).toBe(2);});
 it('dragon tail extends beyond six, never overlaps',()=>{const r=bigRoad(rounds('BBBBBBBBPPPPPPPPBBBBBBBB'));expect(r.cells.slice(0,8).map(c=>[c.x,c.y])).toEqual([[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[1,5],[2,5]]);expect(new Set(r.cells.map(c=>`${c.x},${c.y}`)).size).toBe(r.cells.length);expect(r.cells.every(c=>c.y<=5)).toBe(true);});
 it('regular equal height columns produce red derived structures',()=>{const c=bigRoad(rounds('BBPPBBPPBB')).cells;expect(derivedColors(c,1)).toEqual(['B','B','B','B','B','B','B']);expect(derivedColors(c,2)).toEqual(['B','B','B','B','B']);expect(derivedColors(c,3)).toEqual(['B','B','B']);});
 // Offset 2 new-column comparison: previous column height 1 equals column 0 height 1 => red.
 it('irregular 1/2/1/3 reference example',()=>{const c=bigRoad(rounds('BPPBPPP')).cells;expect(derivedColors(c,1)).toEqual(['P','P','P','P','B']);expect(derivedColors(c,2)).toEqual(['B','B','P']);expect(derivedColors(c,3)).toEqual(['P','B']);});
 it('ties never affect derived structure',()=>{const a=bigRoad(rounds('BBPPBP')).cells,b=bigRoad(rounds('TBTBTPPTBTPT')).cells;for(let i=1;i<=3;i++)expect(derivedColors(a,i)).toEqual(derivedColors(b,i));});
 it('derived layout itself obeys six rows',()=>{const c=bigRoad(rounds('BP'.repeat(50))).cells;expect(derivedRoad(c,1).every(x=>x.y<6)).toBe(true);});
});
