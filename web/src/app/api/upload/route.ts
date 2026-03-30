import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { cookies } from 'next/headers';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return NextResponse.json({ message: 'Non autorisé.' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ message: 'Corps de requête invalide.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ message: 'Aucun fichier fourni.' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type))
    return NextResponse.json({ message: 'Format non supporté. JPEG, PNG ou WebP uniquement.' }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ message: 'Fichier trop volumineux (max 5 Mo).' }, { status: 400 });

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  try {
    await mkdir(uploadDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch {
    return NextResponse.json({ message: 'Échec de l\'enregistrement du fichier.' }, { status: 500 });
  }
}
