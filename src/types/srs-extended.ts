import { z } from "zod";

export const ClaimItemsRequestSchema = z.object({
    itemIds: z.array(z.string().uuid())
});

export const ClaimItemsResponseSchema = z.object({
    claimed: z.number(),
    expGranted: z.number(),
    message: z.string()
});

export const StudyHealthSchema = z.object({
    retention: z.number(),
    status: z.enum(["green", "yellow", "red"]),
    message: z.string()
});

export type ClaimItemsRequest = z.infer<typeof ClaimItemsRequestSchema>;
export type ClaimItemsResponse = z.infer<typeof ClaimItemsResponseSchema>;
export type StudyHealth = z.infer<typeof StudyHealthSchema>;
