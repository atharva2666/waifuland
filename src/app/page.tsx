"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import {
  Download,
  RefreshCw,
  Loader2,
  ImageIcon,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSources } from "./waifu-api";
import { MediaPlayer } from "@/components/media-player";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const IMAGE_FETCH_COUNT = 30;

export default function Home() {
  const [apiSourceKey, setApiSourceKey] = useState(Object.keys(apiSources)[0]);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [sfwCategories, setSfwCategories] = useState<string[]>([]);
  const [nsfwCategories, setNsfwCategories] = useState<string[]>([]);

  const [isNsfw, setIsNsfw] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const { toast } = useToast();

  const [showBackToTop, setShowBackToTop] = useState(false);

  const apiSource = apiSources[apiSourceKey];

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    async function getTags() {
      setGalleryImages([]);
      setActiveCategory("");
      setSfwCategories([]);
      setNsfwCategories([]);

      const { sfw, nsfw } = await apiSource.getTags();
      setSfwCategories(sfw);
      setNsfwCategories(nsfw);

      let currentList = sfw;
      if (isNsfw && apiSource.hasNsfw) {
        currentList = nsfw;
      }

      if (currentList.length > 0) {
        setActiveCategory(currentList[0]);
      }
    }
    getTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSourceKey]);

  const fetchAndSetGallery = useCallback(
    async (isNewSearch = false) => {
      if (!activeCategory) return;

      startGenerating(async () => {
        if (isNewSearch) {
          setGalleryImages([]);
        }

        const result = await apiSource.getImages({
          category: activeCategory,
          isNsfw: isNsfw && apiSource.hasNsfw,
          count: IMAGE_FETCH_COUNT,
        });

        if (result.success) {
          if (result.images.length > 0) {
            if (isNewSearch) {
              setGalleryImages(result.images);
            } else {
              setGalleryImages((prev) => [
                ...new Set([...prev, ...result.images]),
              ]);
            }
          } else {
            if (isNewSearch) setGalleryImages([]);
            toast({
              title: "No bitches found",
              description: result.message || "Try another category or toggle.",
            });
          }
        } else {
          if (isNewSearch) setGalleryImages([]);
          toast({
            variant: "destructive",
            title: "Error fetching images",
            description: result.message,
          });
        }
      });
    },
    [activeCategory, isNsfw, toast, apiSource]
  );

  useEffect(() => {
    const currentList =
      isNsfw && apiSource.hasNsfw ? nsfwCategories : sfwCategories;
    if (currentList.length > 0 && !currentList.includes(activeCategory)) {
      setActiveCategory(currentList[0]);
    } else if (activeCategory) {
      fetchAndSetGallery(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNsfw]);

  useEffect(() => {
    if (activeCategory) {
      fetchAndSetGallery(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const handleImageDownload = (url: string | null) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const handlePasswordSubmit = () => {
    if (password === "nsfw") {
      setIsNsfw(true);
      setIsPasswordDialogOpen(false);
      setPassword("");
      toast({
        title: "Access Granted",
        description: "Let the games begin.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect Password",
        description: "Wrong key, try again.",
      });
      setPassword("");
    }
  };

  const currentCategories =
    isNsfw && apiSource.hasNsfw ? nsfwCategories : sfwCategories;

  return (
    <div className="min-h-screen w-full font-body">
      <main className="w-full p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground drop-shadow-md">
              Olivia
            </h1>
            <p className="text-muted-foreground mt-1">
              made by Coderbee0_Ggs( Atharva Bhatnagar) and other provider
            </p>
          </div>

          <div className="py-4 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border bg-card p-4">
              <div className="flex items-center gap-4 self-start sm:self-center">
                <Label
                  htmlFor="api-source"
                  className="text-base font-medium text-foreground whitespace-nowrap"
                >
                  API Source
                </Label>
                <Select value={apiSourceKey} onValueChange={setApiSourceKey}>
                  <SelectTrigger className="w-[180px] bg-transparent border-input hover:bg-accent hover:text-accent-foreground">
                    <SelectValue placeholder="Select an API" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(apiSources).map((key) => (
                      <SelectItem key={key} value={key}>
                        {apiSources[key].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {apiSource.hasNsfw && (
                <div className="flex items-center gap-4 self-start sm:self-center">
                  <Label
                    htmlFor="nsfw-toggle"
                    className="text-base font-medium text-foreground whitespace-nowrap"
                  >
                    Secret Mode
                  </Label>
                  <Switch
                    id="nsfw-toggle"
                    checked={isNsfw}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setIsPasswordDialogOpen(true);
                      } else {
                        setIsNsfw(false);
                      }
                    }}
                  />
                </div>
              )}
              <Separator
                orientation="vertical"
                className="h-8 hidden sm:block"
              />
              <div className="flex-1 w-full sm:w-auto">
                <ScrollArea className="w-full">
                  <div className="flex items-center gap-2 pb-2">
                    {currentCategories.length > 0 ? (
                      currentCategories.map((cat) => (
                        <Button
                          key={cat}
                          variant={
                            activeCategory === cat ? "secondary" : "outline"
                          }
                          onClick={() => setActiveCategory(cat)}
                          className="justify-start capitalize shrink-0 bg-transparent"
                        >
                          {cat.replace(/_/g, " ")}
                        </Button>
                      ))
                    ) : (
                      Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-10 w-24 rounded-md bg-muted"
                        />
                      ))
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>
          </div>

          <div className="flex-grow">
            {isGenerating && galleryImages.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[9/16] rounded-lg">
                    <Skeleton className="w-full h-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : galleryImages.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map((imgUrl, index) => (
                    <div
                      key={`${imgUrl}-${index}`}
                      className="relative rounded-lg overflow-hidden group border bg-card shadow-lg aspect-[9/16] cursor-pointer"
                      onClick={() => window.open(imgUrl, "_blank")}
                    >
                      <div className="w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105">
                        <MediaPlayer
                          src={imgUrl}
                          alt={`Gallery image ${index + 1}`}
                          priority={index < 8}
                          objectFit="cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageDownload(imgUrl);
                          }}
                          className="text-foreground border-border/50 bg-background/20 hover:bg-background/40 hover:text-foreground backdrop-blur-sm h-12 w-12 rounded-full"
                        >
                          <Download className="h-6 w-6" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-8">
                  <Button
                    onClick={() => fetchAndSetGallery(false)}
                    disabled={isGenerating || !activeCategory}
                    className="transition-transform active:scale-95 bg-primary/80 hover:bg-primary text-primary-foreground font-bold text-base py-6 px-8"
                  >
                    {isGenerating && galleryImages.length > 0 ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Load More Images
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground bg-card rounded-lg w-full">
                <ImageIcon className="w-16 h-16 mb-4 text-muted-foreground/30" />
                <p className="text-center text-foreground/70">
                  It's empty in here...
                </p>
                <p className="text-center text-muted-foreground text-sm">
                  Select a category to get the party started.
                </p>
              </div>
            )}
          </div>
        </div>
        <AlertDialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Secret Mode</AlertDialogTitle>
              <AlertDialogDescription>
                This action requires a password to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPassword("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handlePasswordSubmit}>
                Enter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            variant="secondary"
            size="icon"
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50"
          >
            <ChevronUp className="h-8 w-8" />
            <span className="sr-only">Back to top</span>
          </Button>
        )}
      </main>
    </div>
  );
}
