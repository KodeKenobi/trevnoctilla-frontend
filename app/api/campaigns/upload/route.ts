import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/campaigns/upload
 * Upload and validate spreadsheet for contact automation campaign
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xls|xlsx)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload CSV or Excel file.' },
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
    
    // Parse CSV (simple implementation - you may want to use a library like papaparse)
    if (file.name.endsWith('.csv')) {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return NextResponse.json(
          { error: 'Spreadsheet must contain at least a header row and one data row' },
          { status: 400 }
        );
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      
      // Validate required columns (only website_url is required now)
      const requiredColumns = ['website_url'];
      const missingColumns = requiredColumns.filter(col => 
        !headers.some(h => h.toLowerCase().includes(col.replace('_', ' ')) || h.toLowerCase().includes(col))
      );

      if (missingColumns.length > 0) {
        return NextResponse.json(
          { 
            error: `Missing required column: website_url. This is the only required column - company names will be auto-detected.`,
            headers
          },
          { status: 400 }
        );
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row: any = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          row[header.toLowerCase().replace(/\s+/g, '_')] = value;
        });

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
      // For Excel files, we'll need to use a library on the server side
      // For now, return error asking user to convert to CSV
      return NextResponse.json(
        { error: 'Please convert Excel file to CSV format for upload' },
        { status: 400 }
      );
    }

    // Validate rows (only website_url is required)
    const validRows = rows.filter(row => row.website_url && row.website_url.trim() !== '');
    const invalidRows = rows.length - validRows.length;

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
