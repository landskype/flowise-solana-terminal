# Matrix Terminal Chat UI

A highly authentic terminal-style chat UI with a Matrix theme, built with React, TypeScript, and Vite. Features Flowise agent integration for dynamic agent selection and management.

## Features

- **Matrix Terminal Theme**: Authentic terminal-style interface with green text and black background
- **Flowise Integration**: Dynamic agent selection from Flowise chatflows
- **Markdown Support**: Rich text formatting with code copy functionality
- **Typing Animation**: Realistic typing effect for bot responses
- **Auto-scroll**: Smart scrolling behavior
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- **Flowise Server**: Make sure your Flowise server is running (default: http://localhost:3000)
- **Node.js**: Version 16 or higher

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

## Flowise Integration

The chat UI automatically connects to your Flowise server and allows you to:

1. **Configure Flowise URL**: Set the URL of your Flowise server (default: http://localhost:3000)
2. **Select Agents**: Choose from available chatflows/agents in your Flowise instance
3. **Dynamic Switching**: Switch between different agents without restarting the application
4. **Real-time Updates**: Refresh the agent list to see newly created chatflows

### API Endpoints Used

- `GET /api/v1/chatflows` - Fetch all available chatflows
- `POST /api/v1/prediction/{chatflowId}` - Send messages to specific agents

## License

MIT
