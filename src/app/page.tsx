"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { saveToken, validateToken, logout, getToken, isAuthenticated } from "@/lib/auth";
import { describeImage } from "@/lib/models";

type AppState =
  | "loading"
  | "unauthenticated"
  | "camera"
  | "preview"
  | "analyzing"
  | "result";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("loading");
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAppState(isAuthenticated() ? "camera" : "unauthenticated");
  }, []);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) return;

    setValidating(true);
    setTokenError(null);

    const valid = await validateToken(token);
    if (valid) {
      saveToken(token);
      setAppState("camera");
    } else {
      setTokenError("Invalid token. Make sure you created a PAT with the correct scopes.");
    }
    setValidating(false);
  };

  // Camera management

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(
        "Camera access denied or unavailable. Use the file picker below instead."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (appState === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [appState, startCamera, stopCamera]);

  // Capture photo from video

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1];
    setPhoto(base64);
    setAppState("preview");
  };

  // Handle file upload fallback

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setPhoto(base64);
      setAppState("preview");
    };
    reader.readAsDataURL(file);
  };

  // Analyze photo

  const analyzePhoto = async () => {
    if (!photo) return;
    const token = getToken();
    if (!token) {
      setAppState("unauthenticated");
      return;
    }

    setAppState("analyzing");
    setError(null);
    setDescription(null);

    try {
      const result = await describeImage(photo, token);
      setDescription(result.description);
      setAppState("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setAppState("preview");
    }
  };

  // Reset

  const reset = () => {
    setPhoto(null);
    setDescription(null);
    setError(null);
    setAppState("camera");
  };

  // Render

  if (appState === "loading") {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (appState === "unauthenticated") {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="text-6xl">📸</div>
          <h1 className="text-3xl font-bold">Vision Describer</h1>
          <p className="text-gray-400">
            Take a photo and get an AI-powered description using GitHub Models.
          </p>

          <form onSubmit={handleTokenSubmit} className="space-y-3 text-left">
            <label className="block text-sm text-gray-300 font-medium">
              GitHub Personal Access Token
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl
                         text-white placeholder-gray-600 focus:outline-none focus:border-gray-500"
            />
            {tokenError && (
              <p className="text-red-400 text-sm">{tokenError}</p>
            )}
            <button
              type="submit"
              disabled={!tokenInput.trim() || validating}
              className="w-full px-6 py-4 bg-white text-black rounded-2xl font-semibold text-lg
                         disabled:opacity-50 active:scale-95 transition-transform"
            >
              {validating ? "Validating..." : "🔐 Sign In"}
            </button>
          </form>

          <div className="text-xs text-gray-600 space-y-1">
            <p>
              Create a PAT at{" "}
              <a
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 underline"
              >
                github.com/settings/tokens
              </a>
            </p>
            <p>Required scope: <strong>Models</strong> (read)</p>
            <p>Your token stays in your browser and is never stored on any server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="font-bold text-lg">📸 Vision Describer</h1>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded-lg
                     border border-gray-700 active:scale-95 transition-transform"
        >
          Logout
        </button>
      </header>

      {/* Camera View */}
      {appState === "camera" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {cameraError ? (
              <p className="text-gray-400 text-center p-6">{cameraError}</p>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="p-4 space-y-3">
            <button
              onClick={capturePhoto}
              disabled={!!cameraError}
              className="w-full py-4 bg-white text-black rounded-2xl font-semibold text-lg
                         disabled:opacity-30 active:scale-95 transition-transform"
            >
              📷 Take Photo
            </button>

            <div className="text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-sm text-gray-400 underline"
              >
                Or pick from gallery
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {appState === "preview" && photo && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-black flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/jpeg;base64,${photo}`}
              alt="Captured photo"
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          {error && (
            <div className="mx-4 p-3 bg-red-900/50 border border-red-700 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 space-y-3">
            <button
              onClick={analyzePhoto}
              className="w-full py-4 bg-green-600 text-white rounded-2xl font-semibold text-lg
                         active:scale-95 transition-transform"
            >
              ✨ Describe This Photo
            </button>
            <button
              onClick={reset}
              className="w-full py-3 border border-gray-700 text-gray-300 rounded-2xl font-medium
                         active:scale-95 transition-transform"
            >
              🔄 Retake
            </button>
          </div>
        </div>
      )}

      {/* Analyzing */}
      {appState === "analyzing" && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="animate-spin text-5xl">🔍</div>
            <p className="text-gray-400 text-lg">Analyzing image with AI...</p>
            <p className="text-gray-600 text-sm">Using GPT-4.1 via GitHub Models</p>
          </div>
        </div>
      )}

      {/* Result */}
      {appState === "result" && (
        <div className="flex-1 flex flex-col">
          {photo && (
            <div className="bg-black p-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${photo}`}
                alt="Analyzed photo"
                className="max-w-full max-h-48 object-contain rounded-xl"
              />
            </div>
          )}

          <div className="flex-1 p-6">
            <h2 className="font-bold text-lg mb-3">📝 Description</h2>
            <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 leading-relaxed">
              {description}
            </div>
          </div>

          <div className="p-4">
            <button
              onClick={reset}
              className="w-full py-4 bg-white text-black rounded-2xl font-semibold text-lg
                         active:scale-95 transition-transform"
            >
              📸 Take Another Photo
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
