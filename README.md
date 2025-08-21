# Smart Tab Saver

A comprehensive browser extension + web dashboard for saving, organizing, and searching your browser tabs with AI-powered search capabilities.

## Features

### Web Dashboard
- **Clean Interface**: Modern, responsive design with card-based layout
- **Category Management**: Organize websites by categories (AI Tools, Job Portals, YouTube, etc.)
- **Smart Search**: Full-text search with AI-powered semantic search using Google Gemini
- **Multiple Views**: Switch between grid and list views
- **User Authentication**: Secure email/password authentication via Supabase

### Browser Extension
- **Quick Save**: Save current tab with one click
- **Category Selection**: Choose from predefined or custom categories
- **Notes**: Add personal notes/descriptions to saved websites
- **Auto-categorization**: Smart category suggestions based on URL patterns
- **Offline Support**: Fallback to local storage when dashboard is offline

### AI Integration
- **Semantic Search**: Use "ai:" prefix for intelligent search queries
- **Google Gemini**: Powered by Gemini Pro API for understanding natural language queries
- **Smart Matching**: Find websites based on content understanding, not just keywords

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, API)
- **AI**: Google Gemini Pro API
- **Extension**: Chrome/Brave Extension (Manifest v3)
- **Deployment**: Vercel/Netlify + Supabase

## Setup Instructions

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Run the migration in `supabase/migrations/create_websites_table.sql`
3. Copy your project URL and anon key

### 2. Environment Variables
Create a `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key  # Optional, for AI search
```

### 3. Install and Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 4. Deploy Web App
Deploy to Vercel:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 5. Install Browser Extension
1. Open Chrome/Brave and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension` folder
4. Configure the extension with your deployed dashboard URL

## Usage

### Web Dashboard
1. Sign up/Sign in with email and password
2. Browse your saved websites by category
3. Use the search bar (try "ai:websites for building resume")
4. Add new websites manually or via the extension
5. Switch between grid and list views

### Browser Extension
1. Click the extension icon while on any website
2. Select a category or create a new one
3. Add optional notes
4. Click "Save Tab"
5. Visit your dashboard to manage saved sites

### AI Search
Use natural language queries prefixed with "ai:":
- "ai:tools for creating presentations"
- "ai:websites about machine learning"
- "ai:job boards for developers"

#### Secure Gemini integration (server-side)
- The app now calls a serverless API route at `POST /api/ai-search` to run Gemini securely with a server-side key.
- Configure environment variables:
  - Local dev (`.env`):
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    # Optional client fallback (exposes key in frontend):
    VITE_GEMINI_API_KEY=
    ```
  - Vercel (Project → Settings → Environment Variables):
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `GEMINI_API_KEY` (server-side only, required for AI search)

Behavior:
- When you search with `ai:...`, the client calls `/api/ai-search`.
- If the API route fails, the client will try a client-side fallback if `VITE_GEMINI_API_KEY` is set; otherwise it falls back to normal text search.

## Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── contexts/           # Context providers
│   ├── lib/               # Utilities (Supabase, Gemini)
│   ├── types/             # TypeScript types
│   └── App.tsx            # Main app component
├── extension/             # Browser extension files
│   ├── manifest.json      # Extension configuration
│   ├── popup.html         # Extension popup UI
│   ├── popup.js          # Popup logic
│   └── background.js      # Background script
├── supabase/
│   └── migrations/        # Database migrations
└── public/               # Static assets
```

## Database Schema

### `websites` table
- `id`: UUID primary key
- `url`: Website URL
- `title`: Website title
- `category`: User-defined category
- `description`: Optional notes
- `favicon`: Website favicon URL
- `user_id`: Foreign key to auth.users
- `created_at`: Creation timestamp

## API Endpoints

The extension communicates with the web app via these endpoints:
- `POST /api/save-tab`: Save a new website
- `GET /api/websites`: Fetch user's websites
- `DELETE /api/websites/:id`: Delete a website

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.