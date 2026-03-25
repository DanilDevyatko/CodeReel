Build a local-first web app that automatically turns an article into a sequence of code-focused slides and previewable transitions for short social media videos.

Goal:
I want an app that takes an article written in Markdown/MDX, parses it into scenes/slides, renders each slide as a beautiful code-editor-like visual, and supports automatic animated transitions between slides. The app should be optimized for fast creation of 1-minute developer videos for social media.

Core product idea:
article -> parsed scenes/slides -> rendered code editor visuals -> animated slide sequence -> export-ready screenshots/video frames

Tech preferences:

- React
- TypeScript
- Vite or Next.js (prefer the simplest setup)
- local-first
- no paid APIs required
- architecture should be clean and extensible

Main requirements:

1. Syntax highlight support

- Render code blocks with proper syntax highlighting
- Support multiple languages at minimum: JavaScript, TypeScript, TSX, JSX, HTML, CSS, JSON, Bash
- Use a robust syntax highlighting solution such as Shiki
- Support line highlighting / focus mode
- Support dimming non-focused lines
- Support diff-like states where some lines can appear added/changed/removed
- Theme system should be configurable

2. Code editor-like view

- Slides with code should look like a modern code editor window
- Include a styled editor frame with:
  - rounded card/window
  - dark editor theme by default
  - macOS-style traffic light dots
  - optional filename / tab title
  - optional line numbers
  - realistic spacing and typography
- It does NOT need to be a real editor component; visual realism is more important than editing behavior
- The design should be polished and social-media friendly
- Allow switching between:
  - real code
  - fake placeholder code blocks
  - focused/highlighted code
  - explanation slide with text + code
- Placeholder code should generate realistic colored fake code lines with varied widths and indentation

3. Generation of slides based on the article

- The app must accept an article in Markdown or MDX
- Parse the article into a list of slides/scenes automatically
- Support a simple authoring format where the article can contain explicit scene markers
- Also support a basic automatic split mode that tries to turn sections/code blocks into slides
- Each slide should support:
  - title
  - subtitle or explanation text
  - code block
  - highlighted lines
  - optional callout / annotation
  - optional placeholder mode
- Build a clear intermediate scene schema in TypeScript
- Example internal scene type:
  {
  id: string
  type: "code" | "text-code" | "placeholder" | "title"
  title?: string
  body?: string
  language?: string
  code?: string
  highlightLines?: number[]
  dimNonHighlighted?: boolean
  filename?: string
  showLineNumbers?: boolean
  notes?: string[]
  transitionToNext?: "slide" | "fade" | "zoom"
  }

4. Animation between slides, automatic sliding mode

- Support animated transitions between slides
- Minimum transitions:
  - horizontal slide
  - fade
  - subtle zoom
- Add automatic slideshow playback mode
- In automatic mode, slides should advance on a timer
- Allow configuring:
  - duration per slide
  - transition duration
  - transition style
  - autoplay on/off
  - loop on/off
- Playback should be previewable directly inside the app
- The automatic slide mode should feel suitable for short-form social media content

Important product behavior:

- The app should allow a user to paste or load an article and immediately generate slides
- User should then be able to:
  - preview slides
  - edit slide structure if parsing is imperfect
  - reorder slides
  - tweak highlighted lines
  - choose transition style
  - start automatic playback preview
- Focus on speed and simplicity

UX requirements:

- Split layout:
  - left side: article input / scene editor
  - right side: live preview
- Show list of generated slides in a sidebar or bottom panel
- Clicking a slide opens it in preview
- Include playback controls:
  - play
  - pause
  - next
  - previous
  - restart
- Include a simple timeline or progress indicator
- Add responsive support, but desktop-first is fine

Export requirements:

- Export each slide as PNG
- Export full sequence metadata as JSON
- Architect the app so video export can be added later
- Optional: provide a simple frame export mode for later stitching with ffmpeg/remotion

Architecture requirements:

- Build reusable components:
  - EditorFrame
  - CodeBlock
  - PlaceholderCodeBlock
  - SlideRenderer
  - SlidePreview
  - SlideList
  - PlaybackControls
  - ArticleParserPanel
- Keep parsing logic separate from rendering logic
- Keep scene schema explicit and strongly typed
- Avoid tightly coupling UI with parser internals

Parsing requirements:

- Support markdown scene syntax such as:
  ## Scene
  Title: ...
  Body: ...
  ```ts {highlight=2,4-6}
  ...
  Also support a simpler fallback:
  headings and code blocks become separate slides automatically
  If parsing is ambiguous, produce reasonable defaults
  ```

Non-goals:

Do not build a full video editor
Do not build collaborative features
Do not add authentication
Do not use a heavy backend unless absolutely necessary

Implementation preferences:

Keep the first version small but functional
Prioritize working end-to-end MVP
Use clean folder structure
Add sample article input
Add a few nice default themes
Make the code easy to extend later

Deliverables:

Full project scaffold
Working MVP UI
Markdown-to-slide parser
Code editor-style slide renderer
Syntax highlighting support
Automatic slideshow playback with transitions
PNG export for slides
README with setup and architecture explanation

Please:

think like a senior frontend engineer
make good technical decisions without overengineering
implement the MVP first
keep code production-quality
use clear TypeScript types
include comments only where useful
generate all necessary files
include an example article that demonstrates:
title slide
explanation + code slide
highlighted lines
placeholder code slide
autoplay preview with transitions

After generating the project, also explain:

project structure
how parsing works
how slide rendering works
where to customize themes/transitions
what to build next after MVP
