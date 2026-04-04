"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import {
  Download,
  Info,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getAnimeDetails } from "@/lib/actions";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type WaifuImage = {
  url: string;
};

type AnimeDetails = Awaited<ReturnType<typeof getAnimeDetails>>;

const SFW_CATEGORIES = ["waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "awoo", "kiss", "lick", "pat", "smug"];
const NSFW_CATEGORIES = ["waifu", "neko", "trap", "blowjob"];

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isNsfw, setIsNsfw] = useState(false);
  const [category, setCategory] = useState("waifu");
  const [isGenerating, startGenerating] = useTransition();
  const [isDetailsLoading, startDetailsLoading] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [animeDetails, setAnimeDetails] = useState<AnimeDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

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
  
  useEffect(() => {
    startGenerating(() => {
      fetchImage();
    });
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

  const handleShowDetails = () => {
    if (!imageUrl) return;
    startDetailsLoading(async () => {
      setAnimeDetails(null);
      try {
        const details = await getAnimeDetails(imageUrl);
        setAnimeDetails(details);
      } catch (e) {
        setAnimeDetails(null);
        toast({
          variant: "destructive",
          title: "Could not fetch details",
          description: "The anime for this image could not be identified.",
        });
      }
    });
  };
  
  const handleGenerateClick = () => {
      startGenerating(() => {
        fetchImage();
      });
  };

  return (
    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 font-body">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2 tracking-tight">
            WaifuVault
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Discover a new anime character image with every click. Find out which anime they are from and more.
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
            <Button onClick={handleGenerateClick} disabled={isGenerating || isLoading} className="w-full">
              {isGenerating || isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>

          <DialogTrigger asChild>
            <button type="button" onClick={handleShowDetails} className="block w-full aspect-square relative bg-muted rounded-lg overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
              {isLoading || isGenerating ? (
                <Skeleton className="w-full h-full" />
              ) : imageUrl ? (
                <Image
                  key={imageUrl}
                  src={imageUrl}
                  alt="Waifu"
                  fill
                  className="object-contain transition-opacity duration-500 opacity-0 group-hover:opacity-80"
                  onLoadingComplete={(image) => image.classList.remove("opacity-0")}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ImageIcon className="w-16 h-16 mb-4" />
                  <p className="text-center">{error || "No image to display"}</p>
                </div>
              )}
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Info className="h-8 w-8 text-white" />
              </div>
            </button>
          </DialogTrigger>

          <div className="flex gap-4 mt-6 justify-center">
            <Button variant="outline" onClick={handleDownload} disabled={!imageUrl || isLoading || isGenerating}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </main>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anime Details</DialogTitle>
          <DialogDescription>
            Information about the anime this character is from. Accuracy may vary.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isDetailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : animeDetails ? (
            <div className="space-y-2 text-sm">
                <p>
                    <span className="font-semibold text-primary">Title:</span> {animeDetails.title}
                </p>
                <p>
                    <span className="font-semibold text-primary">Romaji:</span> {animeDetails.romajiTitle}
                </p>
                <p>
                    <span className="font-semibold text-primary">Native:</span> {animeDetails.nativeTitle}
                </p>
                {animeDetails.startDate.year > 0 && <p>
                    <span className="font-semibold text-primary">Aired:</span>{" "}
                    {new Date(
                        animeDetails.startDate.year,
                        (animeDetails.startDate.month || 1) - 1,
                        animeDetails.startDate.day || 1
                    ).toLocaleDateString("en-US", { dateStyle: "long" })}
                </p>}
                <p>
                    <span className="font-semibold text-primary">Episode:</span> {animeDetails.episode}
                </p>
                <p className="flex items-center">
                    <span className="font-semibold text-primary mr-2">Match Similarity:</span>
                    <Badge variant={animeDetails.similarity > 0.9 ? 'default' : 'secondary'}>
                        {(animeDetails.similarity * 100).toFixed(2)}%
                    </Badge>
                </p>
            </div>
          ) : (
            <p>No details found. Try another image.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
