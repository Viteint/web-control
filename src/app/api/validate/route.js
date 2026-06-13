import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const payload = await request.json();
    const licenseKey = payload?.meta?.key;
    
    if (!licenseKey) {
      return NextResponse.json({ error: 'Missing license key' }, { status: 400 });
    }

    // Read Data Store
    const envFile = path.join(process.cwd(), '.env');
    let data = { licenses: [] };
    try {
      const envContent = await fs.readFile(envFile, 'utf8');
      const match = envContent.match(/^DATA_STORE=(.*)$/m);
      if (match && match[1]) {
        let val = match[1];
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        data = JSON.parse(val);
      }
    } catch (e) {
      // no data file yet
    }
    
    // Find matching license key
    const license = (data.licenses || []).find(l => l.licenseKey === licenseKey);
    
    // Check validity
    if (license && license.status === 'active') {
      return NextResponse.json({
        meta: { valid: true, code: 'VALID', detail: 'License is active and valid.' }
      });
    } else if (license && license.status === 'revoked') {
      return NextResponse.json({
        meta: { valid: false, code: 'REVOKED', detail: 'License has been revoked.' }
      }, { status: 403 });
    } else {
      return NextResponse.json({
        meta: { valid: false, code: 'NOT_FOUND', detail: 'License key is invalid.' }
      }, { status: 404 });
    }
    
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
