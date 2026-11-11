import {create} from 'zustand';
import * as E from './engine';
import {loadSession,saveSession} from '../storage/history';
import type {Bet,Mode} from '../rules/baccarat';
export type Settings={auto:boolean;voice:number;effects:number;ambient:number;subtitles:boolean;quality:'low'|'high'};
type Saved={game:E.Game;settings:Settings};
type Store={game:E.Game;settings:Settings;ready:boolean;storageError:string;selected:number;subtitle:string;speaking:boolean;mouthOpen:number;dispatch:(fn:(g:E.Game)=>E.Game)=>void;bet:(b:Bet)=>void;configure:(p:Partial<Settings>)=>void;setMode:(m:Mode)=>void};
const defaults:Settings={auto:false,voice:.8,effects:.55,ambient:0,subtitles:true,quality:'low'};
let queue=Promise.resolve();
function persist(){const {game,settings}=useGame.getState();queue=queue.catch(()=>{}).then(()=>saveSession({game,settings})).catch(()=>{useGame.setState({storageError:'浏览器存储不可用，关闭页面后记录可能丢失'});});}
export const useGame=create<Store>((set,get)=>({game:E.initial(),settings:defaults,ready:false,storageError:'',selected:100,subtitle:'欢迎来到澳门百家乐',speaking:false,mouthOpen:0,dispatch:fn=>{const before=get().game,game=fn(before);if(game!==before){set({game});persist();}},bet:b=>{get().dispatch(g=>E.place(g,b,get().selected*100));},configure:p=>{set({settings:{...get().settings,...p}});persist();},setMode:mode=>get().dispatch(g=>g.phase==='betting'?{...g,mode}:g)}));
export async function hydrate(){try{const saved=await loadSession<Saved>();if(saved?.game.version===1)useGame.setState({game:saved.game,settings:{...defaults,...saved.settings}});}catch{useGame.setState({storageError:'无法读取历史记录；本次仍可游玩'});}useGame.setState({ready:true});}
