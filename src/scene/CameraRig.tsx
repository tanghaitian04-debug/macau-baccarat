import {useFrame,useThree} from '@react-three/fiber';
import {useGame} from '../game/store';
import {cardDestination} from '../dealer/choreography';
import * as THREE from 'three';
const normal=new THREE.Vector3(0,5.5,7.8),look=new THREE.Vector3();
export function CameraRig(){const {camera}=useThree();useFrame((_,dt)=>{const s=useGame.getState(),g=s.game,id=s.focusCard,card=id?[...g.player,...g.banker].find(c=>c.id===id):null;let target=new THREE.Vector3(0,.55,-.25),position=normal;if(card){const isP=g.player.some(c=>c.id===id),index=(isP?g.player:g.banker).findIndex(c=>c.id===id),p=cardDestination(isP,index);target=new THREE.Vector3(...p);position=new THREE.Vector3(p[0],3.0,p[2]+.15);}camera.position.lerp(position,1-Math.exp(-dt*7));look.lerp(target,1-Math.exp(-dt*8));camera.lookAt(look);});return null;}
