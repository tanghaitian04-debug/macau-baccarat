import {useRef,useMemo,useEffect} from 'react';
import {useFrame,type ThreeEvent} from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import type {Card} from '../rules/baccarat';
import {cardTexture} from './texture';
import {squeezeStep,type Squeeze} from './squeeze';
import {fx} from '../audio/audio';
type DragDirection='up'|'down'|'left'|'right';
/** Swipe direction determines which edge folds over the card:
 * ↑ top-to-bottom, ↓ bottom-to-top, ← right-to-left, → left-to-right. */
export function foldDirection(dx:number,dy:number):{direction:DragDirection;axis:0|1;sign:1|-1;distance:number}{
 if(Math.abs(dx)>Math.abs(dy))return {direction:dx<0?'left':'right',axis:0,sign:dx<0?1:-1,distance:Math.abs(dx)};
 return {direction:dy<0?'up':'down',axis:1,sign:dy<0?1:-1,distance:Math.abs(dy)};
}
export function CardMesh({card,position,open,enabled,onReveal,large=false}:{card:Card;position:[number,number,number];open:boolean;enabled:boolean;onReveal:()=>void;large?:boolean}){
 const group=useRef<THREE.Group>(null),state=useRef<Squeeze>({active:false,progress:0,revealed:open}),start=useRef({x:0,y:0,axis:0 as 0|1,sign:1 as 1|-1,locked:false}),motion=useRef({p:0}),pulse=useRef(0),lastShape=useRef(-1);
 const geo=useMemo(()=>new THREE.PlaneGeometry(.78,1.15,26,38),[]),original=useMemo(()=>new Float32Array(geo.attributes.position.array),[geo]);
 useEffect(()=>()=>geo.dispose(),[geo]);
 useEffect(()=>{state.current=open?{active:false,progress:1,revealed:true}:{active:false,progress:0,revealed:false};gsap.to(motion.current,{p:0,duration:.35});},[open]);
 useEffect(()=>{if(group.current){group.current.position.set(1.05,.72,-1.6);gsap.to(group.current.position,{x:position[0],y:position[1],z:position[2],duration:.58,ease:'power2.out'});}},[card.id]);
 useFrame(()=>{const a=geo.attributes.position,p=motion.current.p;if(p===0&&lastShape.current===0)return;lastShape.current=p;const {axis,sign}=start.current,length=axis===0?.78:1.15,r=.12,fold=p*(length+Math.PI*r);for(let i=0;i<a.count;i++){const ox=original[i*3],oy=original[i*3+1],v=axis===0?ox:oy,s=length/2-v*sign;let nv=v,z=0;if(s<fold&&!open){const d=fold-s,theta=Math.min(Math.PI,d/r);const ns=d>Math.PI*r?fold+d-Math.PI*r:fold-r*Math.sin(theta);nv=(length/2-ns)*sign;z=r*(1-Math.cos(theta));}a.setXYZ(i,axis===0?nv:ox,axis===1?nv:oy,z);}a.needsUpdate=true;geo.computeVertexNormals();});
 function down(e:ThreeEvent<PointerEvent>){if(!enabled||open)return;e.stopPropagation();(e.target as unknown as {setPointerCapture:(id:number)=>void}).setPointerCapture(e.pointerId);start.current={x:e.nativeEvent.clientX,y:e.nativeEvent.clientY,axis:0,sign:1,locked:false};state.current=squeezeStep(state.current,'start');pulse.current=0;fx('bend');}
 function move(e:ThreeEvent<PointerEvent>){if(!state.current.active||open)return;e.stopPropagation();const dx=e.nativeEvent.clientX-start.current.x,dy=e.nativeEvent.clientY-start.current.y;if(!start.current.locked&&Math.hypot(dx,dy)>=10){const d=foldDirection(dx,dy);start.current.axis=d.axis;start.current.sign=d.sign;start.current.locked=true;}if(!start.current.locked)return;
 const {axis,sign}=start.current;
 const distance=Math.max(0,axis===0?dx*(sign===1?-1:1):dy*(sign===1?-1:1));
 state.current=squeezeStep(state.current,'drag',distance/(large?190:130));motion.current.p=state.current.progress;
 if(distance-pulse.current>24){fx('bend');pulse.current=distance;}if(state.current.revealed){state.current.active=false;onReveal();}}
 function release(e:ThreeEvent<PointerEvent>){if(!state.current.active)return;e.stopPropagation();const target=e.target as unknown as {releasePointerCapture:(id:number)=>void};try{target.releasePointerCapture(e.pointerId);}catch{}state.current=squeezeStep(state.current,e.type==='pointercancel'?'cancel':'release');gsap.to(motion.current,{p:0,duration:.45,ease:'elastic.out(1,.7)'});pulse.current=0;}
 return <group ref={group} position={position} rotation={[-Math.PI/2,0,0]} scale={large?1.7:1}>
 <mesh geometry={geo} castShadow receiveShadow onPointerDown={down} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
 <meshStandardMaterial map={cardTexture(open?card:undefined)} side={THREE.FrontSide} roughness={.56}/></mesh>
 {!open&&<mesh geometry={geo}><meshStandardMaterial map={cardTexture(card)} side={THREE.BackSide} roughness={.6}/></mesh>}
 </group>;
}