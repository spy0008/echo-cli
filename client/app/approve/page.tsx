"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, Smartphone, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const DeviceApprovelPage = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code");
  const [isProcessing, setIsProcessing] = useState({
    approve: false,
    deny: false,
  });

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Spinner />
      </div>
    );
  }

  if (!data?.session && !data?.user) {
    router.push("/sign-in");
  }

  const handleApprove = async () => {
    setIsProcessing({
      approve: true,
      deny: false,
    });

    try {
      toast.loading("Approving device...", { id: "loading" });

      await authClient.device.approve({
        userCode: userCode!,
      });

      toast.dismiss("loading");
      toast.success("Device approved successfully!!!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to approve!!!");
    } finally {
      setIsProcessing({
        approve: false,
        deny: false,
      });
    }
  };

  const handleDeny = async () => {
    setIsProcessing({
      approve: false,
      deny: true,
    });

    try {
      toast.loading("Denying device...", { id: "deny" });

      await authClient.device.deny({
        userCode: userCode!,
      });

      toast.dismiss("deny");
      toast.success("Oops! Device Denied to approve!!!m");
      router.push("/");
    } catch (error) {
      toast.error("Failed to Deny!!!");
    } finally {
      setIsProcessing({
        approve: false,
        deny: false,
      });
    }
  };

  return (
    <div className="relative w-full flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md px-4">
        <div className="space-y-8">
          {/* Header */}
          <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 bg-zinc-900/50 backdrop-blur-sm text-center">
            {/* device icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-zinc-600 bg-zinc-800 flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-primary-foreground" />
                </div>
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 bg-orange-500 rounded-full border-2
                 border-zinc-900 flex items-center justify-center"
                >
                  <span className="text-xs text-white font-bold">!</span>
                </div>
              </div>
            </div>

            {/* title and descrption */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-zinc-50">
                device Authorization
              </h1>
              <p className="text-sm text-zinc-400">
                A new device is requesting access to your account
              </p>
              <div className="bg-zinc-800 rounded"></div>
            </div>
          </div>

          {/* Device code card */}
          <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-900/50 backdrop-blur-sm space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Authorization code
              </p>
              <div className="bg-zinc-800 rounded-lg p-4 border borderzin700">
                <p className="text-xl font-bold text-primary text-center tracking-widest">
                  {userCode || "___"}
                </p>
              </div>

              <p className="text-xs text-zinc-600 text-center">
                Share this code with the requesting Device
              </p>
            </div>
          </div>

          {/* Security info card */}
          <div
            className="boder-2 border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-900/50 backblusn
         "
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Account : {data?.user?.email}
              </p>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <p className="text-sm text-zinc-300">
                  Only approve this if you initiated it. For Security, never
                  share this code with others.
                </p>
              </div>
            </div>
          </div>

          {/* Avtion button */}
          <div className="space-y-3 flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={isProcessing.approve}
              className="w-1/2 h-11 flex items-center justify-center gap-2"
            >
              {isProcessing.approve ? (
                <>
                  <Spinner className="w-4 h-4" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Approve Device</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleDeny}
              disabled={isProcessing.deny}
              variant="destructive"
              className="w-1/2 h-11 flex items-center justify-center gap-2"
            >
              {isProcessing.deny ? (
                <>
                  <Spinner className="w-4 h-4" />
                  <span>Denying...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  <span>Deny Device</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex mb-3 items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Choose Wisely</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceApprovelPage;
