import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GD from '../src/pages/GD';
import Workspace from '../src/pages/Workspace';
import { PlatformProvider } from '../src/platform/Platform';
import '../src/index.css';
class SyntheticRecognition {
  static current: SyntheticRecognition;
  continuous = true; interimResults = true; lang = 'en-IN';
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  constructor() { SyntheticRecognition.current = this; }
  start() {} abort() { this.onresult = null; }
}
let source: AudioBufferSourceNode | null = null;
let context: AudioContext | null = null;
let destination: MediaStreamAudioDestinationNode | null = null;
const pcmReady = fetch('/tests/fixtures/speech.pcm').then(response => response.arrayBuffer());
const controls = document.getElementById('qa-controls')!;
controls.style.cssText = 'position:sticky;top:0;z-index:9999;padding:12px;background:#30352c;color:white;display:flex;gap:12px;align-items:center';
controls.textContent = 'Synthetic microphone QA — no hardware microphone. ';
const speak = document.createElement('button'); speak.textContent = 'Speak synthetic contribution';
speak.onclick = async () => {
  const pcm = await pcmReady;
  if (!context || !destination) return;
  source?.stop(); source = context.createBufferSource();
  const samples = new Int16Array(pcm), buffer = context.createBuffer(1, samples.length, 16000);
  const channel = buffer.getChannelData(0); for(let i=0;i<samples.length;i++)channel[i]=samples[i]/32768;
  source.buffer = buffer; source.connect(destination); source.start();
  let count=0;const captionTimer=setInterval(()=>{
    SyntheticRecognition.current?.onresult?.({resultIndex:0,results:[{isFinal:false,0:{transcript:'Synthetic browser user caption.'}}]});
    if(++count===15)clearInterval(captionTimer);
  },300);
};
controls.append(speak);
const root = createRoot(document.getElementById('root')!);
root.render(<MemoryRouter initialEntries={['/workspace']}><PlatformProvider><Routes><Route path="/workspace" element={<Workspace />} /><Route path="/gd/dev" element={<GD recognitionCreate={SyntheticRecognition} acquireStream={async () => {
  context = new AudioContext({sampleRate:48000});await context.resume();
  destination = context.createMediaStreamDestination();
  const stream = destination.stream;
  const track = stream.getAudioTracks()[0];
  const ownContext = context, stop = track.stop.bind(track);
  track.stop = () => { stop(); void ownContext.close(); };
  return stream;
}} />} /></Routes></PlatformProvider></MemoryRouter>);
