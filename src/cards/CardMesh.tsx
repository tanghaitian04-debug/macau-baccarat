import {useRef,useMemo,useEffect} from 'react';
import {useFrame,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import type {Card} from '../rules/baccarat';
import {cardTexture} from './texture';
import {squeezeStep,foldDirection,bendVertex,type Squeeze} from './squeeze';
import {fx} from '../audio/audio';
import {useGame} from '../game/store';
import {dealPose} from '../dealer/choreography';
export {foldDirection} from './squeeze';
export function CardMesh({card,position,open,enabled,onReveal,large=false}:{card:Card;position:[number,number,number];open:boolean;enabled:boolean;onReveal:()=>void;large?:boolean}){
 const group=useRef<THREE.Group>(null),paper=useRef<THREE.Group>(null),state=useRef<Squeeze>({active:false,progress:0,revealed:open}),start=useRef({x:0,y:0,axis:0 as 0|1,sign:1 as 1|-1,locked:false}),motion=useRef({p:0,flip:open?Math.PI:0}),pulse=useRef(0),lastShape=useRef(-1),pointer=useRef<number|null>(null);
 const geo=useMemo(()=>new THREE.PlaneGeometry(.78,1.15,32,48),[]),original=useMemo(()=>new Float32Array(geo.attributes.position.array),[geo]);
 const front=useMemo(()=>{const t=cardTexture(card).clone();t.repeat.x=-1;t.offset.x=1;t.needsUpdate=true;return t;},[card.rank,card.suit]);
 useEffect(()=>()=>{geo.dispose();front.dispose();},[geo,front]);
 useEffect(()=>{state.current=open?{active:false,progress:1,revealed:true}:{active:false,progress:0,revealed:false};gsap.to(motion.current,{p:0,flip:open?Math.PI:0,duration:.6,ease:'power2.inOut'});},[open]);
 useEffect(()=>()=>{gsap.killTweensOf(motion.current);},[]);
 useFrame(()=>{
  if(group.current){const animation=useGame.getState().motion;if(animation?.id===card.id){const u=(performance.now()-animation.start)/animation.duration;group.current.position.fromArray(dealPose(position,u).card);}else group.current.position.fromArray(position);}
  if(paper.current)paper.current.rotation.y=motion.current.flip;
  const a=geo.attributes.position,p=motion.current.p;if(p===0&&lastShape.current===0)return;lastShape.current=p;
  for(let i=0;i<a.count;i++){const v=bendVertex(original[i*3],original[i*3+1],p,start.current.axis,start.current.sign);a.setXYZ(i,...v);}a.needsUpdate=true;geo.computeVertexNormals();
 });
 function down(e:ThreeEvent<PointerEvent>){if(!enabled||open||pointer.current!==null)return;e.stopPropagation();pointer.current=e.pointerId;(e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId);gsap.killTweensOf(motion.current);start.current={x:e.nativeEvent.clientX,y:e.nativeEvent.clientY,axis:0,sign:1,locked:false};state.current=squeezeStep(state.current,'start');pulse.current=0;fx('bend');}
 function move(e:ThreeEvent<PointerEvent>){if(!enabled||!state.current.active||open||pointer.current!==e.pointerId)return;e.stopPropagation();const dx=e.nativeEvent.clientX-start.current.x,dy=e.nativeEvent.clientY-start.current.y;if(!start.current.locked&&Math.hypot(dx,dy)>=8){Object.assign(start.current,foldDirection(dx,dy),{locked:true});}if(!start.current.locked)return;
 const {axis,sign}=start.current,distance=Math.max(0,axis===0?dx*(sign===1?-1:1):dy*(sign===1?-1:1));state.current=squeezeStep(state.current,'drag',distance/(large?210:130));motion.current.p=state.current.progress;useGame.setState({peelProgress:state.current.progress});
 if(distance-pulse.current>24){fx('bend');pulse.current=distance;}if(state.current.revealed){state.current.active=false;pointer.current=null;useGame.setState({peelProgress:1});onReveal();}}
 function release(e:ThreeEvent<PointerEvent>){if(pointer.current!==e.pointerId)return;e.stopPropagation();pointer.current=null;state.current=squeezeStep(state.current,e.type==='pointercancel'?'cancel':'release');try{(e.target as unknown as {releasePointerCapture:(id:number)=>void}).releasePointerCapture(e.pointerId);}catch{}gsap.to(motion.current,{p:0,duration:.45,ease:'power2.out',onUpdate:()=>useGame.setState({peelProgress:motion.current.p})});pulse.current=0;}
 return <group ref={group} position={position} rotation={[-Math.PI/2,0,0]}><group ref={paper}>
 <mesh geometry={geo} castShadow receiveShadow onPointerDown={down} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><meshStandardMaterial map={cardTexture()} side={THREE.FrontSide} roughness={.68}/></mesh>
 <mesh geometry={geo}><meshStandardMaterial map={front} side={THREE.BackSide} roughness={.66}/></mesh>
 </group></group>;
}
