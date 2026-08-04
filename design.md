# Shakti Gaming Esports — Experience First Design System (`design.md`)

> **Design Philosophy**
>
> Shakti Gaming should not feel like a dashboard.
> It should feel like entering a competitive esports universe.
>
> Every scroll should reveal something new.
> Every animation should tell a story.
> Every interaction should reward the user.

---

# 1. Core Design Principles

## Immersive First Impression

The first screen occupies the full viewport.

No cards.

No navigation clutter.

Only:

- Cinematic looping background
- Massive typography
- One powerful CTA
- Smooth motion
- Scroll indicator

The first 5 seconds should make users stop scrolling.

---

## Motion Before Content

Content never appears instantly.

Everything enters through motion.

Animation principles:

- Fade
- Translate
- Scale
- Rotate
- Blur
- Reveal

Nothing should "pop" onto the screen.

---

## Depth

The interface should have multiple visual layers.

Layer 1
Background cinematic video

Layer 2
Gradient overlays

Layer 3
Particles

Layer 4
Content

Layer 5
Cursor effects

Every layer moves at a different speed.

---

## White Space

Large empty areas are intentional.

Do not fill every screen with cards.

The empty space creates premium perception.

---

# 2. Visual Identity

## Background

Primary

#07080D

Secondary

#10131A

Surface

rgba(18,22,31,0.72)

Glass Blur

24px

---

## Accent Colors

Electric Cyan

#00F0FF

Hyper Violet

#8A2BE2

Champion Gold

#FFD700

Danger Red

#DC2626

Use color sparingly.

90% of the interface remains dark.

---

# 3. Typography

Headlines

Outfit

Weight

800–900

Uppercase

Very large

Example

DOMINATE

THE

ARENA

Body

Plus Jakarta Sans

Maximum width

620px

Large spacing

---

# 4. Hero Experience

Height

100vh

Background

Looping cinematic MP4

Examples

Neon arena

Drone fly-through

Cyber city

Tournament stage

Moving particles

Foreground

Headline

DOMINATE THE ARENA

Subtitle

India's next-generation esports platform for competitive gamers.

CTA

Enter Arena

Secondary CTA

Watch Trailer

Bottom

Animated scroll indicator

---

Hero Animation Timeline

0.0s

Video fades in

0.5s

Gradient overlay appears

1.0s

Headline reveals line by line

1.6s

Subtitle fades upward

2.0s

CTA scales into view

2.5s

Scroll indicator begins floating animation

---

# 5. Scroll Storytelling

The website should feel like chapters.

Hero

↓

Mission

↓

Games

↓

Tournaments

↓

Features

↓

Community

↓

Leaderboard

↓

Sponsors

↓

Footer

Every section introduces a new animation style.

No repeated transitions.

---

# 6. Scroll Behaviors

Smooth scrolling

Momentum scrolling

Parallax backgrounds

Pinned sections

Image scaling

Clip-path reveals

Text stagger

Section fade

Cards rotate slightly

Background zooms slowly

---

# 7. Component Language

Buttons

Large

Rounded

Glass effect

Soft glow

Hover

Lift

Glow increases

Gradient shifts

Cards

Glass

Large radius

Animated border

Mouse tilt

Background glow

Hover

Scale

1.03

Images

Always animated

Never static

Zoom

Mask reveal

Parallax

---

# 8. Bento Sections

Instead of equal cards, use asymmetric layouts.

Large Feature

Tournament Engine

Small Feature

Squad Builder

Tall Feature

Hall of Fame

Wide Feature

Live Arena

Every card has a unique size.

---

# 9. Interaction Design

Cursor

Custom glowing cursor

Magnetic buttons

Card tilt

Hover glow

Smooth transitions

Interactive gradients

No default browser hover effects.

---

# 10. Motion Language

Page Load

Fade

Scale

Blur

Section Enter

TranslateY

Opacity

Stagger

Hover

Rotate 2°

Scale 1.03

Glow

Scroll

Parallax

Pinning

Reveal

Clip-path

---

# 11. Audio

Muted by default.

Optional ambient arena sound.

Button hover

Soft click

Tournament win

Celebration sound

Never autoplay audio.

---

# 12. Responsive Strategy

Desktop

Full cinematic experience

Tablet

Reduced motion

Simplified hero

Mobile

Replace heavy video with optimized loop or poster image

Reduce particle density

Maintain typography hierarchy

---

# 13. Performance Targets

Lighthouse

95+

Hero video

< 8 MB

Images

WebP/AVIF

Animations

60 FPS

Lazy load all below-the-fold media

---

# 14. Technology Stack

Framework

Next.js 16

Styling

Tailwind CSS

Animations

GSAP

GSAP ScrollTrigger

Smooth Scroll

Lenis

3D

React Three Fiber (optional)

Video

MP4 + WebM fallback

State

Zustand

Backend

Firebase

---

# 15. User Journey

Landing

↓

Hero cinematic

↓

Discover games

↓

Explore tournaments

↓

See live activity

↓

Build team

↓

Register

↓

Compete

↓

Track leaderboard

↓

Join community

Every section should increase excitement and encourage the next interaction.

---

# 16. Emotional Goal

Users should feel:

• Curious on first load.
• Excited while scrolling.
• Motivated to compete.
• Confident in the platform.
• Inspired to return.

The experience should resemble entering a premium esports arena rather than browsing a traditional website.
