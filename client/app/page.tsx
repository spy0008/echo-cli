"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (data?.session && !data?.user) {
    router.push("/sign-in");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 pt-24 pb-24 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-secondary/25 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-xl p-6 sm:p-8 space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={data?.user?.image || "/echo-1.svg"}
                alt={data?.user?.name || "User"}
                className="h-28 w-28 rounded-full object-cover border border-border"
              />
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome,{" "}
              <span className="text-primary">{data?.user?.name || "User"}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Authenticated via Echoo
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Email
            </p>
            <p className="text-sm font-medium break-all">{data?.user?.email}</p>
          </div>

          <Button
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onError: (ctx) => console.log(ctx),
                  onSuccess: () => router.push("/sign-in"),
                },
              })
            }
            variant="destructive"
            className="w-full"
          >
            Sign Out
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              Session Active
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      </div>
    </div>
  );
}
