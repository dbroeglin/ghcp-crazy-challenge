const BASE_PATH = "/ghcp-crazy-challenge";

// Token management using GitHub Personal Access Token (PAT)
// GitHub's OAuth token exchange endpoint blocks CORS from browsers,
// so for a pure static site we use a PAT with models:read scope instead.

export function saveToken(token: string): void {
  sessionStorage.setItem("github_token", token);
}

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

// Validate a PAT by calling the GitHub user endpoint
export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
