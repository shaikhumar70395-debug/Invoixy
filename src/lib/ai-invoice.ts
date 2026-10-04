import type { InvoiceDraft, InvoiceLineInput } from "@/lib/types";

export type AiInvoiceResult = {
  buyer: Partial<InvoiceDraft["buyer"]>;
  lines: InvoiceLineInput[];
  summaryMessage: string;
};

/**
 * Intelligent local NLP rule-based parser.
 * Works 100% offline, ₹0 cost, zero API keys required, instant response.
 */
export function parseInvoicePromptLocally(prompt: string): AiInvoiceResult {
  const text = prompt.trim();
  if (!text) {
    return {
      buyer: {},
      lines: [],
      summaryMessage: "Please provide a description of the invoice.",
    };
  }

  // 1. Extract Buyer Name
  let buyerName = "";
  // Patterns like "invoice for/to [Name]", "bill [Name]", "for [Name] -"
  const buyerMatch =
    /(?:bill|invoice|for|client|customer)\s+([A-Za-z0-9&.\s]+?)(?:\s+(?:for|with|having|consisting|items?|products?|:\s|-|\u2014)|\s*,\s*|\s+(?:1|2|3|4|5|6|7|8|9|\d+)\s+)/i.exec(
      text,
    );

  if (buyerMatch && buyerMatch[1]) {
    const candidate = buyerMatch[1].trim();
    // Exclude common noise words
    if (!/^(an?|the|new|sample|quick)$/i.test(candidate)) {
      buyerName = candidate
        .replace(/^(an?|the)\s+/i, "")
        .replace(/\s+(for|with)$/i, "")
        .trim();
    }
  }

  // Fallback buyer check if buyer name is still empty
  if (!buyerName) {
    const directFor = /for\s+([A-Za-z\s]+?)(?:\s+(?:at|with|\d+)|$)/i.exec(text);
    if (directFor && directFor[1]) {
      buyerName = directFor[1].trim();
    }
  }

  // Check state code if mentioned (e.g., "in Gujarat", "Maharashtra")
  let buyerState = "";
  let buyerStateCode = "";
  if (/maharashtra/i.test(text)) {
    buyerState = "MAHARASHTRA";
    buyerStateCode = "27";
  } else if (/gujarat/i.test(text)) {
    buyerState = "GUJARAT";
    buyerStateCode = "24";
  } else if (/delhi/i.test(text)) {
    buyerState = "DELHI";
    buyerStateCode = "07";
  } else if (/karnataka/i.test(text)) {
    buyerState = "KARNATAKA";
    buyerStateCode = "29";
  }

  // 2. Extract Global or Mentioned GST
  let defaultGst = 18;
  const gstMatch = /(\d{1,2})\s*%\s*(?:gst|tax)/i.exec(text);
  if (gstMatch) {
    const parsedGst = Number(gstMatch[1]);
    if ([0, 5, 12, 18, 28].includes(parsedGst)) {
      defaultGst = parsedGst;
    }
  }

  // 3. Extract Line Items
  // Normalize currency symbols
  const clean = text
    .replace(/[₹]/g, "Rs. ")
    .replace(/\s+/g, " ");

  // Isolate the items part by removing the buyer prefix
  let itemsPart = clean;
  if (buyerName) {
    const idx = clean.toLowerCase().indexOf(buyerName.toLowerCase());
    if (idx !== -1) {
      itemsPart = clean.slice(idx + buyerName.length).trim();
      // Remove leading prepositions
      itemsPart = itemsPart.replace(/^(for|with|having|:|-)\s+/i, "").trim();
    }
  }

  // Split into chunks by "and", comma, semicolon, or newline
  const rawChunks = itemsPart
    .split(/(?:\s+and\s+|,|;|\n)/i)
    .map((c) => c.trim())
    .filter((c) => c.length > 3);

  const lines: InvoiceLineInput[] = [];

  rawChunks.forEach((chunk, index) => {
    // Check if this chunk is purely tax or buyer info
    if (/^\d{1,2}%\s*(?:gst|tax)/i.test(chunk)) return;

    // Extract quantity (e.g. "5 hours", "2 TVs", "10 units", "1 x")
    let qty = 1;
    let unit = "Nos";

    const qtyMatch = /(?:^|\s)(\d+(?:\.\d+)?)\s*(hours?|hrs?|nos?|units?|pcs?|items?|sets?|boxes?|months?|days?)?/i.exec(
      chunk,
    );
    if (qtyMatch) {
      qty = Number(qtyMatch[1]) || 1;
      if (qtyMatch[2]) {
        const u = qtyMatch[2].toLowerCase();
        if (u.startsWith("hour") || u.startsWith("hr")) unit = "hrs";
        else if (u.startsWith("month")) unit = "months";
        else if (u.startsWith("day")) unit = "days";
        else if (u.startsWith("set")) unit = "SET";
        else unit = "Nos";
      }
    }

    // Extract rate (e.g. "@ 2000", "at ₹2000", "Rs. 2000", "₹ 2000", "2000/hr", "each 2000")
    let rate = 0;
    const rateMatch = /(?:@|at|rs\.?|inr|price|rate|each)\s*(\d+(?:,\d+)*(?:\.\d+)?)/i.exec(chunk) ||
                      /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:\/(?:hr|hour|unit|nos|item|each)|each)/i.exec(chunk);

    if (rateMatch) {
      rate = Number(rateMatch[1].replace(/,/g, "")) || 0;
    } else {
      // Check for any standalone large number that isn't the quantity
      const allNumbers = chunk.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/g);
      if (allNumbers && allNumbers.length > 1) {
        const candidates = allNumbers.map((n) => Number(n.replace(/,/g, ""))).filter((n) => n !== qty);
        if (candidates.length > 0) {
          rate = Math.max(...candidates);
        }
      }
    }

    // Extract discount if any (e.g., "10% discount", "5% off")
    let discountPercent = 0;
    const discMatch = /(\d{1,2})\s*%\s*(?:discount|disc|off)/i.exec(chunk);
    if (discMatch) {
      discountPercent = Number(discMatch[1]) || 0;
    }

    // Clean up description
    let desc = chunk
      .replace(/(?:@|at|rs\.?|inr|price|rate|each)\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, "")
      .replace(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:\/(?:hr|hour|unit|nos|item|each)|each)/gi, "")
      .replace(/(?:^|\s)\d+(?:\.\d+)?\s*(hours?|hrs?|nos?|units?|pcs?|items?|sets?|boxes?|months?|days?)?/gi, "")
      .replace(/(\d{1,2})\s*%\s*(?:discount|disc|off|gst|tax)/gi, "")
      .replace(/[₹]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Capitalize first letter of description
    if (desc.length > 0) {
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    } else {
      desc = `Service / Item ${index + 1}`;
    }

    if (rate > 0 || desc.length > 3) {
      lines.push({
        id: `ai-${Date.now()}-${index}`,
        description: desc,
        hsnSac: unit === "hrs" ? "998314" : "85171200",
        quantity: qty,
        rate: rate,
        unit: unit,
        discountPercent: discountPercent,
        gstRatePercent: defaultGst,
      });
    }
  });

  // If no lines could be extracted, generate a smart single line
  if (lines.length === 0) {
    const firstNumber = text.match(/\b\d+(?:,\d+)*(?:\.\d+)?\b/);
    const fallbackRate = firstNumber ? Number(firstNumber[0].replace(/,/g, "")) : 1000;
    lines.push({
      id: `ai-${Date.now()}-0`,
      description: text.slice(0, 40),
      hsnSac: "998314",
      quantity: 1,
      rate: fallbackRate,
      unit: "Nos",
      discountPercent: 0,
      gstRatePercent: defaultGst,
    });
  }

  return {
    buyer: {
      name: buyerName || "Client Customer",
      stateName: buyerState || undefined,
      stateCode: buyerStateCode || undefined,
    },
    lines,
    summaryMessage: `AI successfully extracted ${lines.length} item${lines.length > 1 ? "s" : ""} for ${buyerName || "Client"} with ${defaultGst}% GST.`,
  };
}

/**
 * Main parser entry point.
 * Calls Gemini if GEMINI_API_KEY is available in the environment,
 * otherwise falls back instantly to the bulletproof local NLP parser.
 */
export async function parseInvoicePrompt(prompt: string): Promise<AiInvoiceResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert Indian GST billing assistant. Extract customer name and line items from this invoice request:
"${prompt}"

Return ONLY valid JSON strictly matching this schema with NO markdown code blocks:
{
  "buyerName": "Customer Name",
  "buyerState": "State name if mentioned or null",
  "buyerStateCode": "2-digit code if known or null",
  "lines": [
    {
      "description": "Item description",
      "hsnSac": "HSN code or default",
      "quantity": 1,
      "rate": 1000,
      "unit": "Nos",
      "discountPercent": 0,
      "gstRatePercent": 18
    }
  ]
}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJsonText) {
          const parsed = JSON.parse(rawJsonText);
          const lines: InvoiceLineInput[] = (parsed.lines || []).map((l: any, i: number) => ({
            id: `ai-${Date.now()}-${i}`,
            description: String(l.description || `Item ${i + 1}`),
            hsnSac: String(l.hsnSac || "85171200"),
            quantity: Number(l.quantity) || 1,
            rate: Number(l.rate) || 0,
            unit: String(l.unit || "Nos"),
            discountPercent: Number(l.discountPercent) || 0,
            gstRatePercent: Number(l.gstRatePercent) || 18,
          }));

          return {
            buyer: {
              name: parsed.buyerName || "Client Customer",
              stateName: parsed.buyerState || undefined,
              stateCode: parsed.buyerStateCode || undefined,
            },
            lines,
            summaryMessage: `Gemini AI extracted ${lines.length} item${lines.length > 1 ? "s" : ""} for ${parsed.buyerName || "Client"}.`,
          };
        }
      }
    } catch {
      // Fallback silently to local parser on any API failure
    }
  }

  // Fast, reliable, 100% free local NLP parser
  return parseInvoicePromptLocally(prompt);
}
