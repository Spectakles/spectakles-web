"use client";

export default function RoundtableHero() {
  return (
    <div
      className="hero-stage-mockup w-full relative rounded-2xl sm:rounded-[22px] overflow-hidden bg-[#262432] border border-gray-800"
      style={{
        boxShadow: "14px 14px 0 #e8e0d3, 0 20px 40px -15px rgba(0, 0, 0, 0.35)",
      }}
    >
      <img
        src="/assets/in-session-roundtable.png"
        alt="Spectakles Roundtable Live In-Session Preview"
        className="w-full h-auto block select-none"
        draggable={false}
      />
    </div>
  );
}
