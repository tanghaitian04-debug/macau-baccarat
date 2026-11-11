import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {dealPose,cardDestination} from './choreography';
import {useGame} from '../game/store';
function Sphere({p,s,color}:{p:[number,number,number];s:[number,number,number];color:string}){return <mesh position={p} scale={s} castShadow><sphereGeometry args={[1,24,18]}/><meshStandardMaterial color={color} roughness={.65}/></mesh>;}
function Fingers({side}:{side:number}){const joints=useRef<THREE.Group[]>([]);useFrame(()=>{const st=useGame.getState(),m=st.motion,u=m?(performance.now()-m.start)/m.duration:1,grip=side===1&&u>.18&&u<.68;for(let i=0;i<joints.current.length;i++){const j=joints.current[i];if(j)j.rotation.x=grip?.25+(i%3)*.12:.05;}});return <group position={[0,-.65,0]}>{[0,1,2,3,4].map(f=><group key={f} position={[(f-2)*.035,0,f===0?.04:0]} rotation={[0,0,f===0?-.4:0]}>{[0,1,2].reduceRight<React.ReactNode>((child,k)=><group ref={v=>{if(v)joints.current[f*3+k]=v;}} position={[0,k===0?0:-.045,0]}><Sphere p={[0,-.025,0]} s={[.016,.032,.016]} color="#e6b69e"/>{child}</group>,null)}</group>)}</group>;}
// Joint hierarchy deliberately matches shoulder / elbow / wrist / neck / jaw sockets.
// A GLTF adapter can replace this procedural rig without changing the game engine.
export function Dealer(){const root=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null),arm=useRef<THREE.Group>(null),left=useRef<THREE.Group>(null),rightElbow=useRef<THREE.Group>(null),leftElbow=useRef<THREE.Group>(null),gesture=useRef({key:'',start:0}),eyes=useRef<THREE.Group>(null),mouth=useRef<THREE.Mesh>(null);const phase=useGame(s=>s.game.phase),speaking=useGame(s=>s.speaking),winner=useGame(s=>s.game.current?.winner);
 useFrame(({clock})=>{const t=clock.elapsedTime,deal=phase==='predeal'||phase==='drawing',collect=phase==='settling';if(root.current)root.current.position.y=Math.sin(t*1.7)*.013;if(head.current){head.current.rotation.y=Math.sin(t*.5)*.07;head.current.rotation.x=deal?.19:Math.sin(t*.7)*.025;}const key=`${phase}-${useGame.getState().game.visible}`;if(gesture.current.key!==key)gesture.current={key,start:t};const u=Math.min(1,(t-gesture.current.start)/.46);
 function pose(shoulder:THREE.Group|null,elbow:THREE.Group|null,side:number){if(!shoulder||!elbow)return;const rest=new THREE.Vector3(side*.5,.55,.5);let target=rest;const st=useGame.getState(),motion=st.motion;
 if(deal&&side===1&&motion){const g=st.game,player=g.player.some(c=>c.id===motion.id),index=(player?g.player:g.banker).findIndex(c=>c.id===motion.id);if(index>=0){const pose=dealPose(cardDestination(player,index),(performance.now()-motion.start)/motion.duration);target=new THREE.Vector3(...pose.wrist).sub(new THREE.Vector3(0,.46,-2.3));}}
 if(collect)target=new THREE.Vector3(side*(.6+Math.sin(t*3)*.25),.28,.92);const origin=new THREE.Vector3(side*.46,1.09,0),delta=target.sub(origin),distance=Math.min(1.425,Math.max(.05,delta.length())),direction=delta.normalize(),l1=.65,l2=.78,cos=(l1*l1+distance*distance-l2*l2)/(2*l1*distance),bend=new THREE.Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize(),upper=direction.clone().multiplyScalar(cos*l1).addScaledVector(bend,Math.sqrt(Math.max(0,1-cos*cos))*l1),lower=direction.clone().multiplyScalar(distance).sub(upper);shoulder.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),upper.normalize());lower.applyQuaternion(shoulder.quaternion.clone().invert()).normalize();elbow.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),lower);}
 pose(arm.current,rightElbow.current,1);pose(left.current,leftElbow.current,-1);
 if(eyes.current)eyes.current.scale.y=Math.sin(t*1.2)> .994?.06:1;if(mouth.current)mouth.current.scale.y=.018*(speaking?.6+useGame.getState().mouthOpen*2.5:winner==='P'?1.2:.6);});
 const skin='#e6b69e',hair='#211b23';return <group position={[0,.46,-2.3]}><group ref={root}>
 <Sphere p={[0,.72,0]} s={[.53,.7,.3]} color="#172f32"/><Sphere p={[0,.79,.275]} s={[.34,.50,.035]} color="#102c2c"/>
 <mesh position={[0,1.06,.24]} rotation={[.1,0,0]}><coneGeometry args={[.3,.58,3]}/><meshStandardMaterial color="#f6eadd"/></mesh>
 <mesh position={[0,1.07,.31]}><boxGeometry args={[.12,.13,.04]}/><meshStandardMaterial color="#bd9b55" metalness={.6} roughness={.35}/></mesh>
 <Sphere p={[0,1.42,0]} s={[.14,.22,.14]} color={skin}/><Sphere p={[-.47,1.12,0]} s={[.19,.15,.2]} color="#172f32"/><Sphere p={[.47,1.12,0]} s={[.19,.15,.2]} color="#172f32"/>
 <group ref={head} position={[0,1.83,0]}>
 <Sphere p={[0,0,-.06]} s={[.39,.48,.34]} color={hair}/><Sphere p={[0,-.01,.08]} s={[.31,.4,.28]} color={skin}/>
 <Sphere p={[.28,.24,-.15]} s={[.2,.24,.2]} color={hair}/><Sphere p={[-.15,.33,.09]} s={[.26,.14,.23]} color={hair}/><Sphere p={[.1,.38,-.02]} s={[.35,.14,.25]} color={hair}/>
 <group ref={eyes}>{[-1,1].map(i=><group key={i} position={[i*.125,.035,.323]}><Sphere p={[0,0,0]} s={[.075,.039,.018]} color="#faf3e7"/><Sphere p={[0,0,.017]} s={[.026,.03,.012]} color="#302825"/><Sphere p={[-.009,.009,.028]} s={[.008,.009,.005]} color="white"/></group>)}</group>
 <Sphere p={[0,-.055,.35]} s={[.038,.055,.045]} color="#d6a48e"/>{[-1,1].map(i=><group key={'brow'+i} position={[i*.13,.11,.34]} rotation={[0,0,i*.1]}><Sphere p={[0,0,0]} s={[.093,.014,.011]} color="#3f3030"/></group>)}
 <mesh ref={mouth} position={[0,-.17,.327]} scale={[.074,.018,.012]}><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color="#8f3d4e"/></mesh>
 {[-1,1].map(i=><Sphere key={i} p={[i*.294,-.1,.06]} s={[.022,.045,.022]} color="#e7c772"/>)}
 </group>
 {[-1,1].map(i=><group key={i} ref={i===1?arm:left} position={[i*.46,1.09,0]} rotation={[0,0,i*-.12]}><Sphere p={[0,-.325,0]} s={[.15,.37,.15]} color="#173539"/><group ref={i===1?rightElbow:leftElbow} position={[0,-.65,0]} rotation={[-1.15,0,0]}><Sphere p={[0,-.27,0]} s={[.11,.31,.11]} color={skin}/><Sphere p={[0,-.59,0]} s={[.105,.13,.052]} color={skin}/><Fingers side={i}/></group></group>)}
 </group></group>;
}