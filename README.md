# Matrix Terminal Chat UI

A highly authentic terminal-style chat UI with a Matrix theme, built with React, TypeScript, and Vite.

## Features

- **Terminal look & feel**: Pixel-perfect, monospaced, green-on-black Matrix terminal style
- **Markdown support**: Messages support markdown formatting, including code blocks
- **Terminal prompts**: Customizable prompts before user and agent messages
- **Typing effect**: Agent messages appear with a typing animation, which can be skipped by double-clicking
- **Code copy**: Click any code block or inline code to copy its contents to clipboard
- **Integrated input**: Terminal-style input line, no separate input box
- **Accessibility**: Semantic HTML, ARIA attributes, keyboard navigation
- **Responsive**: Fills available space between header and footer

## Usage

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
3. **Open in browser:**
   Visit [http://localhost:5173](http://localhost:5173)

## Development

- All main logic is in `src/components/Chat.tsx` and `src/components/ChatMessages.tsx`.
- Styles are in `src/components/Chat.css` and use Tailwind for utility classes.
- Markdown rendering uses `react-markdown` with custom component overrides for terminal look.
- Typing effect and auto-scroll logic are handled in `Chat.tsx`.
- Code copy logic is in markdown component overrides in `ChatMessages.tsx`.

## Accessibility

- Uses semantic HTML: `<header>`, `<main>`, `<footer>`
- ARIA attributes for chat, messages, and input
- Keyboard navigation: input is always focusable, chat is navigable

## Known Limitations & TODOs

- No notification on code copy (TODO)
- Error handling for backend/API is minimal (TODO: add error boundary)
- No persistent chat history (TODO: add local storage or backend persistence)
- No user authentication (TODO: add if needed)

## License

MIT
