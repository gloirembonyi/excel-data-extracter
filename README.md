# Excel Table Maker

A powerful web application that extracts data from images and converts them into Excel-like tables with advanced comparison and analysis features.

## Features

### 🚀 Core Features
- **Image Data Extraction**: Upload images and extract structured data using AI
- **Excel-like Interface**: Clean, professional table interface similar to Microsoft Excel
- **Inline Editing**: Edit table cells directly in the interface
- **Excel Import/Export**: Import and export data in Excel (.xlsx) and CSV formats
- **Data Comparison**: Compare two datasets and identify differences
- **Batch Processing**: Process multiple images simultaneously
- **Real-time API Status**: Monitor API key health and performance

### 📊 Data Management
- **Table Editing**: Click any cell to edit data inline
- **Data Validation**: Built-in validation for data integrity
- **Sorting & Filtering**: Organize and filter data easily
- **Merge Datasets**: Combine multiple datasets intelligently
- **Export Options**: Multiple export formats (Excel, CSV)

### 🔧 Advanced Tools
- **Data Comparison**: Side-by-side dataset comparison
- **Difference Detection**: Automatically identify changes between datasets
- **Data Cleaning**: Tools for data standardization
- **Analysis Tools**: Generate insights and statistics

## Installation

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- npm or yarn

### Frontend Setup
```bash
cd excel-table-maker
npm install
npm run dev
```

### Backend Setup (Optional)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Usage

### 1. Extract Data from Images
1. Go to the "Extract Data" tab
2. Upload an image file (PNG, JPG, etc.)
3. Click "Extract Text ✨" to process the image
4. Review the extracted text
5. Click "Format as Table" to convert to structured data
6. Edit the table as needed
7. Export to Excel or CSV

### 2. Compare Datasets
1. Go to the "Compare Data" tab
2. Upload two Excel/CSV files or use extracted data
3. Click "Compare Data" to analyze differences
4. Review the comparison results
5. Export comparison reports

### 3. Batch Processing
1. Select multiple images at once
2. Click "Process All Images" to extract data from all images
3. Review individual results
4. Export combined data

## API Configuration

The application uses Google Gemini API for text extraction. Configure your API keys in `src/utils/aiUtils.ts`:

```typescript
export const GEMINI_API_KEYS = [
  "your-api-key-1",
  "your-api-key-2", // Add multiple keys for better reliability
  // ... up to 10 keys
];
```

## File Structure

```
excel-table-maker/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main application component
│   │   └── layout.tsx        # App layout
│   ├── components/
│   │   ├── ExcelTable.tsx    # Excel-like table component
│   │   ├── ImagePreview.tsx  # Image preview component
│   │   ├── FileUpload.tsx    # File upload component
│   │   └── DataComparison.tsx # Data comparison component
│   └── utils/
│       ├── excelUtils.ts     # Excel/CSV utilities
│       └── aiUtils.ts        # AI processing utilities
├── backend/
│   ├── app.py               # Python FastAPI backend
│   ├── requirements.txt     # Python dependencies
│   └── start_backend.bat    # Windows startup script
└── package.json
```

## Technologies Used

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icons
- **XLSX**: Excel file processing
- **File-saver**: File download functionality

### Backend (Optional)
- **FastAPI**: High-performance Python web framework
- **Pandas**: Data manipulation and analysis
- **OpenPyXL**: Excel file processing

## API Endpoints (Backend)

- `POST /upload-excel` - Upload and parse Excel/CSV files
- `POST /compare-data` - Compare two datasets
- `POST /merge-data` - Merge datasets
- `POST /filter-data` - Filter data based on criteria
- `POST /sort-data` - Sort data by field
- `POST /export-excel` - Export data to Excel
- `POST /export-csv` - Export data to CSV

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the GitHub issues page
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

## Changelog

### v1.0.0
- Initial release
- Image data extraction
- Excel-like table interface
- Data comparison features
- Batch processing
- Export/import functionality