import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY!;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;

  const token = Math.random().toString(36).substring(2);
  const expire = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  const signature = crypto.createHmac('sha1', privateKey).update(token + expire.toString()).digest('hex');

  const uploadFormData = new FormData();
  uploadFormData.append('file', file);
  uploadFormData.append('publicKey', publicKey);
  uploadFormData.append('signature', signature);
  uploadFormData.append('expire', expire.toString());
  uploadFormData.append('token', token);
  uploadFormData.append('fileName', file.name);

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    body: uploadFormData,
  });

  const result = await response.json();

  if (response.ok) {
    return NextResponse.json({ url: result.url, fileId: result.fileId });
  } else {
    return NextResponse.json({ error: result.message }, { status: response.status });
  }
}