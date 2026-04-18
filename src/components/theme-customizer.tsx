'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const parseHsl = (hslStr: string): [number, number, number] => {
  if (!hslStr) return [0, 0, 0];
  const [h, s, l] = hslStr.replace(/%/g, '').split(' ').map(Number);
  return [h || 0, s || 0, l || 0];
};

const formatHsl = (hsl: [number, number, number]): string => {
  return `${hsl[0]} ${hsl[1]}% ${hsl[2]}%`;
};

interface ColorControlProps {
  name: string;
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
}

const ColorControl: React.FC<ColorControlProps> = ({
  name,
  value,
  onChange,
}) => {
  const [h, s, l] = value;

  const handleHueChange = (newHue: number[]) => onChange([newHue[0], s, l]);
  const handleSaturationChange = (newSat: number[]) =>
    onChange([h, newSat[0], l]);
  const handleLightnessChange = (newLight: number[]) =>
    onChange([h, s, newLight[0]]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium capitalize">{name}</h4>
        <div
          className="h-8 w-16 rounded-md border"
          style={{ backgroundColor: `hsl(${h}, ${s}%, ${l}%)` }}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Hue ({h})</Label>
        <Slider
          aria-label={`${name}-hue`}
          value={[h]}
          onValueChange={handleHueChange}
          max={360}
          step={1}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Saturation ({s}%)
        </Label>
        <Slider
          aria-label={`${name}-saturation`}
          value={[s]}
          onValueChange={handleSaturationChange}
          max={100}
          step={1}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Lightness ({l}%)
        </Label>
        <Slider
          aria-label={`${name}-lightness`}
          value={[l]}
          onValueChange={handleLightnessChange}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
};

export function ThemeCustomizer({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [colors, setColors] = useState({
    primary: [250, 80, 65],
    accent: [340, 80, 85],
    background: [240, 5, 96],
  });

  const [initialColors, setInitialColors] = useState(colors);

  // On open, get current computed styles and set them as initial state
  useEffect(() => {
    if (isOpen) {
      const rootStyle = getComputedStyle(document.documentElement);
      const currentColors = {
        primary: parseHsl(rootStyle.getPropertyValue('--primary').trim()),
        accent: parseHsl(rootStyle.getPropertyValue('--accent').trim()),
        background: parseHsl(rootStyle.getPropertyValue('--background').trim()),
      };
      setColors(currentColors);
      setInitialColors(currentColors);
    }
  }, [isOpen]);

  // Apply colors to CSS variables as they change
  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    Object.entries(colors).forEach(([name, hsl]) => {
      root.style.setProperty(
        `--${name}`,
        formatHsl(hsl as [number, number, number])
      );
    });
  }, [colors, isOpen]);

  const handleColorChange = (
    colorName: keyof typeof colors,
    value: [number, number, number]
  ) => {
    setColors((prev) => ({ ...prev, [colorName]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('user-theme', JSON.stringify(colors));
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Revert to the initial colors when the sheet was opened
    const root = document.documentElement;
    Object.entries(initialColors).forEach(([name, hsl]) => {
        if(formatHsl(hsl as [number, number, number]) === '0 0% 0%') {
            root.style.removeProperty(`--${name}`);
        } else {
            root.style.setProperty(
                `--${name}`,
                formatHsl(hsl as [number, number, number])
            );
        }
    });
    onOpenChange(false);
  };

  const handleFactoryReset = () => {
    localStorage.removeItem('user-theme');
    window.location.reload();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) handleCancel() }}>
      <SheetContent className="w-[350px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Theme Customizer</SheetTitle>
          <SheetDescription>
            Adjust the app's colors. Changes are applied live.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-6 flex-grow overflow-y-auto pr-4 -mr-4">
          <ColorControl
            name="primary"
            value={colors.primary as [number, number, number]}
            onChange={(v) => handleColorChange('primary', v)}
          />
          <Separator />
          <ColorControl
            name="accent"
            value={colors.accent as [number, number, number]}
            onChange={(v) => handleColorChange('accent', v)}
          />
          <Separator />
          <ColorControl
            name="background"
            value={colors.background as [number, number, number]}
            onChange={(v) => handleColorChange('background', v)}
          />
        </div>
        <div className="flex flex-col gap-2 pt-4 border-t">
          <Button onClick={handleSave}>Save Theme</Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="mt-4"
            onClick={handleFactoryReset}
          >
            Factory Reset
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
