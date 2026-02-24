export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    const timestamp = Math.floor(Date.now() / 1000);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Cloudinary credentials missing');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // ✅ Correct Cloudinary signature - params in alphabetical order + apiSecret at end
    const folder = 'nightpulse';
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const body = new FormData();
    body.append('file', `data:${file.type};base64,${base64}`);
    body.append('timestamp', String(timestamp));
    body.append('api_key', apiKey);
    body.append('signature', signature);
    body.append('folder', folder);

    const res = await fetch(uploadUrl, { method: 'POST', body });
    if (!res.ok) {
      const text = await res.text();
      console.error('Cloudinary upload failed', res.status, text);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.secure_url, raw: data });
  } catch (error) {
    console.error('Upload error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}