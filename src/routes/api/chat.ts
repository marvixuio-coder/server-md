import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "@/server/responses";

const SYSTEM = `أنت "روبو MD"، مساعد ودود لسيرفر ديسكورد MD (جيمنج، فعاليات، مجتمع).
تكلم بالعربي بلهجة خفيفة وودودة، وجاوب باختصار ووضوح. رابط السيرفر: https://discord.gg/ahRGXk3n2`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) return new Response("Bad request", { status: 400 });
        const messages = await convertToModelMessages(body.messages);
        return createResponsesCall(
          request,
          { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
          messages,
          SYSTEM,
        ).response();
      },
    },
  },
});
