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

type WaifuImage = {
  url: string;
};

type WaifuManyImage = {
  files: string[];
}

const SFW_CATEGORIES = ["waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "awoo", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill", "kick", "happy", "wink", "poke", "dance", "cringe"];
const NSFW_CATEGORIES = ["waifu", "neko", "trap", "blowjob"];

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

  const availableCategories = isNsfw ? NSFW_CATEGORIES : SFW_CATEGORIES;

  const fetchImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const type = isNsfw ? "nsfw" : "sfw";
      const currentCategory = availableCategories.includes(category) ? category : availableCategories[0];
      if (category !== currentCategory) {
        setCategory(currentCategory);
      }
      
      const response = await fetch(`https://api.waifu.pics/${type}/${currentCategory}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch waifu image (status: ${response.status}).`);
      }
      const data: WaifuImage = await response.json();
      setImageUrl(data.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isNsfw, category, availableCategories, toast]);

  const fetchGalleryImages = useCallback((isInitial: boolean, currentImages: string[]) => {
    startGalleryLoading(async () => {
       try {
        const type = isNsfw ? "nsfw" : "sfw";
        const currentCategory = availableCategories.includes(category) ? category : availableCategories[0];

        const response = await fetch(`https://api.waifu.pics/many/${type}/${currentCategory}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exclude: isInitial ? [] : currentImages })
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch gallery images (status: ${response.status}).`);
        }
        const data: WaifuManyImage = await response.json();
        
        if (isInitial) {
          setGalleryImages(data.files);
        } else {
          setGalleryImages(prev => [...prev, ...data.files]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        toast({
          variant: "destructive",
          title: "Could not load gallery.",
          description: message,
        });
      }
    });
  }, [isNsfw, category, availableCategories, toast, startGalleryLoading]);
  
  useEffect(() => {
    startGenerating(() => {
      fetchImage();
    });
    fetchGalleryImages(true, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNsfw, category]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = imageUrl.split("/").pop() || "waifu.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download the image.",
      });
    }
  };
  
  const handleGenerateClick = () => {
      startGenerating(() => {
        fetchImage();
      });
  };

  return (
    <div className="bg-background text-foreground font-body">
      <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2 tracking-tight">
            WaifuVault
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover a new anime character image with every click.
          </p>
        </div>

        <div className="w-full max-w-md lg:max-w-lg bg-card p-6 rounded-2xl shadow-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-6">
            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              <Switch id="nsfw-toggle" checked={isNsfw} onCheckedChange={(checked) => {
                  const newCategory = (checked ? NSFW_CATEGORIES : SFW_CATEGORIES)[0];
                  setIsNsfw(checked);
                  setCategory(newCategory);
              }} />
              <Label htmlFor="nsfw-toggle">NSFW</Label>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateClick} disabled={isGenerating || isLoading} className="w-full transition-transform active:scale-95">
              {isGenerating || isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>

          <div className="block w-full aspect-square relative bg-muted rounded-lg overflow-hidden">
            {isLoading || isGenerating ? (
              <Skeleton className="w-full h-full" />
            ) : imageUrl ? (
              <Image
                key={imageUrl}
                src={imageUrl}
                alt="Waifu"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain transition-opacity duration-500 opacity-0"
                onLoadingComplete={(image) => image.classList.remove("opacity-0")}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p className="text-center">{error || "No image to display"}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6 justify-center">
            <Button variant="outline" onClick={handleDownload} disabled={!imageUrl || isLoading || isGenerating} className="transition-transform active:scale-95">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </main>

      <section className="pb-16">
        <div className="w-full max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-primary">Lobby</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(isGalleryLoading && galleryImages.length === 0) ? (
              Array.from({ length: 30 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)
            ) : (
              galleryImages.map((imgUrl, index) => (
                <div key={`${imgUrl}-${index}`} className="relative aspect-square rounded-lg overflow-hidden group border">
                  <Image
                    src={imgUrl}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
                  />
                </div>
              ))
            )}
          </div>
           <div className="text-center mt-8">
            <Button onClick={() => fetchGalleryImages(false, galleryImages)} disabled={isGalleryLoading} className="transition-transform active:scale-95">
              {isGalleryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Load More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
