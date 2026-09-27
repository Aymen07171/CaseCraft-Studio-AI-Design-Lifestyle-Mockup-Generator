import React, { useState } from 'react';
import {
  ShoppingBag,
  Tag,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Download,
  FileText,
  Target,
  Layers,
  Search,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { GeneratedDesign, EtsyListing } from '../types';

interface EtsyListingGeneratorProps {
  activeDesign: GeneratedDesign | null;
  onUpdateDesignListing?: (listing: EtsyListing) => void;
}

export const EtsyListingGenerator: React.FC<EtsyListingGeneratorProps> = ({
  activeDesign,
  onUpdateDesignListing,
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'listing' | 'tags' | 'strategy' | 'raw'>('listing');
  const [showOptions, setShowOptions] = useState<boolean>(false);

  // Customization options
  const [deviceFocus, setDeviceFocus] = useState<string>('iPhone 16 / 15 / 14 Pro Max & Samsung Galaxy S24');
  const [caseStyle, setCaseStyle] = useState<string>('Dual-Layer Tough Impact Case & Slim Snap Case');

  // Copy feedback states
  const [copiedTitle, setCopiedTitle] = useState<boolean>(false);
  const [copiedDesc, setCopiedDesc] = useState<boolean>(false);
  const [copiedTags, setCopiedTags] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
  const [copiedSingleTag, setCopiedSingleTag] = useState<string | null>(null);

  const listing = activeDesign?.etsyListing;

  const handleGenerateListing = async () => {
    if (!activeDesign) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-etsy-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: activeDesign.prompt,
          title: activeDesign.title,
          niche: activeDesign.niche,
          placeholders: activeDesign.placeholders,
          imageUrl: activeDesign.imageUrl,
          deviceFocus,
          caseStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate Etsy listing');
      }

      const newListing: EtsyListing = {
        title: data.title,
        description: data.description,
        primaryKeywords: data.primaryKeywords || [],
        longTailKeywords: data.longTailKeywords || [],
        etsyTags: data.etsyTags || [],
        targetCustomer: data.targetCustomer || [],
        designStyle: data.designStyle || [],
        searchIntent: data.searchIntent || '',
        keywordRationale: data.keywordRationale || '',
        formattedOutput: data.formattedOutput || '',
        createdAt: data.createdAt || Date.now(),
      };

      if (onUpdateDesignListing) {
        onUpdateDesignListing(newListing);
      } else {
        activeDesign.etsyListing = newListing;
      }
    } catch (err: any) {
      console.error('Error generating Etsy listing:', err);
      setError(err?.message || 'Failed to generate listing. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyText = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedSingleTag(tag);
    setTimeout(() => setCopiedSingleTag(null), 1500);
  };

  const handleDownloadTxt = () => {
    if (!listing) return;
    const blob = new Blob([listing.formattedOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `etsy-listing-${(activeDesign?.title || 'phone-case').toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!activeDesign) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
        <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400 font-medium">Select or generate artwork first</p>
        <p className="text-xs text-slate-500 mt-1">
          The Etsy SEO Generator will analyze the design imagery and prompts to produce a complete listing.
        </p>
      </div>
    );
  }

  const titleLength = listing?.title?.length || 0;
  const isTitleOverLimit = titleLength > 140;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 p-0.5 shadow-md shadow-orange-950/50 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Etsy Product Listing Generator
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  SEO & High-Intent Tags
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI visual & prompt analysis for <span className="text-slate-200 font-medium">{activeDesign.title}</span> ({activeDesign.niche})
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="Target device & case settings"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Settings</span>
              {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleGenerateListing}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer ${
                isGenerating
                  ? 'bg-amber-700 text-amber-100 cursor-wait'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-900/30'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Design & Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{listing ? 'Re-generate Listing' : 'Generate Complete Etsy Listing'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Options Drawer */}
        {showOptions && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                Device Compatibility Focus:
              </label>
              <input
                type="text"
                value={deviceFocus}
                onChange={(e) => setDeviceFocus(e.target.value)}
                placeholder="e.g. iPhone 16 / 15 / 14 & Galaxy S24"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                Case Construction Specs:
              </label>
              <input
                type="text"
                value={caseStyle}
                onChange={(e) => setCaseStyle(e.target.value)}
                placeholder="e.g. Dual-Layer Tough Case & Slim Snap"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="m-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Listing Generation Issue</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Content Area */}
      {!listing && !isGenerating && (
        <div className="p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">Generate an Authentic Etsy Listing for this Artwork</h4>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            The AI analyzes the artwork's subject, color palette, artistic movement (e.g. Stained Glass, Art Nouveau, Cyberpunk), and the exact prompt to build an SEO-optimized title, conversion-focused description, 13 Etsy tags (&le; 20 chars), and complete keyword strategy.
          </p>
          <div className="pt-2">
            <button
              onClick={handleGenerateListing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-950/40 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Etsy Listing Now</span>
            </button>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-semibold text-white">Synthesizing Etsy Listing & Keyword Intelligence...</h4>
            <p className="text-xs text-slate-400">
              Examining visual styles, colors, and prompt nuances for high-intent SEO keywords.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <span className="text-[10px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono">
              Title & Description
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono">
              13 Verified Tags
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono">
              Search Intent Chain
            </span>
          </div>
        </div>
      )}

      {listing && !isGenerating && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Top Quick Actions Bar & Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
              <button
                onClick={() => setActiveTab('listing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'listing'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Title & Description</span>
              </button>
              <button
                onClick={() => setActiveTab('tags')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'tags'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>13 Tags & Keywords</span>
              </button>
              <button
                onClick={() => setActiveTab('strategy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'strategy'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Strategy & Audience</span>
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activeTab === 'raw'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Raw Structured Output</span>
              </button>
            </div>

            {/* Quick Export Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(listing.formattedOutput, setCopiedRaw)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                title="Copy entire formatted listing"
              >
                {copiedRaw ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied All!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy All (Formatted)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
                title="Download listing as text file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Title & Description */}
          {activeTab === 'listing' && (
            <div className="space-y-6">
              {/* Product Title Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    SEO-Optimized Product Title
                  </label>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        isTitleOverLimit ? 'text-rose-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {titleLength} / 140 chars {isTitleOverLimit && '(exceeds Etsy limit)'}
                    </span>
                    <button
                      onClick={() => handleCopyText(listing.title, setCopiedTitle)}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
                    >
                      {copiedTitle ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTitle ? 'Copied' : 'Copy Title'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-white leading-relaxed select-all">
                  {listing.title}
                </div>
              </div>

              {/* Product Description Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Product Description (Etsy-Ready Markdown)
                  </label>
                  <button
                    onClick={() => handleCopyText(listing.description, setCopiedDesc)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
                  >
                    {copiedDesc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDesc ? 'Copied Description' : 'Copy Description'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line max-h-96 overflow-y-auto pr-2">
                  {listing.description}
                </div>
              </div>

              {/* Mini Quick Tags Preview */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    13 Etsy Tags Preview (Ready to copy)
                  </span>
                  <button
                    onClick={() => handleCopyText(listing.etsyTags.join(', '), setCopiedTags)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                  >
                    {copiedTags ? 'Copied All 13 Tags!' : 'Copy All 13 Tags'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {listing.etsyTags.map((tag, idx) => (
                    <span
                      key={idx}
                      onClick={() => handleCopyTag(tag)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-500/60 hover:text-white transition cursor-pointer flex items-center gap-1"
                      title="Click to copy single tag"
                    >
                      <span>{tag}</span>
                      <span className="text-[9px] text-slate-500 font-mono">({tag.length}/20)</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 13 Tags & Keywords */}
          {activeTab === 'tags' && (
            <div className="space-y-6">
              {/* 13 Official Etsy Tags Section */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-400" />
                      Official Etsy Tags ({listing.etsyTags.length}/13)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Every tag conforms strictly to Etsy's maximum limit of 20 characters. Click any tag to copy individually, or copy all at once.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyText(listing.etsyTags.join(', '), setCopiedTags)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    {copiedTags ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTags ? 'Copied All!' : 'Copy All Tags (CSV)'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                  {listing.etsyTags.map((tag, idx) => {
                    const isCopied = copiedSingleTag === tag;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleCopyTag(tag)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                            : 'bg-slate-900 border-slate-800 hover:border-amber-500/60 text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <span className="text-xs font-medium block truncate">{tag}</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {tag.length}/20 chars
                          </span>
                        </div>
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Keywords Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-indigo-400" />
                    Primary High-Intent Keywords
                  </h4>
                  <button
                    onClick={() => handleCopyText(listing.primaryKeywords.join('\n'), setCopiedRaw)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
                  >
                    Copy Primary
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {listing.primaryKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950/40 text-indigo-200 border border-indigo-800/50 font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Long-Tail Keywords Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-emerald-400" />
                    High-Converting Long-Tail Keywords
                  </h4>
                  <button
                    onClick={() => handleCopyText(listing.longTailKeywords.join('\n'), setCopiedRaw)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
                  >
                    Copy Long-Tail
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {listing.longTailKeywords.map((lt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center justify-between"
                    >
                      <span>{lt}</span>
                      <button
                        onClick={() => handleCopyText(lt, () => {})}
                        className="p-1 text-slate-500 hover:text-slate-300 cursor-pointer"
                        title="Copy phrase"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Strategy & Audience */}
          {activeTab === 'strategy' && (
            <div className="space-y-6">
              {/* Strategic Keyword Rationale */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Keyword Strategy & Search Rationale
                </h4>
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-200 font-mono mb-2">
                  Design Imagery ➜ Customer Buying Intent ➜ Etsy Search Query ➜ Listing Placement
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {listing.keywordRationale}
                </p>
              </div>

              {/* Search Intent Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-indigo-400" />
                  Customer Search Intent
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {listing.searchIntent}
                </p>
              </div>

              {/* Grid: Target Customer & Design Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Customer Segments */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-rose-400" />
                    Target Customer Segments
                  </h4>
                  <div className="space-y-1.5">
                    {listing.targetCustomer.map((seg, idx) => (
                      <div
                        key={idx}
                        className="text-xs px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                        <span>{seg}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Design Style & Themes */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Artistic Style & Aesthetic Motifs
                  </h4>
                  <div className="space-y-1.5">
                    {listing.designStyle.map((style, idx) => (
                      <div
                        key={idx}
                        className="text-xs px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                        <span>{style}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Raw Structured Output */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Clean text format adhering to the structured specification (ready for seller docs or Etsy bulk uploaders).
                </span>
                <button
                  onClick={() => handleCopyText(listing.formattedOutput, setCopiedRaw)}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  {copiedRaw ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRaw ? 'Copied to Clipboard!' : 'Copy Structured Text'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto select-all">
                {listing.formattedOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
