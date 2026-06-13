import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data.json');

async function getData() {
  try {
    const data = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { websites: [] };
  }
}

async function saveData(data) {
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

export async function GET(request) {
  const referer = request.headers.get('referer') || request.headers.get('origin');
  
  if (!referer) {
    return new NextResponse('console.warn("WebControl: No referer/origin found");', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  let domain = '';
  try {
    const url = new URL(referer);
    domain = url.hostname;
    // Strip 'www.' for consistency
    if (domain.startsWith('www.')) {
      domain = domain.substring(4);
    }
  } catch (e) {
    return new NextResponse('console.warn("WebControl: Invalid referer");', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  const data = await getData();
  let site = data.websites.find(w => w.domain === domain);

  if (!site) {
    // Auto-register domain
    site = { domain, status: 'paid', content: '' };
    data.websites.push(site);
    await saveData(data);
  }

  let scriptContent = '';

  if (site.status === 'paid' && site.content) {
    // Escape backticks and standard escape characters for JS injection
    const escapedContent = site.content
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    scriptContent = `
      (function() {
        const injectContent = () => {
          const container = document.createElement('div');
          container.innerHTML = \`${escapedContent}\`;
          document.body.appendChild(container);
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', injectContent);
        } else {
          injectContent();
        }
      })();
    `;
  } else {
    scriptContent = 'console.log("WebControl: Domain is unpaid or has no content.");';
  }

  // Handle CORS
  const headers = new Headers();
  headers.set('Content-Type', 'application/javascript');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cache-Control', 'no-store, max-age=0'); // Ensure it's not cached so status changes apply immediately

  return new NextResponse(scriptContent, { headers });
}
