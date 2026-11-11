import {Component,Suspense,useRef,useState,type ReactNode} from 'react';
import {Canvas,useFrame,type ThreeEvent} from '@react-three/fiber';
import {RoundedBox,OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {DealerModel} from '../dealer/DealerModel';
import {useEffect} from 'react';
import gsap from 'gsap';
import {CardMesh} from '../cards/CardMesh';
import {labelTexture} from '../cards/texture';
import {useGame} from '../game/store';
import {ordered,reveal,squeezeCards,primarySide} from '../game/engine';
import {type Bet} from '../rules/baccarat';
import {fx} from '../audio/audio';
const positions:Record<Bet,[number,number,number]>={P:[-1.65,.53,1.2],B:[1.65,.53,1.2],T:[0,.53,1.05],PP:[-2.7,.53,.25],BP:[2.7,.53,.25],D7:[0,.53,1.9]};
function Chip({pos,color,scale=1}:{pos:[number,number,number];color:string;scale?:number}){return <group position={pos} scale={scale}><mesh castShadow><cylinderGeometry args={[.18,.18,.055,24]}/><meshStandardMaterial color={color} roughness={.33}/></mesh><mesh position={[0,.03,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.12,.009,6,24]}/><meshStandardMaterial color="#f4e9cc"/></mesh>{Array.from({length:8},(_,i)=><mesh key={i} position={[Math.sin(i*Math.PI/4)*.169,0,Math.cos(i*Math.PI/4)*.169]} rotation={[0,i*Math.PI/4,0]}><boxGeometry args={[.035,.059,.026]}/><meshStandardMaterial color="#e4dbc5"/></mesh>)}</group>;}
function BetPile({betKey}:{betKey:Bet}){const g=useGame(s=>s.game),group=useRef<THREE.Group>(null),won=g.current?.returns?.[betKey]??0;
 useEffect(()=>{if(!group.current)return;if(g.phase==='settling')gsap.to(group.current.position,{z:won?1.8:-2.1,y:won?.18:.05,duration:1,ease:'power2.inOut'});else if(g.phase==='betting')group.current.position.set(0,0,0);},[g.phase]);
 const count=Math.min(10,Math.ceil(g.bets[betKey]/10000)+(g.phase==='settling'&&won>g.bets[betKey]?2:0));return <group ref={group}>{Array.from({length:count},(_,i)=><Chip key={i} pos={[.24,i*.065+.08,.1]} color={betKey==='P'?'#2d75aa':betKey==='B'?'#a33c47':'#d0ad5c'}/>)}</group>;
}
function ChipTray(){const g=useGame(s=>s.game),selected=useGame(s=>s.selected),bet=useGame(s=>s.bet);const [drag,setDrag]=useState<{n:number;p:THREE.Vector3}|null>(null);const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.68);const colors=['#637562','#3e75a1','#a3414b','#76518f','#b29a45','#365b5c','#b47c58'];
 function begin(e:ThreeEvent<PointerEvent>,n:number){if(g.phase!=='betting')return;e.stopPropagation();useGame.setState({selected:n});(e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId);setDrag({n,p:new THREE.Vector3(-2.1,.68,2.55)});fx('chip');}
 function move(e:ThreeEvent<PointerEvent>){if(!drag)return;e.stopPropagation();const p=new THREE.Vector3();if(e.ray.intersectPlane(plane,p))setDrag({...drag,p});}
 function end(e:ThreeEvent<PointerEvent>){if(!drag)return;e.stopPropagation();if(e.type!=='pointercancel'){const target=(Object.keys(positions) as Bet[]).sort((a,b)=>drag.p.distanceTo(new THREE.Vector3(...positions[a]))-drag.p.distanceTo(new THREE.Vector3(...positions[b])))[0];if(drag.p.distanceTo(new THREE.Vector3(...positions[target]))<.8){bet(target);fx('chip');}}setDrag(null);try{(e.target as unknown as {releasePointerCapture:(id:number)=>void}).releasePointerCapture(e.pointerId);}catch{}}
 return <>{[10,50,100,500,1000,5000,10000].map((n,i)=><group key={n} position={[-2.1+i*.7,.58,2.55]} onPointerDown={e=>begin(e,n)} onPointerMove={move} onPointerUp={end} onPointerCancel={end}><Chip pos={[0,selected===n?.05:0,0]} color={colors[i]} scale={1.1}/><mesh position={[0,.065,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.29,.18]}/><meshBasicMaterial map={labelTexture(n>=1000?`${n/1000}K`:String(n),'#fff2cb')} transparent depthWrite={false}/></mesh></group>)}{drag&&<Chip pos={drag.p.toArray() as [number,number,number]} color="#d0b76a" scale={1.2}/>}</>;}
// Rounded casino-style kidney / half-moon baccarat layout (straight dealer edge, curved player rail).
const tableShape=(()=>{const s=new THREE.Shape();s.moveTo(-4.15,2.55);s.lineTo(4.15,2.55);s.lineTo(4.15,-.6);s.bezierCurveTo(4.15,-2.8,2.25,-3.85,0,-3.85);s.bezierCurveTo(-2.25,-3.85,-4.15,-2.8,-4.15,-.6);s.closePath();return s;})();
const trimCurve=new THREE.CatmullRomCurve3(tableShape.getPoints(100).map(p=>new THREE.Vector3(p.x,.532,-p.y)),true,'centripetal');
const trimGeometry=new THREE.TubeGeometry(trimCurve,100,.046,8,true);
function Table(){const g=useGame(s=>s.game),bet=useGame(s=>s.bet);return <>
 <mesh position={[0,.05,0]} rotation={[-Math.PI/2,0,0]} receiveShadow castShadow><extrudeGeometry args={[tableShape,{depth:.38,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.18,bevelThickness:.11,curveSegments:40}]}/><meshStandardMaterial color="#381d17" metalness={.18} roughness={.28}/></mesh>
 <mesh position={[0,.497,0]} rotation={[-Math.PI/2,0,0]} scale={[.975,.963,1]} receiveShadow><shapeGeometry args={[tableShape]}/><meshStandardMaterial color="#075c45" roughness={.96}/></mesh>
 <mesh geometry={trimGeometry} castShadow><meshStandardMaterial color="#b7975a" metalness={.82} roughness={.22}/></mesh>
 <mesh position={[0,.51,-.76]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[2.26,2.278,100]}/><meshStandardMaterial color="#c2aa69" metalness={.55} roughness={.4} transparent opacity={.65}/></mesh>
 <mesh position={[0,.512,-1.22]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[3.6,.49]}/><meshBasicMaterial map={labelTexture('澳 門 · 翡 翠 厅  /  BACCARAT', '#d7c290')} transparent depthWrite={false}/></mesh>
 {[-1,1].map(i=><group key={i} position={[i*3.36,.518,.53]}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.42,.431,64]}/><meshBasicMaterial color="#c8b076" transparent opacity={.44}/></mesh><mesh position={[0,.005,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.7,.28]}/><meshBasicMaterial map={labelTexture(i===-1?'PLAYER':'BANKER',i===-1?'#add9ee':'#f4aea1')} transparent depthWrite={false}/></mesh></group>)}
 {(Object.keys(positions) as Bet[]).map(k=><group key={k} position={positions[k]}>
 <mesh rotation={[-Math.PI/2,0,0]} onClick={e=>{e.stopPropagation();if(g.phase!=='betting')return;bet(k);fx('chip');}}><planeGeometry args={[k==='P'||k==='B'?1.5:1,.56]}/><meshBasicMaterial map={labelTexture({P:'闲 PLAYER',B:'庄 BANKER',T:'和 TIE',PP:'闲对 11:1',BP:'庄对 11:1',D7:'七龙 40:1'}[k],k==='P'?'#9cceec':k==='B'?'#f2a29d':'#e5ce93')} transparent depthWrite={false}/></mesh>
 <BetPile betKey={k}/>
 </group>)}
 {/* Realistic angled dealing shoe with cream cards protruding from the opening. */}
 <group position={[1.05,.65,-1.85]} rotation={[0,-.24,0]}>
 <RoundedBox args={[.9,.36,1.35]} radius={.06}><meshStandardMaterial color="#171e21" metalness={.33} roughness={.25}/></RoundedBox>
 <RoundedBox args={[.67,.11,.94]} radius={.035} position={[0,.22,-.1]}><meshStandardMaterial color="#cec5ae" roughness={.7}/></RoundedBox>
 <mesh position={[0,.04,.69]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.62,.14]}/><meshStandardMaterial color="#c3a567" metalness={.8}/></mesh>
 </group>
 {/* Dealer's straight edge tray. */}
 <RoundedBox args={[1.22,.13,.42]} radius={.06} position={[-1.2,.6,-2.1]}><meshStandardMaterial color="#282622" metalness={.45} roughness={.32}/></RoundedBox>
 </>;}
function CameraAim(){const controls=useRef<any>(null);return <OrbitControls ref={controls} target={[0,.55,-.25]} enableZoom={false} enablePan={false} minPolarAngle={.73} maxPolarAngle={1.1} minAzimuthAngle={-.16} maxAzimuthAngle={.16} enableDamping/>;}
function Cards(){const g=useGame(s=>s.game),dispatch=useGame(s=>s.dispatch);const order=ordered(g).slice(0,g.visible);return <>{order.map(c=>{const p=g.player.some(a=>a.id===c.id),i=(p?g.player:g.banker).findIndex(a=>a.id===c.id);return <CardMesh key={c.id} card={c} position={[p?-1.75+i*.69:1+i*.69,.56,-.03+(i===2?.27:0)]} open={g.revealed.includes(c.id)} enabled={g.phase==='squeezing'&&squeezeCards(g).some(v=>v.id===c.id)} onReveal={()=>dispatch(x=>reveal(x,c.id))}/>;})}</>;}
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<FlatTable/>:this.props.children;}}
function FlatTable(){const g=useGame(s=>s.game),dispatch=useGame(s=>s.dispatch);return <div className="flat-scene"><div className="flat-arc"/><div className="flat-mark">翡翠厅<small>MACAU · BACCARAT</small></div><p className="webgl-note">当前浏览器未提供 WebGL · 已启用规则游玩模式</p><div className="flat-hands">{[g.player,g.banker].map((hand,i)=><div key={i}>{hand.map(c=>{const visible=ordered(g).slice(0,g.visible).some(a=>a.id===c.id);return visible?<button key={c.id} disabled={g.phase!=='squeezing'||!squeezeCards(g).some(v=>v.id===c.id)} onClick={()=>dispatch(x=>reveal(x,c.id))} className={'flat-card '+(g.revealed.includes(c.id)?'opened':'')} style={g.revealed.includes(c.id)?{color:c.suit===1||c.suit===3?'#b33346':'#12352f'}:{}}>{g.revealed.includes(c.id)?<>{['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][c.rank]}<b>{['♠','♥','♣','♦'][c.suit]}</b></>:'翡'}</button>:null;})}</div>)}</div></div>}

function SceneCanvas(){const quality=useGame(s=>s.settings.quality),[error,setError]=useState(false);if(error)return <div className="scene-error">此浏览器无法创建 WebGL 场景。仍可使用下方操作栏开牌和游玩。</div>;return <div className="scene" onContextMenu={e=>e.preventDefault()}><Canvas onCreated={({gl})=>{gl.domElement.addEventListener('webglcontextlost',()=>setError(true));}} shadows={quality==='high'} dpr={[1,quality==='high'?2:1.35]} camera={{position:[0,5.5,7.8],fov:47}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} fallback={<div className="scene-error">WebGL 不可用，请在设置中启用自动开牌。</div>}><color attach="background" args={['#071b19']}/><fog attach="fog" args={['#071b19',10,23]}/><ambientLight intensity={1.35}/><directionalLight position={[1,7,4]} intensity={2.5} castShadow shadow-mapSize={[1024,1024]}/><pointLight position={[-4,3,-3]} color="#e6b35f" intensity={22}/><pointLight position={[4,3,-3]} color="#e6b35f" intensity={22}/><Suspense fallback={null}><Table/><ChipTray/><DealerModel/><Cards/>{[-1,1].map(i=><group key={i} position={[i*5,0,-4]}><mesh position={[0,2,0]}><cylinderGeometry args={[.22,.3,5,16]}/><meshStandardMaterial color="#8c7144" metalness={.7} roughness={.25}/></mesh><mesh position={[0,3.5,.3]}><sphereGeometry args={[.35,16,12]}/><meshStandardMaterial color="#ffe1aa" emissive="#d29d48" emissiveIntensity={1}/></mesh></group>)}<mesh position={[0,2,-6]}><planeGeometry args={[16,8]}/><meshStandardMaterial color="#0b302a"/></mesh><mesh position={[0,3,-5.95]}><planeGeometry args={[5,1]}/><meshBasicMaterial map={labelTexture('M A C A U   ·   B A C C A R A T')} transparent/></mesh><CameraAim/></Suspense></Canvas></div>;}
export function Scene(){return <SceneBoundary><SceneCanvas/></SceneBoundary>;}
export function SqueezeView({onClose}:{onClose:()=>void}){
 const g=useGame(s=>s.game),dispatch=useGame(s=>s.dispatch),pending=squeezeCards(g),side=primarySide(g),name=side==='B'?'庄':'闲',c=pending[0];
 return <div className="squeeze-focus"><div className="focus-title"><span>正在咪{name}家牌 <small>已押注{name}家 · 只能揭开{name}家牌</small></span><button onClick={onClose}>返回牌桌 ×</button></div>
 {c?<><div className="focus-canvas"><SceneBoundary><Canvas camera={{position:[0,6,1.4],fov:35}} dpr={[1,1.5]}><color attach="background" args={['#073b30']}/><ambientLight intensity={2}/><directionalLight position={[0,5,4]} intensity={3}/><CardMesh key={c.id} card={c} large position={[0,0,0]} open={false} enabled onReveal={()=>{fx('card');dispatch(x=>reveal(x,c.id));}}/></Canvas></SceneBoundary></div><div className="direction-guide"><span>↑ 从上向下揭开</span><span>↓ 从下向上揭开</span><span>← 从右向左揭开</span><span>→ 从左向右揭开</span></div><div className="focus-foot">咪{name}家 · 本次尚有 {pending.length} 张未开 <button onClick={()=>dispatch(x=>reveal(x,c.id))}>直接开这张</button></div></>:<div className="focus-done">{name}家开牌完成，准备回到牌桌…</div>}
 </div>;
}