"use server";

import { parseInvoicePrompt, type AiInvoiceResult } from "@/lib/ai-invoice";

export async function generateInvoiceFromPromptAction(
  prompt: string,
): Promise<{ success: boolean; data?: AiInvoiceResult; error?: string }> {
  try {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return { success: false, error: "Please enter a prompt." };
    }
    const result = await parseInvoicePrompt(trimmed);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI invoice generation error:", error);
    return { success: false, error: "Failed to process prompt." };
  }
}
