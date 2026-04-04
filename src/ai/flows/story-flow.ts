'use server';
/**
 * @fileOverview Generates a story based on an image.
 *
 * - generateStory - A function that generates a story for a character in an image.
 * - StoryInput - The input type for the generateStory function.
 * - StoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import { StoryInputSchema, StoryOutputSchema, type StoryInput, type StoryOutput } from './story-types';

const storyPrompt = ai.definePrompt({
  name: 'waifuStoryPrompt',
  input: {schema: StoryInputSchema},
  output: {schema: StoryOutputSchema},
  prompt: `You are a creative storyteller. Look at the character in the image and write a short, imaginative story (2-3 paragraphs) about them.
  
  {{#if prompt}}
  Incorporate the following theme or idea into the story: {{{prompt}}}
  {{/if}}

  Image: {{media url=imageUrl}}`,
});


const storyFlow = ai.defineFlow(
  {
    name: 'storyFlow',
    inputSchema: StoryInputSchema,
    outputSchema: StoryOutputSchema,
  },
  async (input) => {
    const {output} = await storyPrompt(input);
    return output!;
  }
);

export async function generateStory(input: StoryInput): Promise<StoryOutput> {
  return storyFlow(input);
}
