"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  ArrowLeft,
  LayoutDashboard,
  Gauge,
  RotateCcw,
} from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [spinning, setSpinning] = useState(false);

  // Auto redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-[#1a0a2e] flex flex-col items-center justify-center px-4 py-20 overflow-hidden relative">

      {/* ── Animated background rings ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-purple-500/10 animate-ping"
            style={{
              width: `${i * 200}px`,
              height: `${i * 200}px`,
              animationDuration: `${i * 2}s`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-3xl" />
      </div>

      {/* ── Spinning tyre illustration ── */}
      <div className="relative mb-8 z-10">
        <button
          onClick={() => setSpinning(true)}
          title="Spin the tyre!"
          className="group cursor-pointer focus:outline-none"
          onAnimationEnd={() => setSpinning(false)}
        >
          {/* Outer tyre ring */}
          <div
            className={`w-36 h-36 rounded-full border-[10px] border-[#522874] bg-[#2a1040] shadow-[0_0_40px_rgba(82,40,116,0.6)] flex items-center justify-center relative ${
              spinning ? "animate-spin" : "group-hover:animate-spin"
            }`}
            style={{ animationDuration: "1.2s" }}
          >
            {/* Spokes */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute w-0.5 h-10 bg-[#522874]/60 rounded-full origin-bottom"
                style={{
                  rotate: `${deg}deg`,
                  top: "50%",
                  left: "calc(50% - 1px)",
                  transformOrigin: "50% 100%",
                }}
              />
            ))}
            {/* Hub cap */}
            <div className="w-10 h-10 rounded-full bg-[#522874] border-4 border-white/10 flex items-center justify-center shadow-inner z-10">
              <Gauge className="w-5 h-5 text-white/80" />
            </div>
          </div>

          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-purple-600/20 blur-xl scale-110 group-hover:scale-125 transition-transform duration-500" />
        </button>
      </div>

      {/* ── 404 Text ── */}
      <div className="relative z-10 text-center mb-8">
        <p className="text-xs font-bold tracking-[0.5em] text-purple-400 uppercase mb-3">
          Unnati Traders · Apollo Distributor
        </p>
        <h1 className="text-[100px] sm:text-[130px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.4)] select-none">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-3">
          This road doesn't exist
        </h2>
        <p className="text-purple-300/80 text-base max-w-md mx-auto leading-relaxed">
          Looks like this tyre rolled off the path. The page you're looking for
          hasn't been built yet or was moved.
        </p>
      </div>

      {/* ── Action buttons ── */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 mb-8 w-full max-w-sm sm:max-w-none">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 bg-[#522874] hover:bg-[#6b35a0] text-white font-bold px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(82,40,116,0.5)] hover:shadow-[0_0_30px_rgba(82,40,116,0.7)] transition-all duration-300 active:scale-95 w-full sm:w-auto"
        >
          <LayoutDashboard size={18} />
          Go to Dashboard
        </Link>

        <button
          onClick={() => router.back()}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/15 hover:border-white/30 transition-all duration-300 active:scale-95 backdrop-blur-sm w-full sm:w-auto cursor-pointer"
        >
          <ArrowLeft size={18} />
          Go Back
        </button>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-purple-300 font-semibold px-6 py-3 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 active:scale-95 backdrop-blur-sm w-full sm:w-auto"
        >
          <Home size={18} />
          Home
        </Link>
      </div>

      {/* ── Auto-redirect countdown ── */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        {/* Circular progress ring */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(168,85,247,0.15)"
              strokeWidth="3"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(168,85,247,0.7)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (countdown / 10)}`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-purple-300">
            {countdown}
          </span>
        </div>
        <p className="text-xs text-purple-400/70 font-medium">
          Redirecting to dashboard automatically…
        </p>
        <button
          onClick={() => setCountdown(999)}
          className="text-xs text-purple-500/60 hover:text-purple-400 underline underline-offset-2 transition-colors cursor-pointer mt-0.5"
        >
          Stay on this page
        </button>
      </div>

      {/* ── Bottom hint: spin the tyre ── */}
      <div className="absolute bottom-6 left-0 right-0 z-10 text-center">
        <p className="text-[11px] text-purple-500/40 flex items-center justify-center gap-1.5">
          <RotateCcw size={10} />
          Click the tyre for a spin
        </p>
      </div>
    </div>
  );
}
