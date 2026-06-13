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
  const { searchParams } = new URL(request.url);
  const domainParam = searchParams.get('domain');

  if (!domainParam) {
    // Bootstrap script: executes on the client to find the real domain + pathname
    const bootstrapScript = `
      (function() {
        var d = window.location.hostname;
        if(d.startsWith('www.')) d = d.substring(4);
        var p = window.location.pathname;
        if(p && p !== '/') {
          if(p.endsWith('/')) p = p.slice(0, -1);
          d += p;
        }
        var s = document.createElement('script');
        s.src = 'https://wc.viterank.com/api/serve?domain=' + encodeURIComponent(d);
        document.head.appendChild(s);
      })();
    `;
    const headers = new Headers();
    headers.set('Content-Type', 'application/javascript');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'no-store, max-age=0');
    return new NextResponse(bootstrapScript, { headers });
  }

  // Actual payload generation
  const domain = domainParam;

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
      .replace(/\\$/g, '\\\\$');

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
