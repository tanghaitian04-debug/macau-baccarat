import {useEffect} from 'react';
import {useGame} from './store';
import {advance,ordered,reveal,squeezeCards,primarySide,openOpponent,startSqueeze} from './engine';
import {speak,fx,ambient,stopVoice} from '../audio/audio';
import {CARD_DURATION} from '../dealer/choreography';
export const dealLabel=(index:number)=>['闲一张。','庄一张。','闲一张。','庄一张。'][index];
export function Controller(){const g=useGame(s=>s.game),ready=useGame(s=>s.ready),started=useGame(s=>s.started),settings=useGame(s=>s.settings),dispatch=useGame(s=>s.dispatch);
 useEffect(()=>{ambient();},[settings.ambient]);useEffect(()=>{if(!settings.voice)stopVoice();},[settings.voice]);
 useEffect(()=>{if(!ready||!started||g.phase!=='betting'||!Object.values(g.bets).some(Boolean))return;const id=setTimeout(()=>{void speak('请问还有没有下注？');},6000);return()=>clearTimeout(id);},[ready,started,g.phase,Object.values(g.bets).some(Boolean)]);
 useEffect(()=>{
  if(!ready||!started)return;let cancelled=false;let delay=0;let action=()=>dispatch(advance);let line='';let motionId:string|null=null;const duration=CARD_DURATION[settings.dealSpeed];
  if(g.phase==='predeal'){
   if(g.visible===0){delay=350;}else{line=dealLabel(g.visible-1);delay=duration;const card=ordered(g)[g.visible-1];motionId=card.id;useGame.setState({motion:{id:card.id,start:Infinity,duration}});}
  }
  if(g.phase==='betting'){void speak('各位请下注。');return;}
  if(g.phase==='closing'){line='停止下注。';delay=650;}
  if(g.phase==='awaitOpponent'){if(settings.auto||!primarySide(g)){delay=400;action=()=>dispatch(openOpponent);}else return;}
  if(g.phase==='revealingOpponent'){delay=650;fx('card');}
  if(g.phase==='awaitSqueeze'){if(settings.auto){delay=250;action=()=>dispatch(startSqueeze);}else return;}
  if(g.phase==='squeezing'){if(!squeezeCards(g).length)delay=450;else if(settings.auto){delay=500;action=()=>dispatch(x=>{const card=squeezeCards(x)[0];return card?reveal(x,card.id):x;});}}
  if(g.phase==='checking')delay=200;
  if(g.phase==='drawing'){line=g.handStage==='player'?'闲家补一张。':'庄家补一张。';delay=duration;const card=ordered(g).at(-1)!;motionId=card.id;useGame.setState({motion:{id:card.id,start:Infinity,duration}});}
  if(g.phase==='revealingThird'){delay=650;fx('card');}
  if(g.phase==='result'){line=g.current?`闲家${g.current.p}点，庄家${g.current.b}点。${g.current.natural?'天牌。':''}${g.current.dragon?'庄家七龙。':g.current.winner==='P'?'闲赢。':g.current.winner==='B'?'庄赢。':'和局。'}`:'';delay=1600;}
  if(g.phase==='settling'){delay=1000;fx('win');}
  if(g.phase==='complete'){void speak('本局结束，请准备下一局。');return;}
  if(!delay)return;
  let startTimer:()=>void=()=>{};const timer=new Promise<void>(resolve=>{startTimer=()=>{if(cancelled){resolve();return;}if(motionId){useGame.setState({motion:{id:motionId,start:performance.now(),duration}});fx('card');}setTimeout(resolve,delay);};});const speech=line?speak(line,startTimer):Promise.resolve();if(!line)startTimer();
  void Promise.all([timer,speech]).then(()=>{if(!cancelled)action();});return()=>{cancelled=true;};
 },[ready,started,g.phase,g.visible,g.revealed.length,g.handStage,settings.auto,settings.dealSpeed,dispatch]);return null;
}
