"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import {
  Download,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type WaifuImImage = {
  url: string;
};

type WaifuImResponse = {
  images: WaifuImImage[];
};

// A single, comprehensive list of categories from waifu.im, sorted for the UI
const ALL_CATEGORIES = [
  "waifu",
  "maid",
  "uniform",
  "selfies",
  "marin-kitagawa",
  "raiden-shogun",
  "mori-calliope",
  "oppai",
  "ass",
  "hentai",
  "milf",
  "oral",
  "paizuri",
  "ecchi",
  "ero",
].sort();

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isNsfw, setIsNsfw] = useState(false);
  const [category, setCategory] = useState("waifu");
  const [isGenerating, startGenerating] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isGalleryLoading, startGalleryLoading] = useTransition();

  // This single, robust function handles all API calls to waifu.im
  const fetchData = useCallback(
    async (isMany: boolean) => {
      const endpoint = new URL("https://api.waifu.im/search");
      endpoint.searchParams.set("included_tags", category);
      endpoint.searchParams.set("is_nsfw", String(isNsfw));
      if (isMany) {
        endpoint.searchParams.set("many", "true");
      }

      try {
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status}. Please try a different category or filter.`
          );
        }

        const data: WaifuImResponse = await response.json();

        if (!data.images || data.images.length === 0) {
          return { success: true, images: [], message: "No images found for this selection." };
        }
        
        return { success: true, images: data.images.map((img) => img.url) };

      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        return { success: false, images: [], message };
      }
    },
    [category, isNsfw]
  );

  const fetchAndSetImage = useCallback(() => {
    startGenerating(async () => {
      setIsLoading(true);
      setError(null);
      const result = await fetchData(false);
      setIsLoading(false);
      
      if (result.success) {
        if (result.images.length > 0) {
          setImageUrl(result.images[0]);
        } else {
          setImageUrl(null);
          setError(result.message ?? "No image found.");
        }
      } else {
        setImageUrl(null);
        setError(result.message);
        toast({ variant: "destructive", title: "Error fetching image", description: result.message });
      }
    });
  }, [fetchData, toast]);

  const fetchAndSetGallery = useCallback((isInitial: boolean) => {
      startGalleryLoading(async () => {
        const result = await fetchData(true);
        if(result.success) {
            if (isInitial) {
                setGalleryImages(result.images);
                if (result.images.length === 0) {
                    toast({ title: "Lobby Empty", description: result.message });
                }
            } else {
                setGalleryImages(prev => [...new Set([...prev, ...result.images])]);
            }
        } else {
             toast({ variant: "destructive", title: "Error loading gallery", description: result.message });
        }
      });
  }, [fetchData, toast]);


  useEffect(() => {
    fetchAndSetImage();
    fetchAndSetGallery(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNsfw, category]);

  const handleImageDownload = (url: string | null) => {
    if (!url) return;
    try {
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = url.split("/").pop() || "waifu.jpg";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(blobUrl);
            a.remove();
            toast({
              title: "Download Started",
              description: "Your image is being downloaded.",
            });
        })
        .catch(error => {
            console.error("Download failed:", error);
            toast({
              variant: "destructive",
              title: "Download Failed",
              description: "Could not download the image. Please try again.",
            });
        });
    } catch (error) {
      console.error("Download setup failed:", error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "Could not start download.",
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-body">
      <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
            WaifuVault
          </h1>
          <p className="text-white/80 max-w-md mx-auto drop-shadow-md">
            Discover a new anime character image with every click.
          </p>
        </div>

        <div className="w-full max-w-md lg:max-w-lg bg-white/10 backdrop-blur-2xl p-6 rounded-2xl shadow-2xl border border-white/20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-6">
            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              <Switch id="nsfw-toggle" checked={isNsfw} onCheckedChange={setIsNsfw} />
              <Label htmlFor="nsfw-toggle">NSFW</Label>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchAndSetImage} disabled={isGenerating || isLoading} className="w-full transition-transform active:scale-95 bg-primary/80 hover:bg-primary text-primary-foreground font-bold">
              {isGenerating || isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>

          <div className="block w-full aspect-square relative bg-black/20 rounded-lg overflow-hidden border-2 border-white/20">
            {isLoading ? (
              <Skeleton className="w-full h-full bg-white/10" />
            ) : imageUrl ? (
              <Image
                key={imageUrl}
                src={imageUrl}
                alt="Waifu"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p className="text-center">{error || "No image to display"}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mt-6 justify-center">
            <Button variant="outline" onClick={() => handleImageDownload(imageUrl)} disabled={!imageUrl || isLoading || isGenerating} className="transition-transform active:scale-95">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </main>

      <section className="pb-16">
        <div className="w-full max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">Lobby</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(isGalleryLoading && galleryImages.length === 0) ? (
              Array.from({ length: 30 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg bg-white/10" />)
            ) : (
              galleryImages.map((imgUrl, index) => (
                <div key={`${imgUrl}-${index}`} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10 shadow-lg">
                  <Image
                    src={imgUrl}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleImageDownload(imgUrl)}
                      className="text-white border-white/50 bg-black/20 hover:bg-black/40 hover:text-white backdrop-blur-sm -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
                    >
                      <Download className="h-5 w-5" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
           <div className="text-center mt-8">
            <Button onClick={() => fetchAndSetGallery(false)} disabled={isGalleryLoading} className="transition-transform active:scale-95 bg-primary/80 hover:bg-primary text-primary-foreground font-bold">
              {isGalleryLoading && galleryImages.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Load More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
