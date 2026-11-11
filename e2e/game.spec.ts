import {test,expect,type Page} from '@playwright/test';
import type {Game} from '../src/game/engine';
const snapshot=(page:Page)=>page.evaluate(()=>((window as unknown as {__baccaratSnapshot:()=>Game}).__baccaratSnapshot)());
async function boot(page:Page){await page.goto('/');await page.getByRole('button',{name:'入座 · 开始游玩'}).waitFor();await page.getByRole('button',{name:'设置',exact:true}).click({force:true}).catch(()=>{});}
async function enter(page:Page){await page.goto('/');await page.getByRole('button',{name:'入座 · 开始游玩'}).waitFor();
 // Disable voice via the UI after entering; animation speed remains standard so sequential steps are observable.
 await page.getByRole('button',{name:'入座 · 开始游玩'}).click();await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByLabel('荷官语音',{exact:true}).press('Home');await page.getByRole('button',{name:'关闭 ×',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).phase,{timeout:20000}).toBe('betting');}
test('predeal, side permissions, table opponent flip, settle and reload',async({page})=>{
 await enter(page);const before=await snapshot(page);expect(before.visible).toBe(4);expect(before.revealed).toEqual([]);expect(before.player).toHaveLength(2);expect(before.banker).toHaveLength(2);
 await page.locator('.bet-B').click();await expect(page.locator('.bet-P')).toBeDisabled();await page.getByRole('button',{name:'停止下注 · 开始开牌',exact:true}).click();await page.getByRole('button',{name:/闲家先开牌/}).click();await page.getByRole('button',{name:/开始咪庄牌/}).waitFor();const after=await snapshot(page);expect(after.revealed).toEqual(after.player.map(c=>c.id));expect(after.player).toEqual(before.player);expect(after.banker).toEqual(before.banker);
 await page.getByRole('button',{name:/开始咪庄牌/}).click();await expect(page.getByText('庄家咪牌',{exact:false})).toBeVisible();await page.getByRole('button',{name:'返回桌面',exact:true}).click();expect((await snapshot(page)).phase).toBe('squeezing');await expect(page.getByRole('button',{name:/下一局 ·/})).toHaveCount(0);
 // Auto mode finishes remaining owned cards, including a possible third card.
 await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByLabel('自动开牌',{exact:true}).check();await page.getByRole('button',{name:'关闭 ×',exact:true}).click();await expect.poll(async()=>(await snapshot(page)).phase,{timeout:25000}).toBe('complete');const done=await snapshot(page);expect(done.history).toHaveLength(1);expect(done.balance).toBe(10000000-10000+done.current!.paid);
 await page.reload();await expect.poll(async()=>(await snapshot(page)).history.length).toBe(1);expect((await snapshot(page)).balance).toBe(done.balance);
});
test('lucky panel places actual independent bets and exposes all 7 variants',async({page})=>{await enter(page);await page.getByRole('button',{name:/幸运侧注/}).click();const items=page.locator('.lucky-item');await expect(items).toHaveCount(8);await items.nth(0).getByRole('button').click();await items.nth(2).getByRole('button').click();const g=await snapshot(page);expect(g.bets.L6).toBe(10000);expect(g.bets.S6).toBe(10000);expect(g.balance).toBe(9980000);});
test('available WebGL renderer mounts a live canvas without fatal application errors',async({page},info)=>{const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);const canvas=page.locator('.scene canvas');const exists=await canvas.count();if(!exists){test.skip(true,`${info.project.name}: environment has no WebGL; fallback is explicit`);return;}expect(await canvas.evaluate(e=>{const c=e as HTMLCanvasElement;return !!(c.getContext('webgl2')||c.getContext('webgl'));})).toBe(true);expect(errors).toEqual([]);});

test('four real pointer directions deform the owned card without revealing or scrolling on release',async({page})=>{
 await enter(page);if(!await page.locator('.scene canvas').count()){test.skip(true,'WebGL unavailable for pointer mesh QA');return;}
 await page.locator('.bet-P').click();await page.getByRole('button',{name:'停止下注 · 开始开牌',exact:true}).click();await page.getByRole('button',{name:/庄家先开牌/}).click();await page.getByRole('button',{name:/开始咪闲牌/}).click();await page.getByText('闲家咪牌',{exact:false}).waitFor();
 const before=await snapshot(page);const canvas=page.locator('.scene canvas'),box=(await canvas.boundingBox())!;const x=box.x+box.width/2,y=box.y+box.height/2;
 // Wait on an actual rendered transition rather than replacing the app's game state.
 await expect(page.locator('.peel-meter b')).toHaveText('0%');
 for(const [dx,dy]of [[0,-90],[0,90],[-90,0],[90,0]]){await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:16});await expect(page.locator('.peel-meter b')).not.toHaveText('0%');await page.mouse.up();await expect(page.locator('.peel-meter b')).toHaveText('0%');expect((await snapshot(page)).revealed).toEqual(before.revealed);expect(await page.evaluate(()=>window.scrollY)).toBe(0);}
});
