import {useEffect,useState} from 'react';
import {useShallow} from 'zustand/react/shallow';
import {Scene,SqueezeView} from './scene/Scene';
import {useGame,hydrate} from './game/store';
import {Controller} from './game/Controller';
import * as E from './game/engine';
import {points,type Bet} from './rules/baccarat';
import {Roads} from './ui/Roads';
import {speak,fx,unlock,ambient} from './audio/audio';
const names:Record<Bet,string>={P:'闲',B:'庄',T:'和',PP:'闲对',BP:'庄对',D7:'七龙'};
const format=(v:number)=>(v/100).toLocaleString('zh-CN',{maximumFractionDigits:2});
const phases={betting:'请选择筹码，在桌面下注',closing:'停止下注',dealing:'荷官发牌中',squeezing:'按住牌角慢慢揭开',drawing:'按规则补牌',result:'双方开牌',settling:'正在结算筹码',complete:'本局已结算'};
function App(){const {game:g,settings:s,dispatch,ready,selected,configure,bet,storageError,subtitle}=useGame(useShallow(s=>({game:s.game,settings:s.settings,dispatch:s.dispatch,ready:s.ready,selected:s.selected,configure:s.configure,bet:s.bet,storageError:s.storageError,subtitle:s.subtitle}))),[modal,setModal]=useState<'settings'|'roads'|'history'|null>(null),[focus,setFocus]=useState(false),[entered,setEntered]=useState(false),[notice,setNotice]=useState('');useEffect(()=>{void hydrate();},[]);useEffect(()=>{if(focus&&g.phase==='complete')setFocus(false);},[g.phase]);
 const start=()=>{unlock();ambient();setEntered(true);speak('欢迎来到澳门百家乐。各位请下注。');};
 const pending=E.ordered(g).filter(c=>!g.revealed.includes(c.id));
 const begin=()=>{unlock();if(!E.total(g.bets)){setNotice('请先在任一投注区放入筹码');return;}setNotice('');dispatch(E.begin);};
 const add=(b:Bet)=>{unlock();if(g.balance<selected*100)setNotice('虚拟筹码余额不足');else {bet(b);fx('chip');setNotice('');}};
 const onDrop=(event:React.DragEvent,b:Bet)=>{event.preventDefault();add(b);};
 const canBet=g.phase==='betting';
 return <main className="app"><Controller/><Scene/>
 <header className="topbar"><a className="brand" href="#" onClick={e=>e.preventDefault()}><span className="brand-seal">翡</span><div>澳 門 百 家 樂<small>MACAU · THE JADE ROOM</small></div></a><span className="table-id">翡翠厅 / 08号桌 <i/> 虚拟筹码娱乐</span><div className="top-actions"><button onClick={()=>setModal('history')} aria-label="历史记录">牌局记录</button><button onClick={()=>setModal('settings')} aria-label="设置">设置 ⚙</button></div></header>
 <div className="roads-position"><Roads compact onClick={()=>setModal('roads')}/></div>
 <aside className="wallet glass"><span>可用虚拟筹码</span><strong>{format(g.balance)}</strong><div>累计盈亏 <b className={g.history.reduce((a,h)=>a+h.net,0)>=0?'green':'red'}>{format(g.history.reduce((a,h)=>a+h.net,0))}</b></div><small>8副牌 · 余 {g.shoe.cards.length-g.shoe.cursor} 张</small></aside>
 <div className="dealer-name"><span>荷官 · 小雅</span><small>实时 3D · 中文播报</small></div>
 <section className="hand-labels">{(['P','B'] as const).map(side=>{const cards=side==='P'?g.player:g.banker,shown=cards.length>=2&&cards.every(c=>g.revealed.includes(c.id));return <div key={side} className={side==='P'?'blue':'red'}><span>{names[side]} 家</span><b>{shown?`${points(cards)} 点`:'—'}</b><small>{cards.map(c=>g.revealed.includes(c.id)?`${['','A','2','3','4','5','6','7','8','9','10','J','Q','K'][c.rank]}${['♠','♥','♣','♦'][c.suit]}`:'▧').join('  ')}</small></div>;})}</section>
 {s.subtitles&&<div className="subtitle">{subtitle}</div>}
 {(g.phase==='result'||g.phase==='settling'||g.phase==='complete')&&g.current&&<div className={`result-banner ${g.current.winner==='P'?'player':g.current.winner==='B'?'banker':'tie'}`}><small>{g.current.dragon?'DRAGON 7':g.current.natural?'NATURAL':'ROUND RESULT'}</small><strong>{names[g.current.winner]}{g.current.winner==='T'?'局':'赢'}</strong><span>本局净盈亏 {g.current.net>0?'+':''}{format(g.current.net)}</span></div>}
 <section className="game-controls"><div className="status-row"><span><i className={canBet?'live-dot':'busy-dot'}/>{phases[g.phase]}</span><span>{g.mode==='commission'?'标准 · 庄赢5%佣金':g.mode==='super6'?'免佣 · 庄六半赔':'七龙免佣 · 七龙庄注退本'}</span></div>
 <div className="bets">{(['PP','P','T','B','BP','D7'] as Bet[]).map(b=><button key={b} className={`bet bet-${b} ${g.bets[b]?'has-bet':''}`} disabled={!canBet} onClick={()=>add(b)} onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,b)}><small>{b==='D7'?'DRAGON 7':b==='PP'||b==='BP'?'PAIR':b==='P'?'PLAYER':b==='B'?'BANKER':'TIE'}</small><strong>{names[b]}</strong><span>{b==='B'?(g.mode==='commission'?'0.95 : 1':g.mode==='super6'?'1 : 1 / 六点半赔':'1 : 1 / 七龙退本'):b==='P'?'1 : 1':b==='T'?'8 : 1':b==='D7'?'40 : 1':'11 : 1'}</span>{g.bets[b]>0&&<em>{format(g.bets[b])}</em>}</button>)}</div>
 <div className="bottom-row"><div className="chip-rack">{[10,50,100,500,1000,5000,10000].map((n,i)=><button key={n} draggable disabled={!canBet} aria-label={`选择${n}筹码`} onDragStart={()=>useGame.setState({selected:n})} onClick={()=>{unlock();useGame.setState({selected:n});fx('chip');}} className={`chip chip-${i} ${selected===n?'selected':''}`}><span>{n>=1000?`${n/1000}K`:n}</span></button>)}</div><div className="utility"><button disabled={!canBet||!g.undo.length} onClick={()=>dispatch(E.undo)}>撤销</button><button disabled={!canBet||!E.total(g.bets)} onClick={()=>dispatch(E.clear)}>清除</button><button disabled={!canBet||!E.total(g.previous)} onClick={()=>dispatch(E.repeat)}>重复</button></div><div className="main-action">{g.phase==='complete'?<button className="gold-button" onClick={()=>dispatch(E.next)}>下一局 →</button>:g.phase==='squeezing'?<><button className="gold-button" onClick={()=>setFocus(true)}>指尖咪牌 ↗</button><button className="skip" onClick={()=>dispatch(x=>x.phase==='squeezing'?({...x,revealed:E.ordered(x).map(c=>c.id)}):x)}>直接开牌</button></>:<button className="gold-button" disabled={!canBet||!ready} onClick={begin}>{canBet?'停止下注 · 发牌':'牌局进行中'}</button>}</div></div>
 <footer><span>{notice||storageError||`本局下注 ${format(E.total(g.bets))} · 最低10虚拟筹码`}</span><span>仅供娱乐与规则模拟 · 无充值或兑换</span></footer></section>
 {(!entered||!ready)&&<div className="entry"><div className="entry-card"><div className="entry-emblem">翡</div><small>THE JADE ROOM</small><h1>澳门百家乐</h1><p>一张牌桌，一场指尖的悬念。</p><div className="entry-features"><span>实时3D荷官</span><span>慢速弯牌</span><span>完整路单</span></div><button className="gold-button" disabled={!ready} onClick={start}>{ready?'入座 · 开始游玩':'正在恢复牌局…'}</button><p className="entry-note">初始100,000虚拟筹码 · 不支持真钱、充值、提现或兑换<br/>建议横屏游玩 · 首次入座后启用声音</p></div></div>}
 {focus&&<SqueezeView onClose={()=>setFocus(false)}/>}
 {modal&&<div className="modal-backdrop" onClick={()=>setModal(null)}><section className={`modal modal-${modal}`} onClick={e=>e.stopPropagation()}><div className="modal-head"><h2>{modal==='roads'?'整靴专业路单':modal==='history'?'历史牌局':'牌桌设置'}</h2><button onClick={()=>setModal(null)}>关闭 ×</button></div>
 {modal==='roads'&&<><Roads/><p>下三路红蓝反映大路结构，并非庄闲输赢。可横向滑动查看。</p><button disabled={!canBet} onClick={()=>{dispatch(E.changeShoe);setModal(null);}}>重新开靴（当前下注退回）</button></>}
 {modal==='settings'&&<><label className="setting">结算规则<select value={g.mode} disabled={!canBet} onChange={e=>useGame.getState().setMode(e.target.value as typeof g.mode)}><option value="commission">标准5%佣金百家乐</option><option value="super6">免佣百家乐 · 庄六半赔</option><option value="dragon">七龙免佣 · 庄七龙退本</option></select></label><p>模式只能在等待下注时切换。七龙边注在三种模式下均为净赔40:1。</p>
 <label className="setting">自动开牌<input type="checkbox" checked={s.auto} onChange={e=>configure({auto:e.target.checked})}/></label><label className="setting">中文字幕<input type="checkbox" checked={s.subtitles} onChange={e=>configure({subtitles:e.target.checked})}/></label>
 {(['voice','effects','ambient'] as const).map(k=><label className="setting" key={k}>{k==='voice'?'荷官语音':k==='effects'?'操作音效':'环境底噪'}<input type="range" min="0" max="1" step=".05" value={s[k]} onChange={e=>{unlock();configure({[k]:+e.target.value});}}/></label>)}
 <label className="setting">渲染质量<select value={s.quality} onChange={e=>configure({quality:e.target.value as 'low'|'high'})}><option value="low">流畅优先 · 手机推荐</option><option value="high">高清 · 实时阴影</option></select></label><p>中文音色取决于设备已安装语音。当前荷官为程序化关节模型，音效为实时合成。</p></>}
 {modal==='history'&&<><p>共 {g.history.length} 局 · 记录保存在当前浏览器</p><div className="history-scroll"><table><thead><tr><th>时间</th><th>闲 / 庄</th><th>结果</th><th>下注</th><th>净盈亏</th></tr></thead><tbody>{g.history.slice().reverse().map(h=><tr key={h.id}><td>{new Date(h.time).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</td><td>{h.p} / {h.b}</td><td>{names[h.winner]}{h.pp?' · 闲对':''}{h.bp?' · 庄对':''}{h.dragon?' · 七龙':''}</td><td>{format(E.total(h.bets))}</td><td className={h.net>=0?'green':'red'}>{format(h.net)}</td></tr>)}</tbody></table>{!g.history.length&&<p>完成首局后，结果会显示在这里。</p>}</div></>}
 </section></div>}
 </main>;
}
export default App;
