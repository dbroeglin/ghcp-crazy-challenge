const BASE_PATH = "/ghcp-crazy-challenge";
const GITHUB_CLIENT_ID =
  process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "REPLACE_WITH_YOUR_CLIENT_ID";
const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.origin}${BASE_PATH}/callback`
    : "";

// PKCE utilities

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(plain));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateCodeChallenge(
  verifier: string
): Promise<string> {
  const hash = await sha256(verifier);
  return base64UrlEncode(hash);
}

// Login — redirect to GitHub

export async function login(): Promise<void> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);

  sessionStorage.setItem("pkce_code_verifier", codeVerifier);
  sessionStorage.setItem("pkce_state", state);

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "models:read",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

// Handle callback — exchange code for token

export async function handleCallback(): Promise<string> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const savedState = sessionStorage.getItem("pkce_state");
  const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

  if (!code || !state || state !== savedState || !codeVerifier) {
    throw new Error("Invalid OAuth callback parameters");
  }

  // Clean up PKCE state
  sessionStorage.removeItem("pkce_state");
  sessionStorage.removeItem("pkce_code_verifier");

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`OAuth error: ${data.error_description || data.error}`);
  }

  const token = data.access_token;
  sessionStorage.setItem("github_token", token);
  return token;
}

// Token management

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("github_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  sessionStorage.removeItem("github_token");
  window.location.href = `${BASE_PATH}/`;
}
