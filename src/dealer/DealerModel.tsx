import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF,useAnimations} from '@react-three/drei';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import {Dealer} from './Dealer';
import {useGame} from '../game/store';
import type {Phase} from '../game/engine';
export type DealerAsset={url:string;scale?:number;clips:Partial<Record<Phase,string>>;mouthMorph?:string};
// Set to a licensed GLB once supplied; no third-party model is silently downloaded.
export const dealerAsset:DealerAsset|null=null;
function GLBDealer({asset}:{asset:DealerAsset}){const gltf=useGLTF(asset.url),scene=useMemo(()=>clone(gltf.scene),[gltf.scene]),group=useRef<THREE.Group>(null),{actions}=useAnimations(gltf.animations,group),phase=useGame(s=>s.game.phase);
 useEffect(()=>{const action=actions[asset.clips[phase]??'Idle'];action?.reset().fadeIn(.2).play();return()=>{action?.fadeOut(.2);};},[phase,actions,asset]);
 useFrame(()=>{const {speaking,mouthOpen}=useGame.getState();scene.traverse(object=>{const mesh=object as THREE.Mesh;if(mesh.morphTargetDictionary&&mesh.morphTargetInfluences){const i=mesh.morphTargetDictionary[asset.mouthMorph??'mouthOpen'];if(i!==undefined)mesh.morphTargetInfluences[i]=speaking?mouthOpen:0;}});});
 return <group ref={group} position={[0,.46,-2.3]} scale={asset.scale??1}><primitive object={scene}/></group>;
}
export function DealerModel({asset=dealerAsset}:{asset?:DealerAsset|null}){return asset?<GLBDealer asset={asset}/>:<Dealer/>;}
