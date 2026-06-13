'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
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

export async function getWebsites() {
  const data = await getData();
  return data.websites || [];
}

export async function addWebsite(formData) {
  const domain = formData.get('domain');
  if (!domain) return;
  
  const data = await getData();
  if (!data.websites.find(w => w.domain === domain)) {
    data.websites.push({ domain, status: 'paid', content: '' });
    await saveData(data);
  }
}

export async function toggleWebsite(domain, newStatus) {
  const data = await getData();
  const index = data.websites.findIndex(w => w.domain === domain);
  if (index !== -1) {
    data.websites[index].status = newStatus;
    await saveData(data);
    revalidatePath('/');
  }
}

export async function deleteWebsite(domain) {
  const data = await getData();
  data.websites = data.websites.filter(w => w.domain !== domain);
  await saveData(data);
  revalidatePath('/');
}

export async function updateContent(domain, content) {
  const data = await getData();
  const index = data.websites.findIndex(w => w.domain === domain);
  if (index !== -1) {
    data.websites[index].content = content;
    await saveData(data);
    revalidatePath('/');
  }
}
