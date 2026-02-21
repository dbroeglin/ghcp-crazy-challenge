"use client";

import { useEffect, useState } from "react";
import { handleCallback } from "@/lib/auth";

const BASE_PATH = "/ghcp-crazy-challenge";

export default function CallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback()
      .then(() => {
        window.location.href = `${BASE_PATH}/`;
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <h1 className="text-xl font-bold text-red-400">Login Failed</h1>
          <p className="text-gray-400 max-w-sm">{error}</p>
          <a
            href={`${BASE_PATH}/`}
            className="inline-block mt-4 px-6 py-3 bg-white text-black rounded-xl font-semibold"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin text-4xl">⏳</div>
        <p className="text-gray-400">Completing login...</p>
      </div>
    </div>
  );
}
