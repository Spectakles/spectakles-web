import test from 'node:test';
import assert from 'node:assert/strict';
import { MicrophonePermission } from '../src/gd-audio/devices.ts';
import { UtteranceGate } from '../src/gd-audio/utterance-gate.ts';
import { HumanCaptions } from '../src/gd-audio/captions.ts';

test('permission discovery stops every track and never records',async()=>{
 let stopped=0;const values=[];
 const probe=new MicrophonePermission(async()=>({getTracks:()=>[{stop(){stopped++;}},{stop(){stopped++;}}]}),(busy,error)=>values.push({busy,error}));
 assert.equal(await probe.request(),true);assert.equal(stopped,2);assert.equal(values.at(-1).busy,false);probe.close();
});
test('late permission after leaving releases hardware and cannot refresh old UI',async()=>{
 let resolve,stopped=0;const values=[];
 const probe=new MicrophonePermission(()=>new Promise(done=>resolve=done),(busy,error)=>values.push({busy,error}));
 const task=probe.request();probe.close();const count=values.length;
 resolve({getTracks:()=>[{stop(){stopped++;}}]});assert.equal(await task,false);assert.equal(stopped,1);assert.equal(values.length,count);
});
test('denied device permission gives actionable persistent feedback',async()=>{
 const values=[];const probe=new MicrophonePermission(async()=>{throw new DOMException('denied','NotAllowedError');},(busy,error)=>values.push({busy,error}));
 assert.equal(await probe.request(),false);assert.match(values.at(-1).error,/address-bar/);probe.close();
});
test('preparation speech is excluded through its end; next full utterance is accepted',()=>{
 const gate=new UtteranceGate();
 assert.equal(gate.accept({type:'start'},false),false);
 assert.equal(gate.accept({type:'audio'},true),false);assert.equal(gate.accept({type:'end'},true),false);
 assert.equal(gate.accept({type:'start'},true),true);
 assert.equal(gate.accept({type:'audio'},true),true);
 assert.equal(gate.accept({type:'end'},false),true);
 assert.equal(gate.accept({type:'audio'},false),false);
});
class Recognition { static current;constructor(){Recognition.current=this;}start(){}abort(){this.aborted=true;}}
test('caption toggle aborts recognition and ignores late callbacks',()=>{
 const results=[];const captions=new HumanCaptions({create:Recognition,caption:value=>results.push(value),status(){}});captions.start();
 const recognition=Recognition.current,late=recognition.onresult;
 recognition.onresult({resultIndex:0,results:[{isFinal:false,0:{transcript:'Hello'}}]});assert.equal(results.length,1);
 captions.close();late({resultIndex:0,results:[{isFinal:true,0:{transcript:'late'}}]});assert.equal(results.length,1);assert.equal(recognition.aborted,true);
});
test('recognition failures stop only display captions and report Live fallback',()=>{
 const status=[];const captions=new HumanCaptions({create:Recognition,caption(){},status:value=>status.push(value)});captions.start();Recognition.current.onerror({error:'network'});
 assert.match(status.at(-1),/Live transcription/);assert.equal(Recognition.current.aborted,true);
});
