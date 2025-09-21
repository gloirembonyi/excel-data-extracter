# Search Feature Documentation

## Overview

The search feature allows users to search across all datasets and master data in the Excel Table Maker application. It provides a comprehensive search interface with advanced filtering options.

## Features

### 🔍 Search Capabilities

- **Text Search**: Search by serial number, tag number, or item description
- **Fuzzy Matching**: Find partial matches with configurable sensitivity
- **Exact Match**: Option for precise matching
- **Case Sensitivity**: Toggle case-sensitive searches

### 🎯 Advanced Filtering

- **Item Type**: Filter by CPU, Screen/Monitor, or Other equipment types
- **Status**: Filter by item status (New, Active, Inactive, Maintenance, Retired)
- **Source**: Filter by data source (Master Data, Dataset, Extracted)
- **Quantity Range**: Filter by minimum and maximum quantity
- **Date Range**: Filter by creation date (planned feature)

### 📊 Search Results

- **Pagination**: Navigate through large result sets (20 results per page)
- **Rich Display**: Shows item description, serial number, tag number, quantity, status, and source
- **Visual Indicators**: Color-coded status badges and source indicators
- **Match Scoring**: Shows confidence scores for matched items (when applicable)

### 📤 Export Options

- **Excel Export**: Export results to .xlsx format with formatted headers
- **CSV Export**: Export results to .csv format for compatibility
- **Custom Filenames**: Specify custom export filenames

## Usage

### Basic Search

1. Navigate to the "Search Data" tab in the sidebar
2. Enter your search term in the search box
3. Click "Search" or press Enter
4. Browse through the results

### Advanced Search

1. Click the "Filters" button to expand advanced options
2. Select filters for:
   - Item Type (CPU, Screen, Other)
   - Status (New, Active, Inactive, etc.)
   - Source (Master Data, Dataset, Extracted)
   - Quantity range
3. Toggle exact match and case sensitivity options
4. Click "Search" to apply filters

### Exporting Results

1. After performing a search, click the "Export" button
2. Choose export format (Excel or CSV)
3. Enter a custom filename (optional)
4. Click "Export" to download the results

## Technical Implementation

### Frontend (React/TypeScript)

- **SearchPage Component**: Main search interface with filters and results display
- **Mantine UI**: Modern, accessible UI components
- **Real-time Search**: Instant search with debouncing
- **Responsive Design**: Works on desktop and mobile devices

### Backend (FastAPI/Python)

- **Search Endpoint**: `/search` - Main search API with filtering and pagination
- **Export Endpoint**: `/export-search-results` - Export search results to Excel/CSV
- **Database Integration**: Searches across PostgreSQL database
- **Performance Optimized**: Efficient queries with proper indexing

### Data Sources

- **Master Data**: Project-specific master data items
- **Datasets**: Uploaded Excel files converted to searchable data
- **Extracted Data**: Data extracted from images (when available)

## API Endpoints

### POST /search

Search across all datasets and master data.

**Request Body:**

```json
{
  "query": "search term",
  "item_type": "cpu|screen|other",
  "status": "new|active|inactive|maintenance|retired",
  "source": "master_data|dataset|extracted",
  "min_quantity": 1,
  "max_quantity": 10,
  "exact_match": false,
  "case_sensitive": false,
  "page": 1,
  "limit": 20
}
```

**Response:**

```json
{
  "success": true,
  "results": [...],
  "total_results": 100,
  "total_pages": 5,
  "current_page": 1,
  "limit": 20
}
```

### POST /export-search-results

Export search results to Excel or CSV.

**Request Body:**

```json
{
  "results": [...],
  "format": "excel|csv",
  "filename": "search_results"
}
```

## Search Examples

### Find All CPUs

- Set Item Type filter to "CPU"
- Leave search query empty or search for specific terms

### Find by Serial Number

- Enter serial number in search box
- Use exact match for precise results

### Find Items by Status

- Set Status filter to "New" or "Active"
- Combine with other filters for refined results

### Find Items in Specific Dataset

- Set Source filter to "Dataset"
- Use search query to find specific items

## Performance Considerations

- **Pagination**: Large result sets are paginated to improve performance
- **Database Indexing**: Serial numbers and tag numbers are indexed for fast searches
- **Caching**: Search results are cached for improved performance (planned)
- **Async Processing**: Search operations are non-blocking

## Future Enhancements

- **Full-Text Search**: Implement PostgreSQL full-text search for better text matching
- **Search History**: Save and reuse previous searches
- **Saved Searches**: Save frequently used search configurations
- **Advanced Analytics**: Search analytics and usage statistics
- **Real-time Updates**: Live search results as data changes
- **Search Suggestions**: Auto-complete and search suggestions
- **Bulk Operations**: Select and perform operations on multiple search results

## Troubleshooting

### Common Issues

1. **No Results Found**: Check filters and search terms
2. **Slow Search**: Large datasets may take time; use filters to narrow results
3. **Export Fails**: Check file permissions and available disk space

### Performance Tips

1. Use specific search terms rather than broad queries
2. Apply filters to narrow down results
3. Use pagination for large result sets
4. Export only necessary data

## Security Considerations

- **Data Access**: Search respects project and user permissions
- **Input Validation**: All search inputs are validated and sanitized
- **SQL Injection**: Protected with parameterized queries
- **Rate Limiting**: Search requests are rate-limited to prevent abuse
