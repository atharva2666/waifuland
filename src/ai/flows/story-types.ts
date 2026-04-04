import {z} from 'genkit';

export const StoryInputSchema = z.object({
  imageUrl: z.string().describe("URL of the character image. This must be a full valid URL."),
  prompt: z.string().optional().describe("An optional prompt to guide the story generation."),
});
export type StoryInput = z.infer<typeof StoryInputSchema>;

export const StoryOutputSchema = z.object({
  story: z.string().describe("A short, creative story about the character in the image."),
});
export type StoryOutput = z.infer<typeof StoryOutputSchema>;
