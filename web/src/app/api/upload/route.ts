import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const ALLOWED_UPLOAD_ROLES = new Set(["ADMIN", "ORGANIZER"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const DEFAULT_BUCKET = "event-images";

interface ProfileResponse {
  role?: { name?: string };
}

async function authorizeUpload(token: string): Promise<NextResponse | null> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { message: "Service de validation indisponible." },
      { status: 503 },
    );
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "API indisponible." }, { status: 503 });
  }

  if (!response.ok) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  const profile = (await response.json()) as ProfileResponse;
  if (!profile.role?.name || !ALLOWED_UPLOAD_ROLES.has(profile.role.name)) {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 });
  }

  return null;
}

async function uploadToSupabase(
  file: File,
  filename: string,
): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY; // legacy fallback
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? DEFAULT_BUCKET;

  if (!supabaseUrl || !secretKey) return null;
  if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(bucket)) {
    throw new Error("Invalid SUPABASE_STORAGE_BUCKET");
  }

  const objectPath = `events/${filename}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath}`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": file.type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-upsert": "false",
    },
    body: await file.arrayBuffer(),
  });

  if (!response.ok) {
    console.error(
      "[upload route] Supabase Storage returned",
      response.status,
      await response.text(),
    );
    throw new Error("Supabase Storage upload failed");
  }

  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`;
}

async function saveLocally(file: File, filename: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(
    path.join(uploadDir, filename),
    Buffer.from(await file.arrayBuffer()),
  );
  return `/uploads/${filename}`;
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  }

  const authorizationError = await authorizeUpload(token);
  if (authorizationError) return authorizationError;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { message: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { message: "Aucun fichier fourni." },
      { status: 400 },
    );
  }

  const extension = ALLOWED_TYPES.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { message: "Format non supporté. JPEG, PNG ou WebP uniquement." },
      { status: 400 },
    );
  }
  if (file.size === 0 || file.size > MAX_SIZE) {
    return NextResponse.json(
      { message: "Fichier vide ou trop volumineux (max 5 Mo)." },
      { status: 400 },
    );
  }

  const filename = `${crypto.randomUUID()}.${extension}`;

  try {
    const supabaseUrl = await uploadToSupabase(file, filename);
    if (supabaseUrl) return NextResponse.json({ url: supabaseUrl });

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { message: "Supabase Storage non configuré." },
        { status: 503 },
      );
    }

    return NextResponse.json({ url: await saveLocally(file, filename) });
  } catch {
    return NextResponse.json(
      { message: "Échec de l'enregistrement du fichier." },
      { status: 500 },
    );
  }
}
