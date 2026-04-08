'use client';

// Common interface for an API source
export interface ImageApiSource {
  name: string;
  hasNsfw: boolean;
  getTags: () => Promise<{ sfw: string[]; nsfw: string[] }>;
  getImages: (params: {
    category: string;
    isNsfw: boolean;
    count: number;
  }) => Promise<{ success: boolean; images: string[]; message?: string }>;
}

// --- waifu.pics Implementation ---
const waifuPicsApi: ImageApiSource = {
  name: 'waifu.pics',
  hasNsfw: true,
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
    const url = `https://api.waifu.pics/many/${type}/${category}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exclude: [] }),
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      if (!data.files || data.files.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      return { success: true, images: data.files };
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
  hasNsfw: false, // nekos.best doesn't have an NSFW flag, categories are distinct
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

// --- waifu.im Implementation ---
const waifuImApi: ImageApiSource = {
  name: 'waifu.im',
  hasNsfw: true,
  async getTags() {
    try {
      const response = await fetch('https://api.waifu.im/tags');
      if (!response.ok) throw new Error('Failed to fetch tags from waifu.im');
      const data = await response.json();
      // The API returns versatile, sfw, and nsfw tags.
      // We'll combine versatile with sfw.
      const sfwTags = [...(data.versatile || []), ...(data.sfw || [])].filter((tag, index, self) => self.indexOf(tag) === index); // unique
      return {
        sfw: sfwTags.sort(),
        nsfw: (data.nsfw || []).sort(),
      };
    } catch (error) {
      console.error('waifu.im getTags error:', error);
      // Fallback from their docs
      return {
        sfw: ['waifu', 'maid', 'marin-kitagawa', 'mori-calliope', 'raiden-shogun', 'oppai', 'selfies', 'uniform'],
        nsfw: ['ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'ero']
      };
    }
  },
  async getImages(params) {
    const { category, isNsfw } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    // waifu.im has a 'many' flag and can return up to 30 images.
    const url = new URL('https://api.waifu.im/search');
    url.searchParams.append('included_tags', category);
    url.searchParams.append('is_nsfw', String(isNsfw));
    url.searchParams.append('many', 'true');
    // The user asked for horizontal images for NSFW content
    if (isNsfw) {
        url.searchParams.append('orientation', 'LANDSCAPE');
    }

    try {
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      if (!data.images || data.images.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      const imageUrls = data.images.map((img: any) => img.url);
      
      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("waifu.im getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

// --- Dog.ceo Implementation ---
const dogCeoApi: ImageApiSource = {
  name: 'Dog.ceo',
  hasNsfw: false,
  async getTags() {
    try {
      const response = await fetch('https://dog.ceo/api/breeds/list/all');
      if (!response.ok) throw new Error('Failed to fetch tags from Dog.ceo');
      const data = await response.json();
      const breeds = Object.keys(data.message);
      const allBreeds: string[] = [];
      for (const breed of breeds) {
        if (data.message[breed].length > 0) {
          for (const subBreed of data.message[breed]) {
            allBreeds.push(`${breed}-${subBreed}`);
          }
        } else {
          allBreeds.push(breed);
        }
      }
      return { sfw: allBreeds.sort(), nsfw: [] };
    } catch (error) {
      console.error('Dog.ceo getTags error:', error);
      // A fallback list
      return { sfw: ['affenpinscher', 'african', 'airedale', 'akita', 'appenzeller', 'australian-shepherd', 'basenji', 'beagle', 'bluetick', 'borzoi', 'bouvier', 'boxer', 'brabancon', 'briard', 'buhund-norwegian', 'bulldog-boston', 'bulldog-english', 'bulldog-french', 'bullterrier-staffordshire', 'cattledog-australian', 'chihuahua', 'chow', 'clumber', 'cockapoo', 'collie-border', 'coonhound', 'corgi-cardigan', 'cotondetulear', 'dachshund', 'dalmatian', 'dane-great', 'deerhound-scottish', 'dhole', 'dingo', 'doberman', 'elkhound-norwegian', 'entlebucher', 'eskimo', 'finnish-lapphund', 'frise-bichon', 'germanshepherd', 'greyhound-italian', 'groenendael', 'havanese', 'hound-afghan', 'hound-basset', 'hound-blood', 'hound-english', 'hound-ibizan', 'hound-plott', 'hound-walker', 'husky', 'keeshond', 'kelpie', 'komondor', 'kuvasz', 'labradoodle', 'labrador', 'leonberg', 'lhasa', 'malamute', 'malinois', 'maltese', 'mastiff-bull', 'mastiff-english', 'mastiff-tibetan', 'mexicanhairless', 'mix', 'mountain-bernese', 'mountain-swiss', 'newfoundland', 'otterhound', 'ovcharka-caucasian', 'papillon', 'pekinese', 'pembroke', 'pinscher-miniature', 'pitbull', 'pointer-german', 'pointer-germanlonghair', 'pomeranian', 'poodle-miniature', 'poodle-standard', 'poodle-toy', 'pug', 'puggle', 'pyrenees', 'redbone', 'retriever-chesapeake', 'retriever-curly', 'retriever-flatcoated', 'retriever-golden', 'ridgeback-rhodesian', 'rottweiler', 'saluki', 'samoyed', 'schipperke', 'schnauzer-giant', 'schnauzer-miniature', 'setter-english', 'setter-gordon', 'setter-irish', 'sheepdog-english', 'sheepdog-shetland', 'shiba', 'shihtzu', 'spaniel-blenheim', 'spaniel-brittany', 'spaniel-cocker', 'spaniel-irish', 'spaniel-japanese', 'spaniel-sussex', 'spaniel-welsh', 'springer-english', 'stbernard', 'terrier-american', 'terrier-australian', 'terrier-bedlington', 'terrier-border', 'terrier-cairn', 'terrier-dandie', 'terrier-fox', 'terrier-irish', 'terrier-kerryblue', 'terrier-lakeland', 'terrier-norfolk', 'terrier-norwich', 'terrier-patterdale', 'terrier-russell', 'terrier-scottish', 'terrier-sealyham', 'terrier-silky', 'terrier-tibetan', 'terrier-toy', 'terrier-welsh', 'terrier-westhighland', 'terrier-wheaten', 'terrier-yorkshire', 'tervuren', 'vizsla', 'waterdog-spanish', 'weimaraner', 'whippet', 'wolfhound-irish'], nsfw: [] };
    }
  },
  async getImages(params) {
    const { category, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    const breed = category.replace('-', '/');
    const url = `https://dog.ceo/api/breed/${breed}/images/random/${count}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      if (data.status !== 'success' || !data.message || data.message.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      return { success: true, images: data.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Dog.ceo getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

export const apiSources: { [key: string]: ImageApiSource } = {
  'waifu.pics': waifuPicsApi,
  'waifu.im': waifuImApi,
  'nekos.life': nekosLifeApi,
  'nekos.best': nekosBestApi,
  'dog.ceo': dogCeoApi,
};
