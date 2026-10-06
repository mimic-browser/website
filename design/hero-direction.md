# Layered hero composition

Follow the supplied dark desk reference. Keep the book stack and ceramic mug unlettered, the mascot compact, and the hands wrapped over the window edge. Let the feet recede into the desk shadows rather than making them a separate focal point.

## Rendering

`HeroScene.astro` uses an ordinary HTML container whose coordinates match the base plate (`2051 × 767`). CSS container units keep hand contact stable when the scene resizes. **Both browser panels** are HTML: surfaces, borders, title bars, labels and Lucide SVG icons. Each panel and its contents share one CSS transform so the text follows the glass perspective. Text remains selectable and accessible. There is no SVG wrapper, `foreignObject` or raster card.

The base plate contains only the room, desk, laptop, books, mug and mascot. Two small transparent PNG fingertip cutouts sit above the HTML window. The window occludes the mascot's body, while edge highlights provide the glass appearance.

`WorkloadComparison.astro` renders the benchmark card in HTML, including the values, clipped animated bars and methodology link. Measurements describe separate workloads; downloaded bytes are encoded HTTP bodies, not physical wire bytes. Public marketing does not compare against a manual optimizer baseline.

Desktop composition is capped at 2250 pixels wide and 842 pixels high, with bounded typography (84-pixel heading, 19-pixel body copy). This keeps the wide-screen hero compact and its text aligned with the shared page container. The scene, hands and held window share source coordinates; heading and benchmark typography scale with the composition. Mimic receives an additional local 10% enlargement: a feathered copy of the same plate and the HTML/hand group share the same scale and origin. The feather covers the surrounding room, not the character silhouette. No additional raster download is needed. The header keeps the same container, sizing and spacing as every other page. Heavy Browser sits partly behind the held window with reduced contrast and a curved SVG connection. Do not repeat the headline as a handwritten note. CSS lighting dims the room and gently shades the feet while retaining keyboard reflections. Narrow screens use a closer view without the extra local enlargement, larger panel labels, a repositioned background window and a separate benchmark card below it.

## Assets and alignment

| File                                      | Purpose                                               |
| ----------------------------------------- | ----------------------------------------------------- |
| `design/assets/hero-reference-scene.png`  | Final generated base; no UI panels or lettering       |
| `design/assets/hero-grip-source.png`      | Original grip source for fingertip extraction         |
| `public/images/hero-reference-scene.webp` | Delivery base, normalized to 2051 × 767               |
| `public/images/hero-grip-left.png`        | Transparent crop: x 1025, y 292, width 115, height 61 |
| `public/images/hero-grip-right.png`       | Transparent crop: x 1282, y 272, width 124, height 69 |

The held HTML panel is at (919,338), 500 pixels wide and at least 280 pixels tall in source coordinates, rotated by -2 degrees. The right fingertip crop is displayed at y=266 to keep the fingers close to the flatter edge instead of hanging far down the face. Keep the upper edge registered to the fingertips; the bottom leaves room for both feet. The local character plate, panel and hand layers share a 1.1 scale around (59%,50%) on desktop. The heavy panel sizes to its contents so its last row cannot fall below the frame.

The hand PNGs were split from the original grip source using anti-aliased polygon masks, without regenerating or reshaping the fingers. The base was edited with the built-in image generation tool. An intermediate image retained an empty panel: its hands were preserved before removing the panel from the base.

## Generation prompts

### Reference plate

```text
PRECISE EDIT of the provided reference, NOT a redesign, NOT a new mascot or a reinterpretation. Prepare a clean compositing background plate from ONLY the upper hero scene (top approximately 665 of 883 pixels). Preserve the EXACT original camera, room, lighting, laptop, books, mug, and especially the original blue mascot's visible pixels, pose, proportions, fur, eye direction, horns, hands and visible feet. The mascot must stay where it is in the reference, at the same size: head at roughly x940–1190 y98–299, feet at roughly x1140–1205 y523–558. Do not turn it frontal, larger, fatter or symmetrical. Its hands must retain the original gripping pose and positions around x928 y286 and x1167 y264. Remove only the following website overlays: the whole top header/navigation/logo/button; the left headline/paragraph/buttons/tags; all three floating rectangular interface panels INCLUDING their frames/text/icons/metrics; all arrows and handwritten notes. Inpaint the vacated UI areas with continuation of the original dark room or the hidden part of the mascot; keep the original already-visible mascot entirely unchanged. The torso behind the removed held panel is small and mostly centered under the head, not wide, not bulging to the right. Hands retain the same curled gripping pose even though the pane is now removed, ready for a real HTML panel to be composited into them. Remove lettering ONLY from the book spines and mug, preserving those objects exactly. Exclude the lower feature rows and benchmark strip entirely. Output a full-bleed clean dark cinematic 1780:665 aspect landscape scene with no text, no UI panels, no floating graphics anywhere. This must look like the SAME original photograph/3D render with overlays erased, not an independently regenerated scene. Prioritize exact identity, silhouette and original composition over adding any detail.
```

### Remove raster panel

```text
Precise object removal edit of image 1. Remove the ENTIRE dark rectangular board/panel the blue monster is holding, including its border. The board must be completely absent. Inpaint ONLY its area with the hidden blue furry compact body and the original dim room behind it. Preserve every other part of the image: exact camera, room, laptop, two books, blank mug, monster head, horns, eye, hands, feet, silhouette and their exact pixel positions. Do not move the hands; they remain curled down in the exact existing grip pose at the same height, as if resting on an invisible panel. The result must contain ZERO boards, ZERO windows, ZERO panes, ZERO rectangles in front of the creature. This is a compositing plate; a real panel will be inserted later over the body. No redesign or style change. No words. Keep original landscape aspect and resolution. Do not regenerate the head or hands.
```

### Restore compact anatomy

```text
Precise anatomy correction. Image 1 is the scene to EDIT. Image 2 is the authoritative MIMIC CHARACTER PROPORTION reference. The mascot in image 1 is MUCH TOO FAT with a huge belly. Fix its body to be a small compact little creature like image 2, not a pear, not a furry barrel. Keep the eye/head/horns at their EXACT current position and size, keep both hands at their EXACT current position and curled gripping pose (a real HTML panel goes into them later). Make the torso dramatically narrower: the torso below the eye must be only 65% of the head's width. Body width must never exceed head width. Remove the large spherical abdomen and all side bulges. Small short compact body, slim shoulders under the fur, two little short legs and separated feet; feet remain on the laptop at the same ground height. Use the supplied proportion reference for the compactness, fur length and little limbs. In image coordinates the head center is around 59% of width; all torso should fit narrowly beneath the head with no belly extending far left or far right. The arm on each side reaches the existing hand position without swollen shoulders. This is a small mascot, no oversized monster. Preserve camera, environment, hands positions, lighting, laptop, blank books and blank mug EXACTLY. No board, panel, text or UI anywhere. Same landscape composition. Only correct body silhouette.
```

### Correct mug proportions

```text
Precise local edit of image 1. Change ONLY the dark ceramic coffee mug at the bottom right. Its body is too wide and squat. Make the mug a natural upright everyday ceramic coffee mug: narrow its cylindrical body by about 25 percent while keeping its top and bottom at the same heights and its center at the same location. Adjust the handle to be a normal slender C-shaped handle sized naturally to the now narrower cup. Preserve the matte navy-black material, reflections, perspective, lighting and completely blank surface without text. Do NOT change any other pixels: keep the blue creature's exact slim silhouette/head/eye/horns/hands/feet/pose, the laptop, book stack, desk, room and camera unchanged. Same landscape aspect ratio. No other new objects, no text, no panel.
```

### Shorten the mug after reviewing it in the hero

The previous edit made the mug too tall. The final source PNG was edited with the built-in imagegen tool and converted to the delivery WebP at the registered 2051 × 767 size. Final prompt:

```text
Use case: precise-object-edit. Edit only the plain dark ceramic mug in the lower right of this exact scene. It currently looks like an unnaturally tall narrow thermos. Make it a normal compact everyday coffee mug: shorten its vertical body by about 30%, keeping approximately the same body width, with height close to its body diameter. Lower its rim; keep its base at the same desk contact position near the bottom edge. Resize the C handle to match a short ordinary mug. Preserve the blank navy-black ceramic, blue reflected light, perspective and shadows. NO lettering or logo. Absolutely preserve the rest of the image pixel-for-pixel: camera and framing, all room/desk/laptop/books pixels, the mascot's exact position, head, eye, horns, fur, body and especially hands (a precisely registered HTML panel is layered onto them later). No new panels, graphics or text. Only replace the mug and immediately affected background/shadow. Keep the same ultra-wide 2051:767 aspect ratio and full composition. Do not change the mascot or lighting elsewhere.
```
