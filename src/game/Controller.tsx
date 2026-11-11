import {useEffect} from 'react';
import {useGame} from './store';
import {advance,ordered,reveal} from './engine';
import {speak,fx,ambient,stopVoice} from '../audio/audio';
export function Controller(){const g=useGame(s=>s.game),ready=useGame(s=>s.ready),settings=useGame(s=>s.settings),dispatch=useGame(s=>s.dispatch);
 useEffect(()=>{ambient();},[settings.ambient]);
 useEffect(()=>{if(!settings.voice)stopVoice();},[settings.voice]);
 useEffect(()=>{if(!ready||g.phase!=='betting'||!Object.values(g.bets).some(Boolean))return;const id=setTimeout(()=>speak('请问还有没有下注？'),5000);return()=>clearTimeout(id);},[ready,g.phase,Object.values(g.bets).some(Boolean)]);
 useEffect(()=>{if(!ready)return;const names={betting:'各位请下注。',closing:'停止下注。',dealing:'闲家两张，庄家两张。',squeezing:'请咪牌。',drawing:g.handStage==='player'?'闲家补一张。':'庄家补一张。',result:g.current?`闲家${g.current.p}点，庄家${g.current.b}点。${g.current.natural?'天牌。':''}${g.current.dragon?'庄家七龙。':g.current.winner==='P'?'闲赢。':g.current.winner==='B'?'庄赢。':'和局。'}`:'',settling:'',complete:'本局结束，请准备下一局。'};if(names[g.phase])speak(names[g.phase]);},[ready,g.phase,g.handStage]);
 useEffect(()=>{if(!ready)return;let delay=0;let action=()=>dispatch(advance);
 if(g.phase==='closing')delay=950;
 if(g.phase==='dealing')delay=460;
 if(g.phase==='drawing')delay=800;
 if(g.phase==='squeezing'){if(ordered(g).every(c=>g.revealed.includes(c.id)))delay=550;else if(settings.auto){delay=650;action=()=>dispatch(x=>{const c=ordered(x).find(c=>!x.revealed.includes(c.id));return c?reveal(x,c.id):x;});}}
 if(g.phase==='result')delay=5000;
 if(g.phase==='settling')delay=1100;
 if(!delay)return;const id=setTimeout(()=>{if(g.phase==='dealing'||g.phase==='drawing')fx('card');if(g.phase==='settling')fx('win');action();},delay);return()=>clearTimeout(id);
 },[ready,g.phase,g.visible,g.revealed.length,g.handStage,settings.auto,dispatch]);return null;}
