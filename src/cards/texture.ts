import * as THREE from 'three';
import type {Card} from '../rules/baccarat';
import {PIP_LAYOUTS,type CardFaceMode} from './layout';
const cache=new Map<string,THREE.CanvasTexture>();
// Original, double-ended court artwork, drawn locally. No external assets or network fonts.
function court(x:CanvasRenderingContext2D,rank:number,suit:string,color:string){
 x.save();x.translate(192,280);x.strokeStyle=color;x.lineWidth=2;x.fillStyle='#eed8a7';x.fillRect(-100,-162,200,324);x.strokeRect(-100,-162,200,324);
 for(let half=0;half<2;half++){x.save();x.rotate(half*Math.PI);x.beginPath();x.rect(-99,-161,198,161);x.clip();
 x.fillStyle=rank===12?'#963a52':'#274d73';x.beginPath();x.moveTo(-96,0);x.lineTo(-77,-87);x.lineTo(-26,-112);x.lineTo(38,-112);x.lineTo(85,-56);x.lineTo(96,0);x.closePath();x.fill();
 x.fillStyle='#dfb455';for(let i=-80;i<90;i+=24){x.fillRect(i,-49,10,48);}x.strokeStyle='#f5df98';x.beginPath();x.moveTo(-65,-72);x.lineTo(75,0);x.moveTo(-65,-50);x.lineTo(45,0);x.stroke();
 x.fillStyle='#f0c6a2';x.beginPath();x.ellipse(0,-114,28,36,0,0,Math.PI*2);x.fill();x.strokeStyle='#493027';x.beginPath();x.moveTo(-20,-130);x.lineTo(-10,-135);x.moveTo(7,-135);x.lineTo(19,-130);x.moveTo(0,-128);x.lineTo(-4,-110);x.lineTo(3,-108);x.moveTo(-9,-98);x.lineTo(10,-98);x.stroke();x.fillStyle='#302722';x.fillRect(-15,-128,4,3);x.fillRect(10,-128,4,3);
 x.fillStyle='#4c3028';x.beginPath();x.moveTo(-28,-139);x.quadraticCurveTo(0,-166,29,-138);x.lineTo(25,-150);x.lineTo(-25,-150);x.fill();
 if(rank!==11){x.fillStyle='#e6b747';x.beginPath();x.moveTo(-30,-145);x.lineTo(-34,-159);x.lineTo(-15,-151);x.lineTo(0,-170);x.lineTo(15,-151);x.lineTo(34,-159);x.lineTo(30,-145);x.closePath();x.fill();}
 else{x.fillStyle='#a3353d';x.beginPath();x.moveTo(-33,-146);x.quadraticCurveTo(0,-172,35,-150);x.lineTo(23,-139);x.fill();}
 if(rank===13){x.fillStyle='#533a2a';x.beginPath();x.moveTo(-20,-97);x.lineTo(0,-75);x.lineTo(20,-97);x.fill();}
 x.strokeStyle='#bd8f38';x.lineWidth=5;x.beginPath();x.moveTo(65,-10);x.lineTo(65,-133);x.stroke();x.fillStyle=color;x.font='28px serif';x.textAlign='center';x.fillText(suit,-66,-111);x.restore();}
 x.restore();
}
export function cardTexture(card?:Card,mode:CardFaceMode='macau'){
 const key=card?`${card.rank}-${card.suit}-${mode}`:'back';if(cache.has(key))return cache.get(key)!;
 const c=document.createElement('canvas');c.width=768;c.height=1120;const x=c.getContext('2d')!;x.scale(2,2);x.fillStyle=card?'#fffdf4':'#143c40';x.fillRect(0,0,384,560);x.strokeStyle=card?'#d6c7a7':'#d6b96f';x.lineWidth=card?2:8;x.strokeRect(12,12,360,536);
 if(!card){x.lineWidth=1;x.globalAlpha=.6;for(let i=-550;i<500;i+=18){x.beginPath();x.moveTo(i,0);x.lineTo(i+560,560);x.stroke();x.beginPath();x.moveTo(i+560,0);x.lineTo(i,560);x.stroke();}x.globalAlpha=1;x.fillStyle='#163a3d';x.fillRect(90,220,204,120);x.fillStyle='#dfc282';x.font='bold 32px serif';x.textAlign='center';x.fillText('翡翠厅',192,290);}
 else{const suit=['♠','♥','♣','♦'][card.suit],rank=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][card.rank],color=card.suit===1||card.suit===3?'#ad2943':'#162e31';x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';
 if(mode==='standard'){for(let i=0;i<2;i++){x.save();if(i){x.translate(384,560);x.rotate(Math.PI);}x.font='bold 40px Georgia';x.fillText(rank,38,46);x.font='32px serif';x.fillText(suit,38,85);x.restore();}}
 if(card.rank>10)court(x,card.rank,suit,color);else{for(const [u,v] of PIP_LAYOUTS[card.rank]){x.save();x.translate(u*384,v*560);if(v>.5)x.rotate(Math.PI);x.font=`${card.rank===1?100:58}px serif`;x.fillText(suit,0,0);x.restore();}}
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;cache.set(key,t);return t;
}
export function labelTexture(text:string,color='#e4cc92'){const key=`${text}-${color}`;if(cache.has(key))return cache.get(key)!;const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d')!;x.fillStyle=color;x.font='36px Georgia, serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;cache.set(key,t);return t;}
