"use client";

import { Suspense } from "react";
import DeviceApproveInner from "./device-approve-inner";

export const dynamic = "force-dynamic";

export default function DeviceApprovePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <DeviceApproveInner />
    </Suspense>
  );
}
