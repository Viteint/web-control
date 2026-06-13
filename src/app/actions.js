'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

const dataFile = path.join(process.cwd(), 'data.json');

export async function login(formData) {
  const username = formData.get('username');
  const password = formData.get('password');

  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const cookieStore = await cookies();
    cookieStore.set('auth_token', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    redirect('/');
  } else {
    return { error: 'Invalid credentials' };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/login');
}

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

export async function getWebsites() {
  const data = await getData();
  return data.websites || [];
}

export async function addWebsite(formData) {
  const domain = formData.get('domain');
  const filePath = formData.get('filePath');
  if (!domain) return;
  
  const data = await getData();
  if (!data.websites.find(w => w.domain === domain)) {
    data.websites.push({ domain, status: 'paid', filePath: filePath || '' });
    await saveData(data);
  }
}

export async function toggleWebsite(domain, newStatus) {
  const data = await getData();
  const index = data.websites.findIndex(w => w.domain === domain);
  if (index !== -1) {
    data.websites[index].status = newStatus;
    await saveData(data);
  }
}

export async function deleteWebsite(domain) {
  const data = await getData();
  data.websites = data.websites.filter(w => w.domain !== domain);
  await saveData(data);
}

export async function removeCode(domain) {
  const data = await getData();
  const site = data.websites.find(w => w.domain === domain);
  
  if (site && site.filePath) {
    try {
      // 1. Read the remote file
      let content = await fs.readFile(site.filePath, 'utf8');
      
      // 2. Remove the disguised custom analytics block
      // Regex looks for <!-- Custom Analytics --> ... <!-- End Custom Analytics -->
      const regex = /<!-- Custom Analytics -->[\s\S]*?<!-- End Custom Analytics -->/g;
      
      if (regex.test(content)) {
        content = content.replace(regex, '');
        // 3. Write it back
        await fs.writeFile(site.filePath, content, 'utf8');
      }
    } catch (err) {
      console.error('Failed to remove code from file:', err);
      // We log but still proceed to delete the record
    }
  }

  // Finally, remove the website from the dashboard
  data.websites = data.websites.filter(w => w.domain !== domain);
  await saveData(data);
}
