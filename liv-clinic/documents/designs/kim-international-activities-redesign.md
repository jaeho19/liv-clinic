# Dr. Kim International Activities Section - Design System

## Design Intent

A compact, premium medical clinic aesthetic that positions Dr. Kim's global credentials directly below her portrait, creating a tight visual narrative of expertise. The design should feel sophisticated yet approachable, emphasizing trust and international recognition.

## Color Palette

### Primary Colors
- Primary Dusty Rose: #b4988d (CTAs, accents, hover states)
- Secondary Dark Brown: #6d4e42 (headings, important text)

### Supporting Colors
- Background Off-White: #f6f6f6 (section backgrounds)
- Mono Charcoal: #575756 (body text)
- Mono Light: #8a8a8a (captions, secondary text)
- Border: #e5e5e5 (dividers, card borders)
- White: #ffffff (cards, overlays)

### Overlay Gradients
- Image Overlay: linear-gradient(to top, rgba(0,0,0,0.7), transparent)
- Hover Overlay: rgba(180, 152, 141, 0.4) (primary with opacity)

## Typography

### Section Header
- Font: Pretendard
- Size: 14px
- Weight: 500
- Color: #6d4e42
- Letter-spacing: 0.05em

### Card Title
- Font: Pretendard
- Size: 13px
- Weight: 600
- Color: #ffffff (on image) / #6d4e42 (standalone)
- Line-height: 1.3

### Card Subtitle
- Font: Pretendard
- Size: 11px
- Weight: 400
- Color: rgba(255,255,255,0.8) (on image) / #8a8a8a (standalone)

### Certificate Text
- Title: 13px, weight 500, #6d4e42
- Detail: 11px, weight 400, #8a8a8a

## Component Specifications

### Activity Card (Compact)
- Aspect Ratio: 1:1 (square)
- Border Radius: 12px
- Overflow: hidden
- Shadow: 0 2px 8px rgba(0,0,0,0.08)
- Hover: scale(1.02), shadow increase

### Card Image Container
- Full bleed (100% width/height)
- Object-fit: cover
- Object-position: center

### Card Overlay
- Position: absolute bottom
- Gradient: to-top from black/70 via transparent
- Padding: 12px

### Certificate Banner
- Background: linear-gradient(135deg, #6d4e42/5%, #b4988d/5%)
- Border: 1px solid #b4988d/20
- Border Radius: 10px
- Padding: 12px 16px
- Display: flex, justify-between, align-center

### Certificate Button
- Background: #b4988d
- Color: #ffffff
- Padding: 6px 12px
- Border Radius: 6px
- Font Size: 12px
- Font Weight: 500
- Hover: #6d4e42

## Layout Specifications

### Section Container
- Margin Top: 24px (separation from doctor photo decorative elements)
- Width: 100% of left column

### Section Header
- Icon: Globe (16x16)
- Icon Color: #b4988d
- Gap between icon and text: 6px
- Margin Bottom: 12px

### Activity Grid
- Display: grid
- Columns: 3
- Gap: 8px
- Margin Bottom: 12px

### Certificate Banner
- Full width
- Margin Top: 0 (tight with grid)

## Interaction States

### Card Hover
- Transform: scale(1.02)
- Transition: 300ms ease
- Shadow: 0 4px 16px rgba(0,0,0,0.12)
- Image: scale(1.05) with overflow hidden

### Button Hover
- Background transition: #b4988d → #6d4e42
- Transition: 200ms ease

## Content Mapping

| Position | Image | Title | Subtitle |
|----------|-------|-------|----------|
| 1 | certification-ceremony.jpg | APTOS 본사 연수 | Georgia, 2025 |
| 2 | presentation-mips.jpg | MIPS 학회 발표 | 최소침습성형연구회 |
| 3 | presentation.jpg | 시술 현장 | Clinical Practice |

## Accessibility

- All images have descriptive alt text
- Certificate link opens in new tab with rel="noopener noreferrer"
- Sufficient color contrast (4.5:1 minimum for text)
- Focus visible states for keyboard navigation
