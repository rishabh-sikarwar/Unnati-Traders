import { Suspense } from "react";
import PageLoadingBar from "./page-loading-bar";

export default function PageLoadingBarWrapper() {
  return (
    <Suspense fallback={null}>
      <PageLoadingBar />
    </Suspense>
  );
}
