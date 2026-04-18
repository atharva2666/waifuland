'use client';

// Common interface for an API source
export interface ImageApiSource {
  name: string;
  hasNsfw: boolean;
  sortingSupported: boolean;
  getTags: () => Promise<{ sfw: string[]; nsfw: string[] }>;
  getImages: (params: {
    category: string;
    isNsfw: boolean;
    count: number;
    page: number;
    sort?: string;
  }) => Promise<{ success: boolean; images: string[]; message?: string }>;
}

// --- Anime (General) Implementation using Danbooru ---
const animeApi: ImageApiSource = {
  name: 'Anime',
  hasNsfw: true,
  sortingSupported: true,
  async getTags() {
    const sfwTags = [
        '1boy',
        '1girl',
        'solo',
        'genshin_impact',
        'hololive',
        'arknights',
        'azur_lane',
        'fate/grand_order',
        'touhou',
        'vocaloid',
        'original',
        'ikemen',
        'male_focus',
        'long_hair',
        'short_hair',
        'school_uniform',
        'wallpaper',
        'scenery',
        'no_humans',
        'sword',
        'weapon',
        'cat_ears',
        'fox_girl',
        'smile',
        'blush'
    ];
    const nsfwTags = [ 'breasts', 'ass', 'pussy', 'thighhighs', 'sex', 'blowjob', 'genshin_impact', 'hololive', 'panties', 'cum', 'ahegao', 'bdsm', 'yuri', 'bondage', 'school_uniform', 'anus', 'areolae', 'artist_request', 'barefoot', 'bell', 'bikini', 'bloomers', 'bodysuit', 'bra', 'cameltoe', 'censored', 'cleavage', 'close-up', 'cum_in_pussy', 'cum_on_breasts', 'cunnilingus', 'demon_girl', 'doggy_style', 'elf', 'erect_nipples', 'exposed_anus', 'fingering', 'flat_chest', 'fox_girl', 'garter_belt', 'guro', 'handjob', 'horns', 'incest', 'inverted_nipples', 'leash', 'leotard', 'lingerie', 'loli', 'maid', 'masturbation', 'missionary_position', 'monochrome', 'naked', 'navel', 'necklace', 'nipples', 'nopan', 'nude', 'on_back', 'on_stomach', 'orgy', 'paizuri', 'panty_pull', 'pantyhose', 'penis', 'pov', 'pubic_hair', 'rape', 'see-through', 'seifuku', 'sex_toy', 'shirt_lift', 'sidelocks', 'spread_legs', 'squirt', 'stomach', 'straight_on', 'striped_panties', 'succubus', 'swimsuit', 'tail', 'tentacles', 'threesome', 'tongue', 'tongue_out', 'tribadism', 'undressing', 'uniform', 'vaginal', 'very_long_hair', 'vomit', 'white_panties', 'yaoi'];
    return Promise.resolve({
        sfw: sfwTags.sort(),
        nsfw: nsfwTags.sort(),
    });
  },
  async getImages(params) {
    // This implementation is the same as Danbooru's
    const { category, isNsfw, count, page, sort } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }

    const tags = [category];
    if (isNsfw) {
      tags.push('rating:explicit');
      tags.push('ratio:>=1.2');
    } else {
      tags.push('rating:general');
    }
    
    if (sort) {
      tags.push(`order:${sort}`);
      if (sort === 'score') {
        tags.push('score:>=50');
      }
    }
    
    const url = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(tags.join(' '))}&limit=${count}&page=${page}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response.');
        throw new Error(`API Error: ${response.statusText} (${response.status}) - ${errorText}`);
      }
      const data = await response.json();

      if (!data || !Array.isArray(data) || data.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      
      const imageUrls = data
        .filter((post: any) => post.file_url)
        .map((post: any) => post.file_url);
        
      if (imageUrls.length === 0) {
        return { success: true, images: [], message: 'No valid image URLs found in the response.' };
      }

      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Danbooru (Anime) getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};


// --- Danbooru Implementation ---
const danbooruApi: ImageApiSource = {
  name: 'Danbooru',
  hasNsfw: true,
  sortingSupported: true,
  async getTags() {
    // Danbooru has millions of tags. We provide a curated list of popular SFW and NSFW tags as categories.
    const sfwTags = [ '1girl', 'solo', 'long_hair', 'smile', 'genshin_impact', 'hololive', 'touhou', 'vocaloid', 'cat_ears', 'school_uniform', 'blue_hair', 'azur_lane', 'arknights', 'fate/grand_order', 'original', 'bangs', 'blonde_hair', 'blush', 'breasts', 'brown_hair', 'hat', 'open_mouth', 'short_hair', 'skirt', 'white_hair', 'another_anime_game', 'black_hair', 'dress', 'eyebrows_visible_through_hair', 'food', 'hair_ornament', 'red_eyes', 'shirt', 'simple_background', 'sword', 'twintails', 'weapon', 'animal_ears', 'blue_eyes', 'braid', 'final_fantasy', 'gloves', 'green_hair', 'gun', 'hair_between_eyes', 'hatsune_miku', 'jewelry', 'long_sleeves', 'multiple_girls', 'pink_hair', 'purple_eyes', 'purple_hair', 'ribbon', 'thighhighs', 'wings', 'yellow_eyes'];
    const nsfwTags = [ 'breasts', 'ass', 'pussy', 'thighhighs', 'sex', 'blowjob', 'genshin_impact', 'hololive', 'panties', 'cum', 'ahegao', 'bdsm', 'yuri', 'bondage', 'school_uniform', 'anus', 'areolae', 'artist_request', 'barefoot', 'bell', 'bikini', 'bloomers', 'bodysuit', 'bra', 'cameltoe', 'censored', 'cleavage', 'close-up', 'cum_in_pussy', 'cum_on_breasts', 'cunnilingus', 'demon_girl', 'doggy_style', 'elf', 'erect_nipples', 'exposed_anus', 'fingering', 'flat_chest', 'fox_girl', 'garter_belt', 'guro', 'handjob', 'horns', 'incest', 'inverted_nipples', 'leash', 'leotard', 'lingerie', 'loli', 'maid', 'masturbation', 'missionary_position', 'monochrome', 'naked', 'navel', 'necklace', 'nipples', 'nopan', 'nude', 'on_back', 'on_stomach', 'orgy', 'paizuri', 'panty_pull', 'pantyhose', 'penis', 'pov', 'pubic_hair', 'rape', 'see-through', 'seifuku', 'sex_toy', 'shirt_lift', 'sidelocks', 'spread_legs', 'squirt', 'stomach', 'straight_on', 'striped_panties', 'succubus', 'swimsuit', 'tail', 'tentacles', 'threesome', 'tongue', 'tongue_out', 'tribadism', 'undressing', 'uniform', 'vaginal', 'very_long_hair', 'vomit', 'white_panties', 'yaoi'];
    return Promise.resolve({
        sfw: sfwTags.sort(),
        nsfw: nsfwTags.sort(),
    });
  },
  async getImages(params) {
    const { category, isNsfw, count, page, sort } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }

    const tags = [category];
    if (isNsfw) {
      tags.push('rating:explicit');
      // Filter for horizontal/landscape images
      tags.push('ratio:>=1.2');
    } else {
      tags.push('rating:general');
    }
    
    if (sort) {
      tags.push(`order:${sort}`);
      if (sort === 'score') {
        tags.push('score:>=50');
      }
    }
    
    const url = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(tags.join(' '))}&limit=${count}&page=${page}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response.');
        throw new Error(`API Error: ${response.statusText} (${response.status}) - ${errorText}`);
      }
      const data = await response.json();

      if (!data || !Array.isArray(data) || data.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      
      const imageUrls = data
        .filter((post: any) => post.file_url)
        .map((post: any) => post.file_url);
        
      if (imageUrls.length === 0) {
        return { success: true, images: [], message: 'No valid image URLs found in the response.' };
      }

      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Danbooru getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

// --- waifu.pics Implementation ---
const waifuPicsApi: ImageApiSource = {
  name: 'waifu.pics',
  hasNsfw: true,
  sortingSupported: false,
  async getTags() {
    try {
      const response = await fetch('https://api.waifu.pics/endpoints');
      if (!response.ok) throw new Error('Failed to fetch tags from waifu.pics');
      const data = await response.json();
      return {
        sfw: (data.sfw || []).sort(),
        nsfw: (data.nsfw || []).sort(),
      };
    } catch (error) {
      console.error('waifu.pics getTags error:', error);
      return {
        sfw: [ 'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe' ],
        nsfw: [ 'waifu', 'neko', 'trap', 'blowjob' ]
      };
    }
  },
  async getImages(params) {
    const { category, isNsfw, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    const type = isNsfw ? 'nsfw' : 'sfw';
    
    // waifu.pics' /many endpoint can fetch 30 at a time.
    const url = `https://api.waifu.pics/many/${type}/${category}`;

    try {
      // This API uses a POST request for bulk fetching.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exclude: [] }), // Empty body for random images, API returns up to 30.
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      
      const data = await response.json();
      const imageUrls = data.files || [];

      if (imageUrls.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      
      return { success: true, images: [...new Set(imageUrls)] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("waifu.pics getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

// --- nekos.life Implementation ---
const nekosLifeApi: ImageApiSource = {
  name: 'nekos.life',
  hasNsfw: false,
  sortingSupported: false,
  async getTags() {
    const sfw = ['neko', 'waifu', 'tickle', 'slap', 'poke', 'pat', 'lizard', 'kiss', 'hug', 'fox_girl', 'feed', 'cuddle', 'kemonomimi', 'holo', 'smug', 'baka', 'woof', 'wallpaper', 'goose', 'gecg', 'avatar'];
    return Promise.resolve({ sfw: sfw.sort(), nsfw: [] });
  },
  async getImages(params) {
    const { category, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    
    // This API returns one image per call, so we make 'count' requests in parallel.
    // This may be slow or hit rate limits.
    const url = `https://nekos.life/api/v2/img/${category}`;
    try {
      const imagePromises = Array.from({ length: count }).map(() => fetch(url, { cache: 'no-store' }));
      const responses = await Promise.all(imagePromises);
      
      const imageUrls: string[] = [];
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            imageUrls.push(data.url);
          }
        }
      }

      if (imageUrls.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      return { success: true, images: [...new Set(imageUrls)] }; // Remove duplicates
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("nekos.life getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};


// --- nekos.best Implementation ---
const nekosBestApi: ImageApiSource = {
  name: 'nekos.best',
  hasNsfw: false,
  sortingSupported: false,
  async getTags() {
    try {
      const response = await fetch('https://nekos.best/api/v2/endpoints');
      if (!response.ok) throw new Error('Failed to fetch tags from nekos.best');
      const data = await response.json();
      const categories = Object.keys(data).sort();
      return { sfw: categories, nsfw: [] };
    } catch (error) {
      console.error('nekos.best getTags error:', error);
      return { sfw: ['neko', 'kitsune', 'waifu', 'husbando', 'baka', 'bite', 'blush', 'bored', 'cry', 'cuddle', 'dance', 'facepalm', 'feed', 'handhold', 'happy', 'highfive', 'hug', 'kiss', 'laugh', 'nod', 'nom', 'nope', 'pat', 'poke', 'pout', 'punch', 'shoot', 'shrug', 'slap', 'sleep', 'smile', 'smug', 'stare', 'think', 'thumbsup', 'tickle', 'wave', 'wink', 'yeet'], nsfw: [] };
    }
  },
  async getImages(params) {
    const { category, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    const url = `https://nekos.best/api/v2/${category}?amount=${count}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      const imageUrls = data.results.map((img: any) => img.url);
      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("nekos.best getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

export const apiSources: { [key: string]: ImageApiSource } = {
  'anime': animeApi,
  'waifu.pics': waifuPicsApi,
  'danbooru': danbooruApi,
  'nekos.life': nekosLifeApi,
  'nekos.best': nekosBestApi,
};
