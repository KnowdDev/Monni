# Existing Theme Assets Audit

## Theme Overview
- **Current Theme**: Shopify Craft v15.4.1
- **Theme ID**: #152737120427 (Tea & Tonic - Kirsty Feb 26)
- **Asset Count**: 185 files in assets directory
- **Structure**: Sections (56), Snippets (37), Templates (24), Locales (57)

## Asset Categories

### SVG Icons (57 files)
**Status**: REUSE WITH SELECTION

**Keep for new theme**:
- Core UI icons: icon-account.svg, icon-cart.svg, icon-close.svg, icon-search.svg, icon-menu.svg
- Navigation: icon-arrow.svg, icon-caret.svg, icon-hamburger.svg
- Social: icon-instagram.svg, icon-facebook.svg (if used)
- Utility: icon-checkmark.svg, icon-error.svg, icon-loading.svg

**Discard/Replace**:
- Many product-specific icons (icon-banana.svg, icon-bottle.svg, icon-carrot.svg, etc.) - not relevant for Monni's brand
- Icons that don't match Japanese-Scandinavian aesthetic
- Overly detailed/complex icons

**Action**: Curate to ~15-20 essential icons matching brand aesthetic

### CSS Files
**Status**: REBUILD FROM SCRATCH

**Current structure**:
- base.css (80KB) - Main stylesheet
- component-*.css (30+ files) - Component-specific styles
- section-*.css (15+ files) - Section-specific styles
- template-*.css - Template-specific styles

**Issues**:
- Too many separate CSS files causing multiple requests
- Heavy CSS (80KB base.css + component files)
- Craft theme aesthetic doesn't match Monni's brand direction
- Not optimized for performance

**Action**: 
- Build single, optimized critical.css following Skeleton theme pattern
- Use CSS variables for brand colors and spacing
- Implement component CSS only where needed using {% stylesheet %} tags
- Target ~20-30KB total CSS vs current ~100KB+

### JavaScript Files
**Status**: SELECTIVE REUSE

**Core functionality to keep**:
- cart.js (10KB) - Cart functionality
- product-form.js (5KB) - Product form handling
- facets.js (14KB) - Collection filtering
- predictive-search.js (9KB) - Search functionality

**Utility patterns to extract**:
- pubsub.js (598 bytes) - Event pub/sub pattern
- constants.js - Theme constants

**Rebuild**:
- global.js (43KB) - Too heavy, rebuild with only essential functionality
- All other component-specific JS files - rebuild as needed

**Action**: 
- Extract essential cart, product, and search logic
- Rebuild global.js to be minimal (~5-10KB)
- Use native browser APIs where possible
- Lazy load non-critical JS

### Images & Media
**Status**: AUDIT NEEDED

**Current assets**:
- email-signup-banner-background.svg (4KB)
- email-signup-banner-background-mobile.svg (3KB)
- sparkle.gif (179KB) - Large animated GIF

**Action**:
- Replace sparkle.gif with CSS animation or SVG (179KB is too heavy)
- Audit email signup backgrounds for brand alignment
- Check for any other image assets in sections/snippets

## Sections & Templates
**Status**: REBUILD ON SKELETON

**Current**: 56 sections, 24 templates
**Target**: Minimal set matching brand requirements

**Essential sections to rebuild**:
- Header/Navigation
- Hero/Banner
- Product grid
- Product detail
- Collection pages
- Cart drawer
- Footer

**Discard**:
- Complex sections not matching brand direction
- Overly configurable sections that add bloat

## Configuration
**Status**: REBUILD

**Current**: settings_schema.json (40KB), settings_data.json (15KB)

**Action**:
- Build minimal settings schema matching brand requirements
- Focus on colors, typography, spacing - not excessive customization
- Use brand foundation colors as defaults

## Performance Optimization Plan

### Current Issues
- 185 asset files (many unnecessary)
- 80KB+ CSS across multiple files
- 43KB global.js
- 179KB animated GIF
- Complex theme structure

### Target State
- ~20-30KB total CSS (single critical.css + component CSS)
- ~10-15KB total JS (minimal, lazy-loaded)
- SVG icons only (no GIFs)
- ~50-70 total asset files
- Single critical CSS file for above-fold content

## Migration Strategy

### Phase 1: Asset Extraction
1. Copy curated SVG icons to new theme
2. Extract essential JS patterns (cart, product, search)
3. Audit any custom Liquid snippets for business logic

### Phase 2: New Theme Build
1. Build critical.css with brand colors (from BRAND_FOUNDATION.md)
2. Implement minimal global.js
3. Create essential sections on Skeleton foundation
4. Configure theme settings

### Phase 3: Content Migration
1. Migrate settings_data.json content (colors, fonts, etc.)
2. Update to match brand foundation
3. Test all functionality

## Brand Alignment Check

### From BRAND_FOUNDATION.md:
- **Colors**: Soft neutrals, pale stone tones, washed timber hues, gentle pink undertones
- **Aesthetic**: Japanese Scandinavian, minimalist, refined simplicity
- **Feeling**: Calm, elevated, grounding, warm

### Current Craft Theme:
- **Colors**: Default Shopify colors (needs complete overhaul)
- **Aesthetic**: Generic e-commerce theme (doesn't match brand)
- **Feeling**: Standard Shopify experience (not custom)

### Action Required:
Complete visual rebuild to match brand foundation. Current assets are functionally useful but aesthetically misaligned.

---

*This audit identifies that while the existing theme has functional components that can be reused, the aesthetic and performance characteristics require a complete rebuild on the Skeleton theme foundation to achieve the hyper-optimised, brand-aligned experience the client desires.*
