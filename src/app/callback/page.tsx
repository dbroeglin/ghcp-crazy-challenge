"use client";

import { useEffect } from "react";

const BASE_PATH = "/ghcp-crazy-challenge";

// OAuth callback is no longer used — redirect to home
export default function CallbackPage() {
  useEffect(() => {
    window.location.href = `${BASE_PATH}/`;
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  );
}
