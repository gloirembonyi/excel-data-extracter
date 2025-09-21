# Setup Instructions

## Quick Start

1. **Copy the environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Add your API keys to `.env.local`:**
   ```
   NEXT_PUBLIC_GEMINI_API_KEY_1=your-actual-api-key-here
   NEXT_PUBLIC_GEMINI_API_KEY_2=your-second-api-key-here
   # Add more keys as needed
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Go to `http://localhost:3000`

## Features Fixed

✅ **Table Formatting**: Fixed the issue where extracted text wasn't being formatted into tables
✅ **API Keys**: Moved to environment variables for security
✅ **Excel Export**: Fixed Excel file export with proper formatting
✅ **Table Naming**: Added ability to name tables and export with custom names
✅ **Error Handling**: Added fallback parsing when AI fails
✅ **UI Improvements**: Made everything look professional and Excel-like

## How to Use

1. **Extract Data from Images:**
   - Upload an image (like the equipment list you showed)
   - Click "Extract Text ✨"
   - Click "Format as Table"
   - The data will be structured into a proper table

2. **Edit Tables:**
   - Click any cell to edit it
   - Click the table title to rename it
   - Export to Excel with custom filename

3. **Compare Data:**
   - Upload two Excel/CSV files
   - Compare them side by side
   - See differences highlighted

## Troubleshooting

- If table formatting fails, the app will try a fallback parsing method
- Make sure your API keys are valid and have sufficient quota
- Check the browser console for detailed error messages

