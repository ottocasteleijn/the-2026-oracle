import { streamObject } from "ai";
import { z } from "zod";
import { getModel, type AIProvider } from "@/lib/ai/providers";
import { JUDGE_SYSTEM_PROMPT, createUserPrompt } from "@/lib/ai/judge-prompt";
import { calculatePayoutOdds } from "@/lib/utils";

/**
 * Zod schema for the AI Judge response
 */
const judgeResponseSchema = z.object({
  concreteness_score: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe("How specific and measurable the prediction is (0-10)"),
  boldness_score: z
    .number()
    .int()
    .min(0)
    .max(10)
    .describe("How unlikely/bold the prediction is (0-10)"),
  ai_comment: z
    .string()
    .max(280)
    .describe("A witty, slightly roast-heavy comment on the prediction"),
});

export type JudgeResponse = z.infer<typeof judgeResponseSchema>;

/**
 * Request body schema
 */
const requestSchema = z.object({
  prediction: z.string().min(10).max(1000),
  provider: z.enum(["anthropic", "google", "openai"]).optional(),
});

/**
 * POST /api/judge
 * Evaluates a prediction using the AI Judge
 * Returns a streaming response for real-time UI updates
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { prediction, provider } = parsed.data;
    const model = getModel(provider as AIProvider | undefined);

    // Stream the structured response
    const result = streamObject({
      model,
      schema: judgeResponseSchema,
      system: JUDGE_SYSTEM_PROMPT,
      prompt: createUserPrompt(prediction),
      temperature: 0.7, // Some creativity for the comments
    });

    // Return the streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Judge API error:", error);
    return Response.json(
      { error: "Failed to evaluate prediction" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/judge
 * Returns info about the judge API
 */
export async function GET() {
  return Response.json({
    name: "The 2026 Oracle - AI Judge",
    description: "Evaluates predictions for concreteness and boldness",
    schema: {
      request: {
        prediction: "string (10-1000 chars)",
        provider: "anthropic | google | openai (optional)",
      },
      response: {
        concreteness_score: "number (0-10)",
        boldness_score: "number (0-10)",
        payout_odds: "number (calculated from scores)",
        ai_comment: "string",
        is_valid: "boolean (true if concreteness >= 4)",
      },
    },
  });
}

