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
    // When the route changes, stop loading
    setLoading(false);
    setProgress(100);

    timerRef.current = setTimeout(() => {
      setProgress(0);
    }, 400);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [pathname, searchParams]);

  // We need a way to trigger loading when a link is clicked
  // We do this by intercepting click events on <a> tags
  useEffect(() => {
    const handleClick = (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Only trigger for internal navigation links
      const isInternal =
        href.startsWith("/") ||
        href.startsWith(window.location.origin);
      const isNewTab = anchor.target === "_blank";
      const isDownload = anchor.hasAttribute("download");
      const isSameUrl = href === pathname;

      if (isInternal && !isNewTab && !isDownload && !isSameUrl) {
        setLoading(true);
        setProgress(15);

        let currentProgress = 15;
        intervalRef.current = setInterval(() => {
          // Ease slowly toward 85%, never reaching 100 until done
          currentProgress += (85 - currentProgress) * 0.08;
          setProgress(Math.min(currentProgress, 85));
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
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-[#522874] to-purple-400 shadow-[0_0_10px_rgba(82,40,116,0.7)]"
        style={{
          width: `${progress}%`,
          transition: loading
            ? "width 0.2s ease-out"
            : "width 0.3s ease-out, opacity 0.4s ease-out",
          opacity: loading || progress < 100 ? 1 : 0,
        }}
      />
    </div>
  );
}
