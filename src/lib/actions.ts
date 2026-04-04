"use server";

import { z } from "zod";

const TraceMoeResultSchema = z.object({
  anilist: z.number(),
  filename: z.string(),
  episode: z.union([z.number(), z.string(), z.array(z.number())]).optional(),
  from: z.number(),
  to: z.number(),
  similarity: z.number(),
  video: z.string(),
  image: z.string(),
});

const TraceMoeResponseSchema = z.object({
  frameCount: z.number(),
  error: z.string(),
  result: z.array(TraceMoeResultSchema),
});

const AniListMediaSchema = z.object({
  title: z.object({
    romaji: z.string(),
    english: z.string().nullable(),
    native: z.string(),
  }),
  startDate: z.object({
    year: z.number().nullable(),
    month: z.number().nullable(),
    day: z.number().nullable(),
  }),
});

const AniListResponseSchema = z.object({
  data: z.object({
    Media: AniListMediaSchema,
  }),
});

export async function getAnimeDetails(imageUrl: string) {
  try {
    const traceMoeUrl = `https://api.trace.moe/search?anilistInfo&url=${encodeURIComponent(imageUrl)}`;
    const traceResponse = await fetch(traceMoeUrl);

    if (!traceResponse.ok) {
      console.error(`trace.moe error: ${traceResponse.statusText}`);
      throw new Error("Failed to get data from trace.moe");
    }

    const traceData = TraceMoeResponseSchema.parse(await traceResponse.json());
    if (traceData.error || traceData.result.length === 0) {
      console.error(`trace.moe error: ${traceData.error}`);
      throw new Error("No anime found for this image.");
    }
    
    const bestMatch = traceData.result[0];

    const query = `
      query ($id: Int) {
        Media (id: $id, type: ANIME) {
          title {
            romaji
            english
            native
          }
          startDate {
            year
            month
            day
          }
        }
      }
    `;

    const variables = {
      id: bestMatch.anilist,
    };

    const anilistResponse = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: query,
        variables: variables,
      }),
    });

    if (!anilistResponse.ok) {
        console.error(`AniList error: ${anilistResponse.statusText}`);
        throw new Error("Failed to get data from AniList");
    }

    const anilistData = AniListResponseSchema.parse(await anilistResponse.json());
    const media = anilistData.data.Media;

    return {
      title: media.title.english || media.title.romaji,
      romajiTitle: media.title.romaji,
      nativeTitle: media.title.native,
      startDate: {
        year: media.startDate.year || 0,
        month: media.startDate.month || 0,
        day: media.startDate.day || 0,
      },
      similarity: bestMatch.similarity,
      episode: Array.isArray(bestMatch.episode) ? `${bestMatch.episode[0]}-${bestMatch.episode[1]}` : bestMatch.episode ?? 'Unknown',
    };
  } catch (error) {
    console.error("Error fetching anime details:", error);
    if (error instanceof z.ZodError) {
        console.error("Zod validation error:", error.issues);
    }
    throw new Error("Could not fetch anime details.");
  }
}
