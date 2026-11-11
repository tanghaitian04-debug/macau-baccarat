import {it,expect,vi} from 'vitest';
import {speak,stopVoice} from '../src/audio/audio';
import {useGame} from '../src/game/store';
it('queues Chinese lines without cancelling or overlapping; actor callbacks start with actual speech',async()=>{
 const utterances:{text:string;onstart:()=>void;onend:()=>void}[]=[],cancel=vi.fn();vi.stubGlobal('window',{speechSynthesis:{cancel}});vi.stubGlobal('speechSynthesis',{getVoices:()=>[],speak:(u:typeof utterances[number])=>utterances.push(u)});vi.stubGlobal('SpeechSynthesisUtterance',class{constructor(public text:string){}});vi.stubGlobal('requestAnimationFrame',()=>0);vi.stubGlobal('cancelAnimationFrame',()=>{});useGame.setState({settings:{...useGame.getState().settings,voice:1}});
 const starts:number[]=[],lines=['闲一张。','庄一张。','闲一张。','庄一张。','各位请下注。'];const pending=lines.map((line,i)=>speak(line,()=>starts.push(i)));
 for(let i=0;i<5;i++){expect(utterances).toHaveLength(i+1);expect(utterances[i].text).toBe(lines[i]);expect(starts).toHaveLength(i);utterances[i].onstart();expect(starts.at(-1)).toBe(i);utterances[i].onend();await Promise.resolve();await Promise.resolve();}
 await Promise.all(pending);expect(cancel).not.toHaveBeenCalled();stopVoice();vi.unstubAllGlobals();
});
