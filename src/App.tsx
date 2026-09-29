import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { PromptBuilder } from './components/PromptBuilder';
import { MockupStudio } from './components/MockupStudio';
import { LifestyleStudio } from './components/LifestyleStudio';
import { DesignGallery } from './components/DesignGallery';
import { GeneratedDesign } from './types';
import { generateProductMockupCanvas, triggerDownload } from './utils/exportMockup';

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
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('prompt-studio');
  const [designs, setDesigns] = useState<GeneratedDesign[]>([INITIAL_VITRAIL_DESIGN]);
  const [activeDesign, setActiveDesign] = useState<GeneratedDesign>(INITIAL_VITRAIL_DESIGN);

  // When a new design is generated or selected -> auto navigate to mockups
  const handleDesignGenerated = (newDesign: GeneratedDesign) => {
    setDesigns((prev) => [newDesign, ...prev]);
    setActiveDesign(newDesign);
    setActiveTab('mockup-studio');
  };

  const handleSelectDesign = (design: GeneratedDesign) => {
    setActiveDesign(design);
    setActiveTab('mockup-studio');
  };

  const handleUploadDesign = (uploadedDesign: GeneratedDesign) => {
    setDesigns((prev) => [uploadedDesign, ...prev]);
    setActiveDesign(uploadedDesign);
    // Instant automatic transition to iPhone + Samsung mockups on upload!
    setActiveTab('mockup-studio');
  };

  // Quick export from Header (Exports both iPhone + Samsung)
  const handleQuickExport = async () => {
    if (!activeDesign) return;
    try {
      const iphoneDataUrl = await generateProductMockupCanvas({
        artworkUrl: activeDesign.imageUrl,
        device: 'iphone-16-pro',
        finish: 'liquid-gloss',
        frameColorId: 'obsidian-black',
        showMagsafe: false,
        glossIntensity: 80,
      });
      triggerDownload(iphoneDataUrl, `iphone-16-pro-mockup-${Date.now()}.png`);

      setTimeout(async () => {
        const samsungDataUrl = await generateProductMockupCanvas({
          artworkUrl: activeDesign.imageUrl,
          device: 'samsung-s25-ultra',
          finish: 'liquid-gloss',
          frameColorId: 'obsidian-black',
          showMagsafe: false,
          glossIntensity: 80,
        });
        triggerDownload(samsungDataUrl, `samsung-s25-ultra-mockup-${Date.now()}.png`);
      }, 300);
    } catch (err) {
      console.error('Quick export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportCurrent={handleQuickExport}
        hasArtwork={Boolean(activeDesign)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'prompt-studio' && (
          <PromptBuilder
            onDesignGenerated={(newDesign) => {
              handleDesignGenerated(newDesign);
            }}
            activeDesign={activeDesign}
            onNavigateToMockups={() => setActiveTab('mockup-studio')}
          />
        )}

        {activeTab === 'mockup-studio' && (
          <MockupStudio
            activeDesign={activeDesign}
            onUploadNew={() => setActiveTab('design-library')}
          />
        )}

        {activeTab === 'lifestyle-studio' && (
          <LifestyleStudio
            activeDesign={activeDesign}
            onNavigateToGallery={() => setActiveTab('design-library')}
          />
        )}

        {activeTab === 'design-library' && (
          <DesignGallery
            designs={designs}
            activeDesignId={activeDesign?.id || ''}
            onSelectDesign={handleSelectDesign}
            onUploadDesign={handleUploadDesign}
            onOpenMockupStudio={() => setActiveTab('mockup-studio')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>CaseCraft Studio • Automatic iPhone & Samsung Phone Case Mockup Generator</p>
      </footer>
    </div>
  );
}
