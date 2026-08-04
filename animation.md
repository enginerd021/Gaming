# Shakti Gaming — Animation System Specification (`animation.md`)

> Motion is a design language, not decoration.
>
> Every animation should communicate hierarchy, direction, focus, or reward.

---

# Animation Principles

## 1. Motion Values

Fast
150ms

Standard
300ms

Medium
500ms

Large Transition
800ms

Hero Timeline
1800–2500ms

Never exceed 2500ms.

---

# Global Motion Language

Every animation should satisfy one purpose:

• Reveal
• Guide
• Reward
• Confirm
• Transition

Avoid unnecessary movement.

---

# Page Load

## Initial Loader

Background

#07080D

Center Logo

Shakti Gaming Logo

Animation

Scale 0.8 → 1

Opacity 0 → 1

Glow pulse

Duration

1.2s

---

Loader Exit

Logo scales down

Background fades

Hero video fades in

Navbar slides down

Hero text reveals

---

# Hero Animation

Timeline

0.0s

Video fades from black.

0.4s

Dark overlay appears.

0.8s

Background slowly scales from 105% → 100%.

1.0s

Headline reveals line-by-line.

1.4s

Subtitle fades upward.

1.8s

CTA buttons appear with stagger.

2.2s

Scroll indicator begins floating.

---

# Navbar

On Page Load

TranslateY

-100%

↓

0

Opacity

0

↓

1

Duration

700ms

---

On Scroll

Height

72px

↓

60px

Background blur increases

Border opacity increases

Logo slightly scales down

---

# Section Reveal

Each section animates only once.

Animation

Opacity

0 → 1

TranslateY

40px → 0

Blur

8px → 0

Duration

800ms

Ease

Power3 Out

---

# Stagger Animation

Cards

Delay

80ms

Headline

60ms

Paragraph

40ms

Buttons

120ms

---

# Bento Grid

Hover

TranslateY

-8px

Scale

1.03

Border Glow

0 → 100%

Shadow

Increase

Duration

250ms

---

# Tournament Cards

Default

Glass

Hover

Glow

Tilt

Scale

Progress bar animates

Live badge pulses

---

# Buttons

Hover

Scale

1 → 1.05

Glow expands

Gradient shifts

Active

Scale

0.97

---

# Images

Reveal

Clip-path

↓

Opacity

↓

Scale

↓

Parallax

Images never appear instantly.

---

# Leaderboard

Podium rises from bottom.

Gold medal glows.

XP counters animate upward.

Player avatars fade sequentially.

---

# Counters

Statistics count from

0

↓

Actual Value

Duration

2s

Easing

Ease Out

---

# Scroll Storytelling

Hero

↓

Mission

Pinned

↓

Games

Slide

↓

Tournaments

Scale

↓

Features

Clip Reveal

↓

Leaderboard

Counter Animation

↓

Community

Fade

↓

Footer

Gradient Reveal

---

# Cursor

Desktop Only

Outer ring

Smooth follow

Inner dot

Instant follow

Buttons

Cursor enlarges

Cards

Cursor glows

Links

Cursor compresses

---

# Parallax

Background

30%

Particles

50%

Cards

100%

Foreground

120%

---

# Hover Language

Buttons

Glow

Cards

Lift

Images

Zoom

Icons

Rotate 8°

Badges

Pulse

---

# Page Transition

Exit

Opacity ↓

Scale 0.98

Blur 6px

Enter

Opacity ↑

Scale 1

Blur 0

Duration

600ms

---

# Loading Skeletons

Glass shimmer

Animated gradient

Never use static gray placeholders.

---

# Mobile Motion

Reduce motion by 40%.

Disable cursor.

Reduce parallax.

Replace hero video with optimized loop or poster if bandwidth is low.

---

# Performance Budget

Maintain 60 FPS.

Avoid layout shifts.

Use transform and opacity for animations.

Never animate width, height, left, or top.

Lazy-load below-the-fold animations.
