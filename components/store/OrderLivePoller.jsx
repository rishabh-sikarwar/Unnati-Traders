"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * OrderLivePoller periodically checks the order status and triggers
 * router.refresh() when a status transition is detected (e.g., PENDING -> BILLED -> COMPLETED).
 * Polling stops automatically once the order reaches COMPLETED or CANCELLED status.
 */
export default function OrderLivePoller({
  orderId,
  currentStatus,
  intervalMs = 4000,
}) {
  const router = useRouter();
  const pollCountRef = useRef(0);

  useEffect(() => {
    // If the order has reached terminal status, don't poll
    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      return;
    }

    const intervalId = setInterval(async () => {
      pollCountRef.current += 1;
      try {
        const res = await fetch(`/api/dealer-orders/${orderId}?t=${Date.now()}`, {
          cache: "no-store",
        });

        if (res.ok) {
          const data = await res.json();
          // If the status has changed on the server, refresh the Server Component
          if (data?.order?.status && data.order.status !== currentStatus) {
            router.refresh();
            return;
          }
        }
      } catch (err) {
        console.debug("Live poller check failed:", err);
      }

      // Periodic safety sync every 3rd cycle (~12 seconds)
      if (pollCountRef.current % 3 === 0) {
        router.refresh();
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [orderId, currentStatus, intervalMs, router]);

  return null;
}
