'use server';

import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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
  return { licenses: [] };
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

export async function getLicenses() {
  const data = await getData();
  return data.licenses || [];
}

export async function addLicense(formData) {
  const userName = formData.get('userName');
  if (!userName) return;
  
  const userId = 'USR-' + crypto.randomUUID().slice(0, 8).toUpperCase();
  const licenseKey = 'LIC-' + crypto.randomBytes(16).toString('hex').toUpperCase();
  
  const data = await getData();
  data.licenses = data.licenses || [];
  data.licenses.push({ userId, userName, licenseKey, status: 'active', createdAt: new Date().toISOString() });
  
  await saveData(data);
  revalidatePath('/');
}

export async function toggleLicense(licenseKey, newStatus) {
  const data = await getData();
  const index = data.licenses.findIndex(w => w.licenseKey === licenseKey);
  if (index !== -1) {
    data.licenses[index].status = newStatus;
    await saveData(data);
    revalidatePath('/');
  }
}

export async function deleteLicense(licenseKey) {
  const data = await getData();
  data.licenses = data.licenses.filter(w => w.licenseKey !== licenseKey);
  await saveData(data);
  revalidatePath('/');
}
