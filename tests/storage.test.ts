import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {saveSession,loadSession} from '../src/storage/history';
import * as E from '../src/game/engine';
it('IndexedDB round-trip retains history, balance, shoe and reveal state',async()=>{let g=E.begin(E.place(E.initial(),'B',10000));for(let i=0;i<30&&g.phase!=='complete';i++){if(g.phase==='squeezing')for(const c of E.ordered(g))g=E.reveal(g,c.id);g=E.advance(g);}await saveSession({game:g});const s=await loadSession<{game:E.Game}>();expect(s!.game).toEqual(g);expect(s!.game.history).toHaveLength(1);});
