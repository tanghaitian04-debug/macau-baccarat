import {useGame} from '../game/store';
let ctx:AudioContext|null=null,environment:AudioBufferSourceNode|null=null,envGain:GainNode|null=null;
export function unlock(){if(!ctx)ctx=new (window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext)();void ctx.resume();}
export function fx(kind:'card'|'chip'|'bend'|'win'){
 const v=useGame.getState().settings.effects;if(!ctx||!v)return;const t=ctx.currentTime,g=ctx.createGain();g.connect(ctx.destination);
 if(kind==='chip'||kind==='win'){const o=ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(kind==='chip'?1750:660,t);o.frequency.exponentialRampToValueAtTime(kind==='chip'?550:990,t+.17);g.gain.setValueAtTime(v*.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(g);o.start();o.stop(t+.23);}
 else{const n=ctx.createBuffer(1,ctx.sampleRate*.18,ctx.sampleRate),a=n.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*.3;const s=ctx.createBufferSource(),f=ctx.createBiquadFilter();s.buffer=n;f.type='lowpass';f.frequency.value=kind==='bend'?1100:3300;s.connect(f);f.connect(g);g.gain.setValueAtTime(v*.22,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);s.start();}
}
export function ambient(){if(!ctx)return;const v=useGame.getState().settings.ambient;if(!environment){const b=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),a=b.getChannelData(0);let prev=0;for(let i=0;i<a.length;i++){prev=(prev+.025*(Math.random()*2-1))/.999;prev=Math.max(-.3,Math.min(.3,prev));a[i]=prev;}environment=ctx.createBufferSource();environment.buffer=b;environment.loop=true;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=320;envGain=ctx.createGain();environment.connect(f);f.connect(envGain);envGain.connect(ctx.destination);environment.start();}envGain!.gain.setTargetAtTime(v*.15,ctx.currentTime,.3);}
export type VoiceLine={text:string;url?:string;mouth?:{time:number;open:number}[]};
let speakingAudio:HTMLAudioElement|null=null,mouthFrame=0;
function animateMouth(line:VoiceLine,start:number,audio?:HTMLAudioElement){cancelAnimationFrame(mouthFrame);const tick=()=>{if(!useGame.getState().speaking){useGame.setState({mouthOpen:0});return;}const time=audio?.currentTime??(performance.now()-start)/1000;let amplitude=Math.abs(Math.sin(time*17))*.8;if(line.mouth?.length){const data=line.mouth,i=data.findIndex(p=>p.time>time);if(i===0)amplitude=data[0].open;else if(i<0)amplitude=data.at(-1)!.open;else{const a=data[i-1],b=data[i];amplitude=a.open+(b.open-a.open)*(time-a.time)/(b.time-a.time);}}useGame.setState({mouthOpen:Math.max(0,Math.min(1,amplitude))});mouthFrame=requestAnimationFrame(tick);};tick();}
type Pending={line:VoiceLine;resolve:()=>void;onStart?:()=>void};
const speechQueue:Pending[]=[];let busy=false,generation=0;
export function stopVoice(){generation++;window.speechSynthesis?.cancel();speakingAudio?.pause();cancelAnimationFrame(mouthFrame);useGame.setState({speaking:false,mouthOpen:0});speechQueue.splice(0).forEach(p=>p.resolve());busy=false;}
// Override via public/assets/voice-manifest.json; absent assets never pretend to be recorded speech.
export let voiceAssets:Record<string,VoiceLine>={};
export function loadVoiceAssets(){void fetch(new URL('assets/voice-manifest.json',document.baseURI)).then(r=>r.ok?r.json():{}).then(v=>{voiceAssets=v;}).catch(()=>{});}
export function speak(line:string|VoiceLine,onStart?:()=>void):Promise<void>{const l=typeof line==='string'?(voiceAssets[line]??{text:line}):line;return new Promise(resolve=>{speechQueue.push({line:l,resolve,onStart});void playNext();});}
async function playNext(){if(busy||!speechQueue.length)return;busy=true;const {line:l,resolve,onStart}=speechQueue.shift()!,token=generation;const s=useGame.getState();useGame.setState({subtitle:l.text});
 await new Promise<void>(done=>{let finished=false,began=false;const begin=()=>{if(!began){began=true;onStart?.();}};const end=()=>{if(finished)return;begin();finished=true;clearTimeout(watchdog);if(token===generation)useGame.setState({speaking:false,mouthOpen:0});done();};const watchdog=setTimeout(end,Math.max(2000,l.text.length*550));
 if(!s.settings.voice){end();return;}
 if(l.url){const a=new Audio(new URL(l.url,document.baseURI).href);speakingAudio=a;a.volume=s.settings.voice;a.onplay=()=>{begin();useGame.setState({speaking:true});animateMouth(l,performance.now(),a);};a.onended=a.onerror=end;void a.play().catch(end);return;}
 if(!('speechSynthesis'in window)){end();return;}const u=new SpeechSynthesisUtterance(l.text);u.lang='zh-CN';u.rate=1;u.volume=s.settings.voice;const voices=speechSynthesis.getVoices();u.voice=voices.find(v=>/zh[-_]CN/i.test(v.lang)&&/Ting|Xiao|female|女/i.test(v.name))??voices.find(v=>/^zh/i.test(v.lang))??null;u.onstart=()=>{begin();useGame.setState({speaking:true});animateMouth(l,performance.now());};u.onend=u.onerror=end;speechSynthesis.speak(u);
 });resolve();if(token===generation){busy=false;void playNext();}
}
