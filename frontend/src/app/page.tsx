"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready) router.replace(user ? "/dashboard" : "/login");
  }, [ready, router, user]);

  return <main className="loading-state">Opening your workspace...</main>;
}
