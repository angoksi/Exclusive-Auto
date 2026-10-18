import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads');

const SIGS: { ext: string; mime: string; test: (b: Buffer) => boolean; kind: 'image' | 'document' }[] = [
  { ext: 'jpg', mime: 'image/jpeg', kind: 'image', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', kind: 'image', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', mime: 'image/webp', kind: 'image', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  { ext: 'pdf', mime: 'application/pdf', kind: 'document', test: (b) => b.subarray(0, 4).toString() === '%PDF' },
];
export const MIME_BY_EXT = Object.fromEntries(SIGS.map((s) => [s.ext, s.mime]));

/** Записва файл след проверка на размер и „магически байтове“ (не се доверява на разширението/MIME от клиента). */
export async function saveUpload(file: File, area: 'public' | 'private'): Promise<string> {
  const max = area === 'public' ? 6 * 1024 * 1024 : 12 * 1024 * 1024;
  if (!file.size) throw new Error('Празен файл.');
  if (file.size > max) throw new Error(`Файлът е твърде голям (макс. ${max / 1024 / 1024} MB).`);
  const buf = Buffer.from(await file.arrayBuffer());
  const sig = SIGS.find((s) => s.test(buf) && (area === 'private' || s.kind === 'image'));
  if (!sig) throw new Error(area === 'public' ? 'Позволени са JPG, PNG и WEBP изображения.' : 'Позволени са PDF, JPG, PNG и WEBP файлове.');
  const dir = path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, area);
  await fs.mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${sig.ext}`;
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, name), buf);
  return name;
}

export async function readUpload(area: 'public' | 'private', name: string) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/.test(name)) return null;
  try {
    return await fs.readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, area, name));
  } catch {
    return null;
  }
}
