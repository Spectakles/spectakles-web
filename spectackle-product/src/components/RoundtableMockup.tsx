import { useEffect, useRef, useState } from 'react';

export default function RoundtableMockup() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setScale(entry.contentRect.width / 1120);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full relative rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl border border-gray-800 bg-[#262432] ring-1 ring-white/10" 
      style={{ aspectRatio: '1120/944' }}
    >
      <style>{`
        /* Custom Squircle / Smooth Corners */
        .squircle {
          border-radius: 28px;
        }
        /* Custom Circular Table Shadow & Border */
        .round-table-disc {
          background: radial-gradient(circle, #2d2b3a 0%, #1f1d2b 100%);
          box-shadow: 0 0 60px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        /* Smooth Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(230, 157, 67, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(230, 157, 67, 0); }
          100% { box-shadow: 0 0 0 0 rgba(230, 157, 67, 0); }
        }
        @keyframes talk-bar {
          0%, 100% { height: 95%; }
          50% { height: 75%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out infinite 3s; }
        .animate-speak-ring { animation: pulse-ring 2s infinite; }
        .animate-talk-bar { animation: talk-bar 1.5s infinite; }
      `}</style>
      
      <div 
        className="absolute top-0 left-0 w-[1120px] h-[944px] origin-top-left flex flex-col justify-start select-none transition-opacity duration-300" 
        style={{ 
          transform: scale ? `scale(${scale})` : 'scale(1)',
          opacity: scale === null ? 0 : 1
        }}
      >
        {/* Premium Browser Chrome */}
        <div className="w-full h-10 bg-[#1e1d27] border-b border-white/5 flex items-center px-4 z-50 flex-shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="mx-auto bg-black/20 rounded-md px-3 py-1 text-[10px] text-white/30 font-medium font-mono">
            app.Spectakles.com/room/live
          </div>
        </div>
        
        <div className="flex-1 flex flex-col h-[904px]">
          
{/* BEGIN: TopBar */}
<header className="w-full h-16 px-6 flex items-center justify-between border-b border-white/5 z-20" data-purpose="top-navigation-bar">
{/* Left: Branding & Session Status */}
<div className="flex items-center space-x-3">
<div className="w-9 h-9 rounded-full bg-[#3FB950] flex items-center justify-center font-bold text-white shadow-sm">
        R
      </div>
<span className="text-base font-semibold tracking-wide text-white">Roundtable • Live</span>
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EA4335] text-white shadow-sm">
<span className="w-1.5 h-1.5 mr-1.5 bg-white rounded-full animate-pulse"></span>
        REC
      </span>
</div>
{/* Center: Captions Switcher */}
<div>
<button aria-label="Toggle Captions" className="inline-flex items-center space-x-2 bg-[#333041] hover:bg-[#3d3a4d] text-white/90 text-sm font-medium px-4 py-2 rounded-xl transition border border-white/10 shadow-sm" type="button">
<svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>
<span>Captions: On</span>
<svg className="w-3.5 h-3.5 text-white/60 ml-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
<path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>
</button>
</div>
{/* Right: End Session Button */}
<div>
<button className="bg-[#F06543] hover:bg-[#de5534] text-white font-medium text-sm px-6 py-2 rounded-full transition shadow-md font-medium" type="button">
        End session
      </button>
</div>
</header>
{/* END: TopBar */}
{/* BEGIN: MainContentArea */}
<div className="flex-1 flex flex-row overflow-hidden relative" data-purpose="main-layout-container">
{/* BEGIN: SpatialRoundtableRoom */}
<div className="flex-1 relative flex flex-col items-center justify-center p-4 h-full" data-purpose="discussion-spatial-canvas">
{/* Central Spatial Circle Container */}
<div className="relative w-[600px] h-[580px] flex items-center justify-center">
{/* Center Virtual Table Disc */}
<div className="round-table-disc w-[280px] h-[280px] rounded-full flex flex-col items-center justify-center text-center p-4 pt-8 z-10">
<span className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-1">TOPIC</span>
<h2 className="text-sm font-semibold text-white/95 leading-snug px-3 max-w-[210px] mb-3">
            Should AI replace freshers in IT?
          </h2>
<div className="text-3xl font-extrabold tracking-tight text-white mb-0.5">
            05:32
          </div>
<span className="text-[11px] text-white/45 font-medium mb-3">left of 8:00</span>
{/* 4-Segment Progress Bar */}
<div className="flex items-center space-x-1.5" data-purpose="progress-segmented-indicator">
<span className="w-6 h-1.5 rounded-full bg-[#E59838]"></span>
<span className="w-6 h-1.5 rounded-full bg-[#EF6545]"></span>
<span className="w-6 h-1.5 rounded-full bg-[#3FB950]"></span>
<span className="w-6 h-1.5 rounded-full bg-white/20"></span>
</div>
</div>
{/* AI Persona 1: Ira (Top Center) */}
<div className="absolute -top-12 flex flex-col items-center z-10 animate-float" data-purpose="persona-ira">
<div className="squircle w-[88px] h-[88px] bg-[#FCE588] text-[#1F1D2B] font-bold text-3xl flex items-center justify-center shadow-lg border-2 border-[#FCE588]">
            I
          </div>
<span className="text-sm font-bold text-white mt-2">Ira</span>
<span className="text-xs text-white/50">The Questioner</span>
</div>
{/* AI Persona 2: Kabir (Top Right - Currently Speaking) */}
<div className="absolute top-[82px] -right-16 flex flex-col items-center z-20 animate-float-delayed" data-purpose="persona-kabir">
<div className="relative">
{/* Active speaking squircle avatar with border */}
<div className="squircle w-[92px] h-[92px] bg-[#BFE5FD] text-[#1E293B] font-bold text-3xl flex items-center justify-center shadow-xl animate-speak-ring border-4 border-[#E69D43]">
              K
            </div>
{/* Speaking status pill badge */}
<div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#E69D43] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full tracking-wider flex items-center space-x-1 shadow-md uppercase whitespace-nowrap">
<svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
<path clipRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" fillRule="evenodd"></path>
</svg>
<span>SPEAKING</span>
</div>
</div>
<span className="text-sm font-bold text-white mt-4">Kabir</span>
<span className="text-xs text-white/50">The Challenger</span>
</div>
{/* AI Persona 3: Dev (Bottom Right) */}
<div className="absolute bottom-[20px] -right-10 flex flex-col items-center z-10 animate-float" data-purpose="persona-dev">
<div className="squircle w-[88px] h-[88px] bg-[#D7D5FC] text-[#1E293B] font-bold text-3xl flex items-center justify-center shadow-lg border border-white/10">
            D
          </div>
<span className="text-sm font-bold text-white mt-2">Dev</span>
<span className="text-xs text-white/50">The Peacemaker</span>
</div>
{/* AI Persona 4: Zara (Bottom Left) */}
<div className="absolute bottom-[20px] -left-10 flex flex-col items-center z-10 animate-float-delayed" data-purpose="persona-zara">
<div className="squircle w-[88px] h-[88px] bg-[#D1F2D9] text-[#1E293B] font-bold text-3xl flex items-center justify-center shadow-lg border border-white/10">
            Z
          </div>
<span className="text-sm font-bold text-white mt-2">Zara</span>
<span className="text-xs text-white/50">The Analyst</span>
</div>
{/* AI Persona 5: Maya (Mid Left) */}
<div className="absolute top-[82px] -left-16 flex flex-col items-center z-10 animate-float" data-purpose="persona-maya">
<div className="squircle w-[88px] h-[88px] bg-[#FDD9CD] text-[#1E293B] font-bold text-3xl flex items-center justify-center shadow-lg border border-white/10">
            M
          </div>
<span className="text-sm font-bold text-white mt-2">Maya</span>
<span className="text-xs text-white/50">The Optimist</span>
</div>
</div>
{/* User Seat & Self Controls (Bottom-center overlay) */}
<div className="relative -mt-6 flex flex-col items-center z-20" data-purpose="user-seat-controls">
{/* Self Avatar (A) */}
<div className="squircle w-20 h-20 bg-[#EF6545] text-white font-bold text-2xl flex items-center justify-center shadow-xl border-2 border-white/20">
          A
        </div>
{/* Tap to unmute status bar */}
<button className="mt-2 bg-white text-[#1F1D2B] text-xs font-bold px-4 py-1.5 rounded-full shadow-md hover:bg-slate-100 transition flex items-center space-x-1" type="button">
<span>You • Tap to unmute</span>
</button>
{/* User Quick Mic/Cam Control Pills */}
<div className="flex items-center space-x-2 mt-2.5">
<button aria-label="Microphone muted" className="w-9 h-9 rounded-full bg-[#393649] hover:bg-[#48445c] text-white/80 flex items-center justify-center transition border border-white/10" type="button">
{/* Mute Icon */}
<svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M19 19L5 5m14 0l-3.5 3.5M9.88 9.88A3 3 0 1014.12 14.12M12 17v4m-4 0h8M19 10v1a7 7 0 01-11.95 4.95" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>
</button>
<button aria-label="Raise hand" className="w-9 h-9 rounded-full bg-[#393649] hover:bg-[#48445c] text-white/80 flex items-center justify-center transition border border-white/10" type="button">
{/* Hand Icon */}
<svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V4a1.5 1.5 0 013 0v4m0 0v-1a1.5 1.5 0 013 0v3" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>
</button>
<button aria-label="Chat and comments" className="w-9 h-9 rounded-full bg-[#393649] hover:bg-[#48445c] text-white/80 flex items-center justify-center transition border border-white/10" type="button">
{/* Chat Icon */}
<svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"></path>
</svg>
</button>
</div>
</div>
{/* Live Speech Caption Pill Card */}
<div className="w-full max-w-4xl mt-6 z-20" data-purpose="live-caption-transcript">
<div className="bg-[#FFFDF4] rounded-2xl px-5 py-3.5 text-[#1F1D2B] flex items-center space-x-3 shadow-xl border border-black/5">
<div className="w-7 h-7 rounded-lg bg-[#DCEFFA] text-[#1E293B] font-bold text-xs flex items-center justify-center flex-shrink-0">
            K
          </div>
<p className="text-sm font-medium tracking-tight text-[#222129]">
<strong className="font-bold">Kabir:</strong> “But if AI writes the boilerplate, freshers can focus on design thinking — isn't that an upgrade?”
          </p>
</div>
</div>
</div>
{/* END: SpatialRoundtableRoom */}
{/* BEGIN: CoachingTelemetrySidebar */}
<aside className="w-[340px] bg-[#FFFBF0] text-[#1E1C26] p-6 flex flex-col justify-between border-l border-black/5 shadow-2xl flex-shrink-0" data-purpose="live-coaching-sidebar">
{/* Top Section: Metrics and Nudge */}
<div className="space-y-6">
{/* Section: Talk-time arc */}
<section data-purpose="talk-time-distribution">
<h3 className="text-base font-bold text-[#1E1C26] mb-4">Talk-time arc</h3>
{/* Bar Chart Visualization */}
<div className="h-20 flex items-end justify-between px-2 pb-1 border-b border-black/5">
{/* Persona Maya */}
<div className="w-5 bg-[#E8DEC8] rounded-md h-[40%]"></div>
{/* Persona Ira */}
<div className="w-5 bg-[#E8DEC8] rounded-md h-[65%]"></div>
{/* Persona Dev */}
<div className="w-5 bg-[#E8DEC8] rounded-md h-[50%]"></div>
{/* Persona Kabir (Active - High) */}
<div className="w-5 bg-[#EF6545] rounded-md h-[95%] animate-talk-bar"></div>
{/* Persona Zara */}
<div className="w-5 bg-[#E8DEC8] rounded-md h-[30%]"></div>
{/* User (You) - Goal target achieved */}
<div className="w-5 bg-[#3FB950] rounded-md h-[80%]"></div>
{/* Benchmark 1 */}
<div className="w-5 bg-[#E8DEC8] rounded-md h-[48%]"></div>
{/* Benchmark 2 */}
<div className="w-5 bg-[#E8DEC8] rounded-md h-[35%]"></div>
</div>
{/* Talk time metrics and prompt */}
<div className="flex justify-between items-center text-xs mt-2 font-medium">
<span className="text-[#3B3A42]">You 18% • <span className="text-[#2F855A] font-semibold">jump in!</span></span>
<span className="text-gray-500 font-semibold">Goal 20%+</span>
</div>
</section>
{/* Section: Coach Nudge Alert Box */}
<section className="bg-[#D8F3DC] rounded-2xl p-4 border border-[#B7E4C7]" data-purpose="coach-feedback-card">
<div className="flex items-center space-x-1.5 text-xs font-black uppercase text-[#1B4332] tracking-wider mb-1.5">
{/* Lightbulb icon */}
<svg className="w-4 h-4 text-[#1B4332]" fill="currentColor" viewBox="0 0 20 20">
<path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14H8a4 4 0 01-.8-7.92 4.004 4.004 0 017.6 0A4 4 0 0112 14z"></path>
</svg>
<span>COACH NUDGE</span>
</div>
<p className="text-xs text-[#2D3748] leading-relaxed font-medium">
            Great listening! Now disagree politely: “I see it differently because...”
          </p>
</section>
{/* Section: Quick Actions Grid */}
<section data-purpose="quick-session-actions">
<h4 className="text-sm font-bold text-[#1E1C26] mb-3">Quick actions</h4>
<div className="grid grid-cols-2 gap-2.5">
{/* Action 1: Raise Hand */}
<button className="bg-[#2D2A38] hover:bg-[#3D3A4B] text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition shadow-sm flex items-center justify-center" type="button">
              Raise hand
            </button>
{/* Action 2: Ask for cue */}
<button className="bg-transparent hover:bg-black/5 text-[#2D2A38] border border-[#DDD5C7] text-xs font-semibold py-2.5 px-3 rounded-xl transition flex items-center justify-center" type="button">
              Ask for cue
            </button>
{/* Action 3: Pause AI */}
<button className="bg-transparent hover:bg-black/5 text-[#2D2A38] border border-[#DDD5C7] text-xs font-semibold py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1" type="button">
<span className="text-[10px]">⏸</span>
<span>Pause AI</span>
</button>
{/* Action 4: My notes */}
<button className="bg-transparent hover:bg-black/5 text-[#2D2A38] border border-[#DDD5C7] text-xs font-semibold py-2.5 px-3 rounded-xl transition flex items-center justify-center" type="button">
              My notes
            </button>
</div>
</section>
</div>
{/* Bottom Advisory Tip */}
<footer className="bg-[#FDECEF] rounded-2xl p-3.5 text-center border border-[#F9D0D8]" data-purpose="camera-etiquette-tip">
<p className="text-xs font-medium text-[#7A404F] leading-snug">
          Tip: look at the camera, smile, and name someone to invite them in.
        </p>
</footer>
</aside>
{/* END: CoachingTelemetrySidebar */}
</div>
{/* END: MainContentArea */}
</div>
      </div>
    </div>
  );
}
