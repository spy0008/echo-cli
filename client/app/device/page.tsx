"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";

const DeviceAuthorizationPage = () => {
  const [userCode, setUserCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const formetedCode = userCode.trim().replace(/-/g, "").toUpperCase();

      const response = await authClient.device({
        query: {
          user_code: formetedCode,
        },
      });

      if (response.data) {
        router.push(`/approve?user_code=${formetedCode}`);
      }
    } catch (error) {
      setError("Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length > 4) {
      value = value.slice(0, 4) + "-" + value.slice(4, 8);
    }

    setUserCode(value);
  };

  return (
    <div className="relative w-screen flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-4">
          <div className="p-3 rounded-lg border-dashed border-zinc-700">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Device Authorization
            </h1>
            <p className="text-muted-foreground">
              Enter your device code to continue
            </p>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="border-2 border-dashed border-zinc-700 rounded-xl p-8 bg-zinc-950 backdrop-blur-sm"
        >
          <div className="space-y-6">
            {/* code input */}
            <>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Device Code
              </label>
              <input
                id="code"
                type="text"
                value={userCode}
                onChange={handleCodeChange}
                placeholder="XXXX-XXXX"
                maxLength={9}
                className="w-full px-4 py-3 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-zinc-600 text-center text-lg tracking-widest"
              />
              <p className="text-sm text-muted-foreground">
                Find this code on the device you want to Authorize
              </p>
            </>

            {/* error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-950 border border-red-900 text-destructive/80 text-sm">
                {error}
              </div>
            )}

            {/* submit button  */}
            <Button
              type="submit"
              disabled={isLoading || userCode.length < 9}
              className="w-full"
            >
              {isLoading ? "Verifying..." : "Continue"}
            </Button>

            {/* info box */}
            <div className="p-4 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This code is unique to your device and will expire shortly. Keep
                it confidential and nerver share to anyone.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceAuthorizationPage;
