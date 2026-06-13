import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const envFile = path.join(process.cwd(), '.env');

async function getData() {
  try {
    const envContent = await fs.readFile(envFile, 'utf8');
    const match = envContent.match(/^DATA_STORE=(.*)$/m);
    if (match && match[1]) {
      let val = match[1];
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      return JSON.parse(val);
    }
  } catch (error) {
    // ignore
  }
  return { websites: [] };
}

async function saveData(data) {
  const newDataStr = JSON.stringify(data);
  try {
    let envContent = await fs.readFile(envFile, 'utf8');
    if (envContent.match(/^DATA_STORE=.*$/m)) {
      envContent = envContent.replace(/^DATA_STORE=.*$/m, `DATA_STORE='${newDataStr}'`);
    } else {
      envContent += `\nDATA_STORE='${newDataStr}'\n`;
    }
    await fs.writeFile(envFile, envContent);
  } catch (error) {
    await fs.writeFile(envFile, `DATA_STORE='${newDataStr}'\n`);
  }
}

export async function GET(request) {
  const host = request.headers.get('host') || 'wc.viterank.com';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${host}`;

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
        s.src = '${baseUrl}/api/serve?domain=' + encodeURIComponent(d);
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

  if (site.status === 'unpaid') {
    // If unpaid but no content is set, provide a default suspension message
    const defaultMessage = '<h1 style="font-family: sans-serif; padding: 2rem;">This website has been suspended. Please contact the developer.</h1>';
    const messageToInject = site.content ? site.content : defaultMessage;

    // Escape backticks and standard escape characters for JS injection
    const escapedContent = messageToInject
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\\$/g, '\\\\$');

    scriptContent = `
      (function() {
        const injectContent = () => {
          // Remove existing body content
          document.body.innerHTML = '';
          
          // Create a full-screen overlay
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#ffffff;z-index:2147483647;display:flex;align-items:center;justify-content:center;text-align:center;color:#000;';
          overlay.innerHTML = \`${escapedContent}\`;
          
          document.body.appendChild(overlay);
          document.body.style.overflow = 'hidden';
        };

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', injectContent);
        } else {
          injectContent();
        }
      })();
    `;
  } else {
    scriptContent = 'console.log("WebControl: Domain is active and authorized.");';
  }

  // Handle CORS
  const headers = new Headers();
  headers.set('Content-Type', 'application/javascript');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cache-Control', 'no-store, max-age=0'); // Ensure it's not cached so status changes apply immediately

  return new NextResponse(scriptContent, { headers });
}
