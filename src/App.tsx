import React, { useState } from 'react';
import { Header } from './components/Header';
import { DesignStudio } from './components/DesignStudio';
import { GeneratedDesign } from './types';

const INITIAL_VITRAIL_DESIGN: GeneratedDesign = {
  id: 'preset-sample-vitrail-01',
  title: 'Kitsune Samurai (Stained Glass)',
  prompt: `A breathtaking 2D anime illustration of celestial fox spirit samurai dual-wielding glowing katanas in a dynamic mid-air leap

surrounded by cherry blossoms and weeping wisteria branches, and a spirit fox with nine flame tails.

The entire composition is designed in an intricate, vibrant stained glass
(vitrail) mosaic style.

Thick, elegant black outlines, translucent and luminous
deep sapphire indigo, vibrant crimson, luminous gold, and ethereal cyan.

High-detail anime art style infused with Art Nouveau
art nouveau brass filigree frame with celestial star constellations borders.

Flat lay, purely 2D graphic design, completely flat background.

Centered vertical composition, perfectly cropped for a rectangular print canvas.

No shading or 3D depth outside of the anime illustration style.

Aspect ratio: 9:16.

Do not include:
phone, phone case, mockup, device, shadows, 3D render, realistic photography.`,
  imageUrl: '/src/assets/images/sample_vitrail_pure2d_1790462384613.jpg',
  niche: 'Anime Vitrail (Stained Glass)',
  createdAt: Date.now(),
  placeholders: {
    SUBJECT_POSE:
      'celestial fox spirit samurai dual-wielding glowing katanas in a dynamic mid-air leap',
    BOTANICAL: 'cherry blossoms and weeping wisteria branches',
    COMPANION: 'spirit fox with nine flame tails',
    COLOR_PALETTE: 'deep sapphire indigo, vibrant crimson, luminous gold, and ethereal cyan',
    BORDER_THEME: 'art nouveau brass filigree frame with celestial star constellations',
  },
  isPreset: true,
  aspectRatio: '9:16',
};

export default function App() {
  const [designs, setDesigns] = useState<GeneratedDesign[]>([INITIAL_VITRAIL_DESIGN]);
  const [activeDesign, setActiveDesign] = useState<GeneratedDesign | null>(INITIAL_VITRAIL_DESIGN);
  const [resetKey, setResetKey] = useState<number>(0);

  const handleDesignGenerated = (newDesign: GeneratedDesign) => {
    setDesigns((prev) => {
      const exists = prev.some((d) => d.id === newDesign.id);
      if (exists) {
        return prev.map((d) => (d.id === newDesign.id ? newDesign : d));
      }
      return [newDesign, ...prev];
    });
    setActiveDesign(newDesign);
  };

  const handleSelectDesign = (design: GeneratedDesign) => {
    setActiveDesign(design);
  };

  const handleDeleteDesign = (id: string) => {
    setDesigns((prev) => {
      const filtered = prev.filter((d) => d.id !== id);
      if (activeDesign?.id === id) {
        setActiveDesign(filtered.length > 0 ? filtered[0] : null);
      }
      return filtered;
    });
  };

  const handleReset = () => {
    setResetKey((prev) => prev + 1);
  };

  const handleDownloadCurrent = () => {
    if (!activeDesign) return;
    const link = document.createElement('a');
    link.href = activeDesign.imageUrl;
    link.download = `${activeDesign.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        onReset={handleReset}
        onDownloadCurrent={activeDesign ? handleDownloadCurrent : undefined}
        hasArtwork={Boolean(activeDesign)}
        activeDesignTitle={activeDesign?.title}
      />

      {/* Main Design Studio Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DesignStudio
          key={resetKey}
          activeDesign={activeDesign}
          designs={designs}
          onSelectDesign={handleSelectDesign}
          onDeleteDesign={handleDeleteDesign}
          onDesignGenerated={handleDesignGenerated}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>
          CaseCraft Design Studio • Powered by{' '}
          <a
            href="https://pollinations.ai"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:underline"
          >
            Pollinations API
          </a>
        </p>
      </footer>
    </div>
  );
}
