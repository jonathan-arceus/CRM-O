import { useEffect } from 'react';
import { useOrganization } from './useOrganization';

export function useTheme() {
  const { settings, loading } = useOrganization();

  useEffect(() => {
    if (loading || !settings) return;

    const root = document.documentElement;

    // Apply theme mode
    if (settings.theme_mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply custom colors if in custom mode or override defaults
    if (settings.primary_color) {
      const primaryHsl = hexToHSL(settings.primary_color);
      if (primaryHsl) {
        root.style.setProperty('--primary', primaryHsl);
        root.style.setProperty('--ring', primaryHsl);
        root.style.setProperty('--sidebar-primary', primaryHsl);
      }
    }

    if (settings.secondary_color) {
      const secondaryHsl = hexToHSL(settings.secondary_color);
      if (secondaryHsl) {
        root.style.setProperty('--accent', secondaryHsl);
      }
    }

    // Apply button style
    switch (settings.button_style) {
      case 'square':
        root.style.setProperty('--radius', '0rem');
        break;
      case 'pill':
        root.style.setProperty('--radius', '9999px');
        break;
      case 'rounded':
      default:
        root.style.setProperty('--radius', '0.625rem');
    }
  }, [settings, loading]);

  return { settings, loading };
}

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string | null {
  try {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex values
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    // Return HSL values without the hsl() wrapper for CSS custom properties
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  } catch {
    return null;
  }
}

export function hslToHex(hsl: string): string {
  try {
    const parts = hsl.split(' ');
    const h = parseInt(parts[0]) / 360;
    const s = parseInt(parts[1]) / 100;
    const l = parseInt(parts[2]) / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch {
    return '#8B5CF6';
  }
}
