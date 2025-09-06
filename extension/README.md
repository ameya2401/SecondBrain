# SecondBrain Chrome Extension

This Chrome extension allows you to save websites directly to your SecondBrain dashboard deployed on Vercel.

## Features

- **Editable Title**: Click on the website title to edit it before saving
- **Smart Categorization**: Automatically suggests categories based on URL patterns
- **Custom Categories**: Fetches your existing categories from the dashboard
- **Direct Save**: Saves directly to your Vercel deployment (no local storage)
- **Real-time Sync**: Saved websites appear immediately in your dashboard

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension` folder
4. The SecondBrain extension will appear in your browser toolbar

## Configuration

When you first use the extension, you'll need to configure:

1. **Dashboard URL**: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
2. **Account Email**: The email you use to login to your SecondBrain dashboard
3. **Account Password**: Your SecondBrain dashboard password
4. **Extension Secret** (optional): Only needed if you've set up additional security

**Important**: Your credentials are stored locally in the extension and used only to authenticate with your own dashboard.

## Usage

1. Navigate to any website you want to save
2. Click the SecondBrain extension icon
3. Edit the title if needed (it's automatically filled but editable)
4. Select or confirm the category
5. Add optional notes/description
6. Click "Save Tab"

The website will be saved directly to your dashboard and sync in real-time!

## Auto-Categorization Rules

The extension automatically suggests categories based on URL patterns:

- YouTube → "YouTube"
- LinkedIn/Indeed/Glassdoor → "Job Portals"  
- GitHub/Stack Overflow/Dev.to → "Development"
- OpenAI/Anthropic/HuggingFace → "AI Tools"
- Medium/Blog sites → "Blogs"
- Everything else → "Uncategorized"

## Troubleshooting

If you get "saved locally" instead of "saved to dashboard":

1. Check your dashboard URL is correct and accessible
2. Verify your email matches your dashboard account
3. Ensure your Vercel app has the required environment variables set
4. Check the browser console for detailed error messages

## Environment Variables Required on Vercel

Make sure your Vercel deployment has these environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` 
- `VITE_SUPABASE_ANON_KEY` (for user authentication)
- `EXTENSION_SECRET` (optional)