'use server';

export async function searchAnime(query: string) {
    if (!query) {
        return [];
    }
    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=7&order_by=popularity&sort=asc`);
        if (!response.ok) {
            return [];
        }
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Jikan search error:", error);
        return [];
    }
}
