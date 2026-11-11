import {useEffect} from 'react';
import {useGame} from './store';
import {advance,ordered,reveal,squeezeCards,primarySide} from './engine';
import {speak,fx,ambient,stopVoice} from '../audio/audio';
export function Controller(){const g=useGame(s=>s.game),ready=useGame(s=>s.ready),started=useGame(s=>s.started),settings=useGame(s=>s.settings),dispatch=useGame(s=>s.dispatch);
 useEffect(()=>{ambient();},[settings.ambient]);
 useEffect(()=>{if(!settings.voice)stopVoice();},[settings.voice]);
 useEffect(()=>{if(!ready||!started||g.phase!=='betting'||!Object.values(g.bets).some(Boolean))return;const id=setTimeout(()=>speak('请问还有没有下注？'),5000);return()=>clearTimeout(id);},[ready,g.phase,Object.values(g.bets).some(Boolean)]);
 useEffect(()=>{if(!ready||!started)return;
  if(g.phase==='predeal'&&g.visible>0){const labels=['闲一张。','庄一张。','闲一张。','庄一张。'];speak(labels[g.visible-1]);return;}
  const side=primarySide(g),other=side==='P'?'庄':'闲';
  const names={betting:'庄一张。四张底牌已发齐，请下注。',closing:'停止下注。',awaitOpponent:side?`请先开${other}家牌。`:'请开双方牌。',awaitSqueeze:side?`请咪${side==='B'?'庄':'闲'}家牌。`:'',squeezing:'',drawing:g.handStage==='player'?'闲家补一张。':'庄家补一张。',result:g.current?`闲家${g.current.p}点，庄家${g.current.b}点。${g.current.natural?'天牌。':''}${g.current.dragon?'庄家七龙。':g.current.winner==='P'?'闲赢。':g.current.winner==='B'?'庄赢。':'和局。'}`:'',settling:'',complete:'本局结束，请准备下一局。'};
  if(names[g.phase as keyof typeof names])speak(names[g.phase as keyof typeof names]);
 },[ready,started,g.phase,g.handStage,g.visible]);
 useEffect(()=>{if(!ready||!started)return;let delay=0;let action=()=>dispatch(advance);
  if(g.phase==='predeal')delay=650;
  if(g.phase==='closing')delay=700;
  if(g.phase==='drawing')delay=780;
  if(g.phase==='squeezing'){
   if(ordered(g).slice(0,g.visible).every(c=>g.revealed.includes(c.id)))delay=550;
   else if(settings.auto&&squeezeCards(g).length){delay=850;action=()=>dispatch(x=>{const c=squeezeCards(x)[0];return c?reveal(x,c.id):x;});}
  }
  if(g.phase==='result')delay=4200;
  if(g.phase==='settling')delay=1000;
  if(!delay)return;
  const id=setTimeout(()=>{if(g.phase==='predeal'||g.phase==='drawing')fx('card');if(g.phase==='settling')fx('win');action();},delay);
  return()=>clearTimeout(id);
 },[ready,started,g.phase,g.visible,g.revealed.length,g.handStage,settings.auto,dispatch]);return null;
}