# Vision Describer

A mobile-friendly static Next.js app that uses your phone camera to take a photo and describes it using AI (GPT-4.1 via GitHub Models).

**Live:** `https://dbroeglin.github.io/ghcp-crazy-challenge/`

## How It Works

1. Sign in with your GitHub account (OAuth PKCE flow)
2. Take a photo with your phone camera (or pick from gallery)
3. Tap "Describe This Photo" to get an AI-generated description via GitHub Models

## Setup (Manual Steps Required)

### 1. Register a GitHub OAuth App

Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**:

| Field                      | Value                                                         |
|----------------------------|---------------------------------------------------------------|
| Application name           | `Vision Describer`                                            |
| Homepage URL               | `https://dbroeglin.github.io/ghcp-crazy-challenge/`          |
| Authorization callback URL | `https://dbroeglin.github.io/ghcp-crazy-challenge/callback`  |

Copy the **Client ID** (you do NOT need a client secret — PKCE flow).

### 2. Enable GitHub Pages

Go to **Repository Settings → Pages → Source: GitHub Actions**.

### 3. Store the OAuth Client ID

Go to **Repository Settings → Secrets and variables → Actions → Variables tab**:
- Name: `NEXT_PUBLIC_GITHUB_CLIENT_ID`
- Value: *(your OAuth App Client ID from step 1)*

### 4. Push and Deploy

Push to `main` and the GitHub Actions workflow will build and deploy automatically.

## Local Development

```bash
npm install
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id npm run dev
```

## Tech Stack

- **Next.js 15** (static export)
- **Tailwind CSS v4**
- **GitHub OAuth** with PKCE (no backend required)
- **GitHub Models API** (GPT-4.1 vision model)
- **GitHub Pages** + GitHub Actions for deployment
