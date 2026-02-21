const MODELS_API_URL =
  "https://models.github.ai/inference/chat/completions";
const MODEL = "openai/gpt-4.1";

export interface DescriptionResult {
  description: string;
}

export async function describeImage(
  base64Image: string,
  token: string
): Promise<DescriptionResult> {
  const body = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe what you see in this image in detail. Be concise but thorough.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
  };

  const response = await fetch(MODELS_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 401) {
      throw new Error(
        "Authentication failed. Your token may have expired. Please log in again."
      );
    }

    if (response.status === 0 || errorText.includes("CORS")) {
      throw new Error(
        "CORS error: The GitHub Models API may not allow direct browser calls. " +
          "Try using a GitHub Personal Access Token with models:read scope instead."
      );
    }

    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const description =
    data.choices?.[0]?.message?.content || "No description generated.";

  return { description };
}
