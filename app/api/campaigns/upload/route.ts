import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/upload
 * Upload and validate spreadsheet for contact automation campaign
 * Public endpoint - no authentication required
 * Version: 1.0
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - be more permissive to handle various browser behaviors
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream', // Some browsers send this for Excel files
      '' // Empty type for some file uploads
    ];

    const allowedExtensions = /\.(csv|xls|xlsx)$/i;

    // Allow if MIME type is allowed OR file has correct extension
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.test(file.name);

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload CSV, XLS, or XLSX file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Read and parse file
    const buffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(buffer);

    let rows: any[] = [];

    // Try to detect file type and parse accordingly
    const isExcelFile = file.name.match(/\.(xlsx|xls)$/i) ||
                       file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                       file.type === 'application/vnd.ms-excel';

    console.log('[File Upload] File detection:', {
      name: file.name,
      type: file.type,
      size: file.size,
      detectedAsExcel: isExcelFile
    });

    if (isExcelFile) {
      console.log('[Excel Upload] Processing Excel file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Parse Excel file
      let workbook;
      try {
        workbook = XLSX.read(buffer, { type: 'buffer' });
        console.log('[Excel Upload] Successfully parsed workbook, sheets:', workbook.SheetNames);
      } catch (excelError) {
        console.error('[Excel Upload] Failed to parse Excel file:', excelError);
        return NextResponse.json(
          { error: 'Failed to parse Excel file. Please ensure it is a valid Excel file and try again.' },
          { status: 400 }
        );
      }

      // Get the first worksheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to array of arrays (same format as CSV)
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      console.log('[Excel Upload] Converted to CSV data, length:', csvData.length);

      // Parse CSV data (same logic as CSV files)
      const lines = csvData.split('\n').filter(line => line.trim());
      console.log('[Excel Upload] CSV lines after split and filter:', lines.length);

      if (lines.length < 1) {
        return NextResponse.json(
          { error: 'Excel file is empty or contains no valid data' },
          { status: 400 }
        );
      }

      const firstLine = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      
      // Detect if first row is headers or data
      // If any column looks like a URL or domain, treat it as data without headers
      const hasUrlInFirstRow = firstLine.some(value => {
        const lower = value.toLowerCase();
        return lower.includes('http') || 
               lower.includes('.com') || 
               lower.includes('.net') || 
               lower.includes('.org') || 
               lower.includes('.io') ||
               lower.includes('.co') ||
               lower.includes('www.');
      });
      
      const hasHeaders = !hasUrlInFirstRow;
      
      let headers: string[];
      let startRow: number;
      
      if (hasHeaders) {
        headers = firstLine;
        startRow = 1;
        
        // Validate required columns
        const hasWebsiteUrl = headers.some(h => 
          h.toLowerCase().includes('website') || 
          h.toLowerCase().includes('url') ||
          h.toLowerCase().includes('site')
        );
        
        if (!hasWebsiteUrl) {
          return NextResponse.json(
            { 
              error: `Missing required column: website_url. This is the only required column - company names will be auto-detected.`,
              headers
            },
            { status: 400 }
          );
        }
      } else {
        // No headers - detect columns by analyzing data patterns
        // Look at first few rows to detect column types
        const sampleSize = Math.min(5, lines.length);
        const columnPatterns: { [key: number]: { isUrl: number; isEmail: number; isPhone: number; isText: number } } = {};
        
        // Initialize pattern counters for each column
        for (let col = 0; col < firstLine.length; col++) {
          columnPatterns[col] = { isUrl: 0, isEmail: 0, isPhone: 0, isText: 0 };
        }
        
        // Analyze first few rows
        for (let row = 0; row < sampleSize; row++) {
          const values = lines[row].split(',').map(v => v.trim().replace(/['"]/g, ''));
          values.forEach((value, col) => {
            const lower = value.toLowerCase();
            
            // Check if it's a URL
            if (lower.includes('http') || lower.includes('.com') || lower.includes('.net') || 
                lower.includes('.org') || lower.includes('.io') || lower.includes('.co') || 
                lower.includes('www.') || /\.[a-z]{2,}/.test(lower)) {
              columnPatterns[col].isUrl++;
            }
            // Check if it's an email
            else if (value.includes('@') && value.includes('.')) {
              columnPatterns[col].isEmail++;
            }
            // Check if it's a phone number
            else if (/[\d\-\+\(\)\s]{7,}/.test(value) && /\d{3,}/.test(value)) {
              columnPatterns[col].isPhone++;
            }
            // Otherwise it's text
            else if (value.length > 0) {
              columnPatterns[col].isText++;
            }
          });
        }
        
        // Assign column types based on patterns (already normalized)
        headers = [];
        let urlColumnFound = false;
        
        for (let col = 0; col < firstLine.length; col++) {
          const patterns = columnPatterns[col];
          
          if (patterns.isUrl > 0 && !urlColumnFound) {
            headers.push('website_url'); // Already normalized
            urlColumnFound = true;
          } else if (patterns.isEmail > 0) {
            headers.push('contact_email'); // Already normalized
          } else if (patterns.isPhone > 0) {
            headers.push('phone'); // Already normalized
          } else if (patterns.isText > 0) {
            headers.push('company_name'); // Already normalized
          } else {
            headers.push(`column_${col}`);
          }
        }
        
        if (!urlColumnFound) {
          return NextResponse.json(
            { 
              error: `Could not detect website URL column. Please ensure at least one column contains website URLs.`
            },
            { status: 400 }
          );
        }
        
        startRow = 0;
      }

      console.log('[CSV Debug] Headers detected:', headers);
      console.log('[CSV Debug] Start row:', startRow);
      console.log('[CSV Debug] Total lines:', lines.length);

      // Normalize header names to standard field names
      const normalizeHeader = (header: string): string => {
        const lower = header.toLowerCase().replace(/\s+/g, '_');
        
        // Map various URL field names to website_url
        if (lower.includes('website') || lower.includes('url') || lower === 'site') {
          return 'website_url';
        }
        // Map various company name fields
        if (lower.includes('company') || lower === 'name' || lower === 'business') {
          return 'company_name';
        }
        // Map email fields
        if (lower.includes('email') || lower.includes('mail')) {
          return 'contact_email';
        }
        // Map phone fields
        if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel')) {
          return 'phone';
        }
        // Map contact person fields
        if (lower.includes('contact') && (lower.includes('person') || lower.includes('name'))) {
          return 'contact_person';
        }
        
        return lower;
      };

      // Parse data rows
      for (let i = startRow; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
        
        // Skip empty rows
        const hasData = values.some(v => v && v.trim() !== '');
        if (!hasData) {
          console.log(`[CSV Debug] Row ${i} is empty, skipping`);
          continue;
        }
        
        const row: any = {};
        
        console.log(`[CSV Debug] Row ${i} values:`, values);
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          const normalizedHeader = normalizeHeader(header);
          row[normalizedHeader] = value;
        });

        console.log(`[CSV Debug] Row ${i} object:`, row);

        // Validate website URL
        if (row.website_url && !row.website_url.startsWith('http')) {
          row.website_url = 'https://' + row.website_url;
        }

        // Auto-generate company name from domain if missing
        if (!row.company_name || row.company_name.trim() === '') {
          try {
            const url = new URL(row.website_url.startsWith('http') ? row.website_url : `https://${row.website_url}`);
            let domain = url.hostname.replace(/^www\./i, '');
            const domainParts = domain.split('.');
            let companyName = domainParts[0];
            // Capitalize
            companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1);
            row.company_name = companyName;
          } catch (e) {
            row.company_name = row.website_url;
          }
        }

        rows.push(row);
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload CSV, XLS, or XLSX file.' },
        { status: 400 }
      );
    }

    // Validate rows (only website_url is required)
    console.log('[CSV Debug] Total rows before validation:', rows.length);
    console.log('[CSV Debug] All rows:', rows);
    
    const validRows = rows.filter(row => row.website_url && row.website_url.trim() !== '');
    const invalidRows = rows.length - validRows.length;

    console.log('[CSV Debug] Valid rows:', validRows.length);
    console.log('[CSV Debug] Invalid rows:', invalidRows);

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows found. Each row must have a website_url' },
        { status: 400 }
      );
    }

    // Store file temporarily (in production, upload to Supabase Storage)
    const fileData = {
      filename: file.name,
      size: file.size,
      rows: validRows,
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'File uploaded and validated successfully',
      data: fileData
    });

  } catch (error: any) {
    console.error('[Campaign Upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
