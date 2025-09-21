# Database Setup Guide for Excel Table Maker

This guide will help you set up the complete database system with Neon DB integration for the Excel Table Maker application.

## 🗄️ Database Architecture

The system uses **Neon DB** (PostgreSQL) to store:

- **Projects**: Organize your work into separate projects
- **Master Data**: Centralized dataset with all SERIAL_NUMBER, Tag_Number, and Item data
- **Processed Images**: Track image processing results and matches

## 🚀 Quick Setup

### 1. Neon DB Setup

1. **Create Neon Account**:

   - Go to [neon.tech](https://neon.tech)
   - Sign up for a free account
   - Create a new project

2. **Get Database URL**:

   - Copy your connection string from Neon dashboard
   - It should look like: `postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

3. **Update Environment Variables**:

   ```bash
   # Copy the example file
   cp env.example .env.local

   # Edit .env.local and add your database URL
   DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### 2. Backend Setup

1. **Install Dependencies**:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start Backend Server**:

   ```bash
   # Windows
   start_backend.bat

   # Or manually
   python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload --workers 4
   ```

### 3. Frontend Setup

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

## 📊 Database Schema

### Projects Table

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Master Data Items Table

```sql
CREATE TABLE master_data_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    item_description VARCHAR NOT NULL,
    serial_number VARCHAR NOT NULL,
    tag_number VARCHAR NOT NULL,
    quantity INTEGER DEFAULT 1,
    status VARCHAR DEFAULT 'New',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Processed Images Table

```sql
CREATE TABLE processed_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    filename VARCHAR NOT NULL,
    extracted_data TEXT, -- JSON string
    matched_data TEXT,   -- JSON string
    processing_status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 Features Overview

### 1. Project Management

- **Create Projects**: Organize your work into separate projects
- **Project Selection**: Switch between different projects
- **Project Overview**: See master data count and project details

### 2. Master Data Management

- **Add Items**: Manually add SERIAL_NUMBER, Tag_Number, and Item data
- **Search & Filter**: Find items by type (Screen/CPU) or search terms
- **Edit/Delete**: Modify or remove items from master data
- **Bulk Import**: Import data from Excel files

### 3. Data Matching System

- **Automatic Matching**: Compare extracted data with master dataset
- **Confidence Scoring**: Rate matches by accuracy (100% = exact match)
- **Match Types**:
  - **Exact**: Both SERIAL_NUMBER and Tag_Number match
  - **Serial Only**: Only SERIAL_NUMBER matches
  - **Tag Only**: Only Tag_Number matches
  - **Partial**: Partial matches in either field

### 4. Data Correction

- **Visual Interface**: See extracted data vs master data side by side
- **One-Click Correction**: Apply master data to incorrect extractions
- **Batch Correction**: Correct multiple items at once
- **Validation**: Ensure data accuracy before processing

### 5. Excel Export

- **Screen/CPU Format**: Export in the exact format you showed
- **Unified Format**: Export all data in a single table
- **Project-Specific**: Export data for specific projects

## 📋 Workflow

### 1. Create Project

1. Go to **Projects** tab
2. Click **Create New Project**
3. Enter project name and description
4. Select the project to work with

### 2. Add Master Data

1. In the **Master Data Management** section
2. Click **Add Item** to manually add data
3. Or use **Import Excel** for bulk import
4. Verify all SERIAL_NUMBER and Tag_Number data

### 3. Process Images

1. Go to **Extract** tab
2. Upload your images
3. Process images (they'll be automatically matched)
4. Review matches in **Data Matching** section

### 4. Correct Data

1. Review extracted data vs master data
2. Select correct matches for each item
3. Click **Apply Corrections**
4. Export corrected data to Excel

## 🎯 Excel Output Format

The system generates Excel files in the exact format you requested:

| Screen | serial number | Codification      | CPU | Serial number | codification       |
| ------ | ------------- | ----------------- | --- | ------------- | ------------------ |
| SCREEN | 1h35070TBQ    | MOH/DIG/25/SCR260 | CPU | 1hf5110XYZ    | MOH/DIG/25/CPU1580 |
| SCREEN | 1h35070TFN    | MOH/DIG/25/SCR189 | CPU | 1hf5110WKQ    | MOH/DIG/25/CPU271  |

## 🔍 Data Matching Logic

### Confidence Scoring

- **100%**: Exact match (SERIAL_NUMBER + Tag_Number)
- **80%**: Serial number match only
- **70%**: Tag number match only
- **60%**: Partial serial number match
- **50%**: Partial tag number match

### Matching Process

1. **Extract Data**: Process image to get SERIAL_NUMBER, Tag_Number, etc.
2. **Find Matches**: Compare with master dataset
3. **Score Matches**: Calculate confidence for each potential match
4. **Present Options**: Show best matches to user
5. **Apply Corrections**: User selects correct matches
6. **Export Results**: Generate corrected Excel file

## 🛠️ Troubleshooting

### Database Connection Issues

```bash
# Check if backend is running
curl http://localhost:8000/health

# Check database connection
# Look for errors in backend logs
```

### Common Issues

1. **"Project not found"**: Make sure you've created a project first
2. **"No matches found"**: Add items to master data
3. **"Export failed"**: Check if project has data

### Debug Mode

```javascript
// Enable debug logging in browser console
localStorage.setItem("debug", "true");
```

## 📈 Performance Tips

1. **Batch Processing**: Process multiple images at once
2. **Master Data**: Keep master dataset updated and clean
3. **Project Organization**: Use separate projects for different datasets
4. **Regular Exports**: Export data regularly to avoid data loss

## 🔒 Security

- **API Keys**: Stored securely in environment variables
- **Database**: Uses SSL connections
- **Data Privacy**: No data stored permanently on client
- **Access Control**: Project-based data isolation

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review backend logs for errors
3. Verify database connection
4. Ensure all environment variables are set

## 🎉 Success!

Once set up, you'll have a complete system that:

- ✅ Manages master datasets with SERIAL_NUMBER and Tag_Number
- ✅ Automatically matches extracted data with master data
- ✅ Allows easy correction of incorrect data
- ✅ Exports Excel files in your exact format
- ✅ Organizes everything by projects
- ✅ Handles 50+ images with batch processing
- ✅ Provides accurate data extraction and correction
