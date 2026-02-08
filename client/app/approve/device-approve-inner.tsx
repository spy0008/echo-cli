"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, Smartphone, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DeviceApproveInner() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const userCode = searchParams.get("user_code");

  const [isProcessing, setIsProcessing] = useState({
    approve: false,
    deny: false,
  });

  useEffect(() => {
    if (!isPending && (!data?.session || !data?.user)) {
      router.push("/sign-in");
    }
  }, [isPending, data, router]);

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!userCode) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        Invalid device code
      </div>
    );
  }

  const handleApprove = async () => {
    setIsProcessing({ approve: true, deny: false });

    try {
      toast.loading("Approving device...", { id: "approve" });

      await authClient.device.approve({
        userCode,
      });

      toast.dismiss("approve");
      toast.success("Device approved!");
      router.push("/");
    } catch {
      toast.error("Failed to approve");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };

  const handleDeny = async () => {
    setIsProcessing({ approve: false, deny: true });

    try {
      toast.loading("Denying device...", { id: "deny" });

      await authClient.device.deny({
        userCode,
      });

      toast.dismiss("deny");
      toast.success("Device denied");
      router.push("/");
    } catch {
      toast.error("Failed to deny");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };

  return (
    <div className="relative w-full flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="rounded-xl border border-zinc-700 p-6 text-center">
          <div className="flex justify-center mb-4">
            <Smartphone className="h-12 w-12 text-primary" />
          </div>

          <h1 className="text-2xl font-bold">Device Authorization</h1>

          <p className="text-sm text-muted-foreground mt-2">
            A device is requesting access
          </p>
        </div>

        {/* Code */}
        <div className="rounded-xl border border-zinc-700 p-4 text-center">
          <p className="text-xs uppercase text-muted-foreground">
            Authorization Code
          </p>

          <p className="mt-2 text-xl font-mono font-bold tracking-widest text-primary">
            {userCode}
          </p>
        </div>

        {/* Info */}
        <div className="rounded-xl border border-zinc-700 p-4 text-sm text-muted-foreground">
          Account: {data?.user?.email}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">

          <Button
            onClick={handleApprove}
            disabled={isProcessing.approve}
            className="flex-1"
          >
            {isProcessing.approve ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </>
            )}
          </Button>

          <Button
            onClick={handleDeny}
            disabled={isProcessing.deny}
            variant="destructive"
            className="flex-1"
          >
            {isProcessing.deny ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Denying...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Deny
              </>
            )}
          </Button>

        </div>
      </div>
    </div>
  );
}
