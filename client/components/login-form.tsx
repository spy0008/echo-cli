"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { animate, stagger } from "motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

const LoginForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const items = Array.from(containerRef.current.children) as HTMLElement[];

    animate(
      items,
      { opacity: [0, 1], y: [16, 0] },
      {
        delay: stagger(0.12),
        duration: 0.6,
        easing: "ease-out",
      },
    );
  }, []);

  const handleGithubLogin = async () => {
    setIsLoading(true);
    authClient.signIn.social({
      provider: "github",
      callbackURL: process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL,
    });
  };

  return (
    <div className="relative w-screen flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
      </div>

      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        <pre className="mx-auto w-fit rounded-xl border bg-card/60 px-4 py-3 text-xs text-primary backdrop-blur-md shadow-sm sm:text-sm font-mono">
          {` ███████╗ ██████╗ ██╗  ██╗ ██████╗ 
 ██╔════╝██╔═══██╗██║  ██║██╔═══██╗
 █████╗  ██║   ██║███████║██║   ██║
 ██╔══╝  ██║   ██║██╔══██║██║   ██║
 ███████╗╚██████╔╝██║  ██║╚██████╔╝
 ╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ `}
          <span className="ml-1 inline-block h-4 w-0.5 align-middle bg-primary animate-cursor-blink shadow-cursor-glow" />
        </pre>

        <div className="echo-animate space-y-2 text-center opacity-0">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back to <span className="text-primary">Echoo</span>
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Authorize device flow to continue using Echoo CLI
          </p>
        </div>

        <div className="echo-animate opacity-0">
          <Card className="border-border/60 bg-card/70 backdrop-blur-xl shadow-xl">
            <CardContent className="p-5 sm:p-6">
              <Button
                variant="outline"
                className="flex w-full items-center justify-center gap-3 py-6 text-base font-medium hover:bg-primary/10"
                type="button"
                disabled={isLoading}
                onClick={handleGithubLogin}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting to GitHub…
                  </>
                ) : (
                  <>
                    <Image
                      src="/github-logo.svg"
                      alt="github"
                      height={18}
                      width={18}
                      className="dark:invert"
                    />
                    Continue with GitHub
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="echo-animate text-center text-xs text-muted-foreground opacity-0">
          Secure • Developer-first • Powered by Echoo AI
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
