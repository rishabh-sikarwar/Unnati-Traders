"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setLoading(false);
    setProgress(100);

    timerRef.current = setTimeout(() => {
      setProgress(0);
    }, 400);

    return () => clearTimeout(timerRef.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const isInternal = href.startsWith("/") || href.startsWith(window.location.origin);
      const isNewTab = anchor.target === "_blank";
      const isDownload = anchor.hasAttribute("download");
      const isSameUrl = href === pathname;

      if (isInternal && !isNewTab && !isDownload && !isSameUrl) {
        setLoading(true);
        setProgress(20);

        let currentProgress = 20;
        intervalRef.current = setInterval(() => {
          currentProgress += (90 - currentProgress) * 0.1;
          setProgress(Math.min(currentProgress, 90));
        }, 200);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearInterval(intervalRef.current);
    };
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none"
      aria-hidden="true"
    >
      {/* Thicker, more visible track */}
      <div
        className="h-[4px] md:h-[5px] bg-[#522874] relative shadow-[0_0_15px_rgba(82,40,116,0.8)]"
        style={{
          width: `${progress}%`,
          transition: loading
            ? "width 0.15s ease-out"
            : "width 0.3s ease-out, opacity 0.4s ease-out",
          opacity: loading || progress < 100 ? 1 : 0,
        }}
      >
        {/* Bright glowing leading edge */}
        <div className="absolute right-0 top-0 h-full w-[100px] bg-gradient-to-r from-transparent to-white/80 blur-[2px]" />
      </div>
    </div>
  );
}