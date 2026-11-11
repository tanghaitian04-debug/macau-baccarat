import type {Side} from '../rules/baccarat';
export type RoadRound={winner:Side;pp:boolean;bp:boolean};
export type Cell={x:number;y:number;color:'B'|'P';ties:number;pp:boolean;bp:boolean;logical:number;depth:number};
// Six rows, collision-aware dragon tails; logical columns remain separate from drawn coordinates.
export function bigRoad(rounds:RoadRound[]) {
 const cells:Cell[]=[],occupied=new Set<string>();let logical=-1,depth=0,base=0,tail=false,leading=0;
 for(const r of rounds){if(r.winner==='T'){if(cells.length)cells[cells.length-1].ties++;else leading++;continue;}
 const last=cells.at(-1);let x:number,y:number;
 if(!last||last.color!==r.winner){logical++;depth=0;tail=false;base=last?base+1:0;x=base;y=0;while(occupied.has(`${x},0`))x++;base=x;}
 else{depth++;x=last.x;y=last.y+1;if(tail||y>5||occupied.has(`${x},${y}`)){x=last.x+1;y=last.y;tail=true;}}
 const c:Cell={x,y,color:r.winner,ties:cells.length===0?leading:0,pp:r.pp,bp:r.bp,logical,depth};cells.push(c);occupied.add(`${x},${y}`);
 }return {cells,leading:cells.length?0:leading};
}
export function derivedColors(cells:Cell[],offset:number):('B'|'P')[] {
 const heights:number[]=[],colors:('B'|'P')[]=[];
 for(const c of cells){const col=c.logical,row=c.depth;
  if(row===0){if(col>=offset+1)colors.push(heights[col-1]===heights[col-offset-1]?'B':'P');}
  else if(col>=offset){const h=heights[col-offset]??0;colors.push(row<h||row>h?'B':'P');}
  heights[col]=(heights[col]??0)+1;
 }return colors;
}
export const derivedRoad=(cells:Cell[],offset:number)=>bigRoad(derivedColors(cells,offset).map(winner=>({winner,pp:false,bp:false}))).cells;
