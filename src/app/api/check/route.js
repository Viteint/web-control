import { NextResponse } from 'next/server';
import { getWebsites } from '../../actions';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain parameter is required' }, { status: 400 });
  }

  const websites = await getWebsites();
  const site = websites.find(w => w.domain === domain);

  if (!site) {
    // If not found in the control panel, we assume it's normal/safe.
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  // Set CORS headers so any site can call this endpoint
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  return NextResponse.json({ status: site.status }, { headers });
}

export async function OPTIONS(request) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
