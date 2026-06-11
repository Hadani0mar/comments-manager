import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const baseUrl = process.env.N8N_API_URL || '';
const apiKey = process.env.N8N_API_KEY || '';
const tableId = process.env.N8N_TABLE_ID || '';
const sessionSecret = process.env.SESSION_SECRET || 'default_secret';

// Configure HTTPS Agent to ignore self-signed certificates
const fetchOptions = {
  headers: {
    'X-N8N-API-KEY': apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session');
  return session && session.value === sessionSecret;
}

export async function GET() {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!baseUrl || !apiKey || !tableId) {
    return NextResponse.json({ error: 'Missing environment configurations' }, { status: 500 });
  }

  try {
    let allRows: any[] = [];
    let hasNextPage = true;
    let cursor = '';

    while (hasNextPage) {
      // url encode the colon in sortBy (createdAt%3Adesc) to prevent 400 Bad Request
      let url = `${baseUrl}/api/v1/data-tables/${tableId}/rows?sortBy=createdAt%3Adesc&limit=250`;
      if (cursor) {
        url += `&cursor=${encodeURIComponent(cursor)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: fetchOptions.headers
      });

      if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `n8n API error: ${response.status} - ${errText}` }, { status: response.status });
      }

      const result = await response.json();
      const rows = result.data || [];
      allRows = allRows.concat(rows);

      if (result.nextCursor) {
        cursor = result.nextCursor;
      } else {
        hasNextPage = false;
      }
    }

    return NextResponse.json({ data: allRows });
  } catch (error: any) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!await isAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!baseUrl || !apiKey || !tableId) {
    return NextResponse.json({ error: 'Missing environment configurations' }, { status: 500 });
  }

  try {
    const { id, text } = await request.json();
    if (!id || text === undefined) {
      return NextResponse.json({ error: 'Missing row ID or text' }, { status: 400 });
    }

    // Prepare payload to update specifically the row by ID
    const payload = {
      filter: {
        type: 'and',
        filters: [
          {
            columnName: 'id',
            condition: 'eq',
            value: Number(id)
          }
        ]
      },
      data: {
        TEXT: text
      },
      returnData: true
    };

    const response = await fetch(`${baseUrl}/api/v1/data-tables/${tableId}/rows/update`, {
      method: 'PATCH',
      headers: fetchOptions.headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `n8n Update error: ${response.status} - ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Update comment error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
