# Flowise Solana Terminal

A highly authentic terminal-style chat UI with Solana wallet integration, built with React, TypeScript, and Vite. Features Flowise agent integration for dynamic agent selection and management, plus seamless Solana blockchain interactions.
<img width="1512" height="777" alt="Screenshot 2025-08-15 в 11 28 38" src="https://github.com/user-attachments/assets/513176f0-ae7d-4973-a4cd-8ff4dd97116d" />

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
