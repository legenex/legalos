import { NextResponse, type NextRequest } from 'next/server'
import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
])
const EXT_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'missing file' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: 'empty file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: `file exceeds ${MAX_BYTES / 1024 / 1024}MB limit` },
      { status: 413 },
    )
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: `unsupported type: ${file.type}` },
      { status: 415 },
    )
  }

  // Derive extension from MIME (don't trust client filename for safety).
  const ext = EXT_BY_MIME[file.type] ?? (extname(file.name).toLowerCase() || '.bin')
  const filename = `${randomBytes(12).toString('hex')}${ext}`
  const dir = join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  const filepath = join(dir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buffer)

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` })
}
