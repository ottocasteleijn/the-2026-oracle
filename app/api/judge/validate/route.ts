import { generateObject } from "ai";
import { z } from "zod";
import { getModel, type AIProvider } from "@/lib/ai/providers";
import { JUDGE_SYSTEM_PROMPT, createUserPrompt } from "@/lib/ai/judge-prompt";
import { calculatePayoutOdds } from "@/lib/utils";
import type { JudgeResponse as FullJudgeResponse } from "@/types/database";

/**
 * Zod schema for the AI Judge response
 */
const judgeResponseSchema = z.object({
  concreteness_score: z.number().int().min(0).max(10),
  boldness_score: z.number().int().min(0).max(10),
  ai_comment: z.string().max(280),
});

/**
 * Request body schema
 */
const requestSchema = z.object({
  prediction: z.string().min(10).max(1000),
  provider: z.enum(["anthropic", "google", "openai"]).optional(),
});

/**
 * POST /api/judge/validate
 * Non-streaming version - returns complete evaluation at once
 * Use this when you need to validate before saving to database
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

    // Generate the complete response (non-streaming)
    const { object } = await generateObject({
      model,
      schema: judgeResponseSchema,
      system: JUDGE_SYSTEM_PROMPT,
      prompt: createUserPrompt(prediction),
      temperature: 0.7,
    });

    // Calculate payout odds
    const payout_odds = calculatePayoutOdds(
      object.boldness_score,
      object.concreteness_score
    );

    // Check if valid (concreteness >= 4)
    const is_valid = object.concreteness_score >= 4;

    const response: FullJudgeResponse = {
      concreteness_score: object.concreteness_score,
      boldness_score: object.boldness_score,
      payout_odds,
      ai_comment: object.ai_comment,
      is_valid,
      validation_message: is_valid
        ? undefined
        : "Your prediction is too vague. Please be more specific about what will happen and when.",
    };

    return Response.json(response);
  } catch (error) {
    console.error("Judge validation error:", error);
    return Response.json(
      { error: "Failed to validate prediction" },
      { status: 500 }
    );
  }
}

