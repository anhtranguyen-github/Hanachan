import { z } from "zod";

export const StripeWebhookSchema = z.object({
    type: z.string(),
    data: z.object({
        object: z.record(z.any())
    })
});
