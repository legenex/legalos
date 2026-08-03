'use client'

/**
 * Shrink an image in the browser before it is posted to a server action.
 *
 * This exists because a server action body is capped, and the cap is enforced
 * by the framework BEFORE the action runs - the request is rejected with a 413
 * that no `try` inside the action can catch, and which surfaces to the operator
 * as an opaque "error occurred in the Server Components render". So the size
 * has to be right on the way out, not validated on the way in.
 *
 * Downscaling is the correct fix rather than a way around the cap. Anthropic's
 * vision models resize anything longer than 1568px on its long edge before
 * reading it, so a 4000px screenshot carries no more brand information than the
 * same image at 1568px - it just costs bandwidth, tokens and money to send.
 * The brand-relevant content (a logo's colours, a page's palette, the shape of
 * its type) survives the resize intact.
 */

/** The long edge above which the model gains nothing. */
export const MAX_IMAGE_EDGE = 1568

/** Quality ladder, tried in order until the result fits. */
const JPEG_QUALITY = [0.82, 0.7, 0.6] as const

/** Formats that can carry transparency, which a logo usually needs. */
const ALPHA_TYPES = ['image/png', 'image/webp', 'image/gif']

export type PreparedImage = {
  name: string
  /** A full data: URL. The server strips the prefix. */
  dataBase64: string
  mediaType: string
  /** Length of the encoded string, which is what actually crosses the wire. */
  bytes: number
}

const encode = (canvas: HTMLCanvasElement, type: string, quality?: number): string =>
  canvas.toDataURL(type, quality)

/**
 * Resize and re-encode one file.
 *
 * Transparency is preserved where it can be: a PNG logo re-encoded as JPEG
 * would gain a background, and for a logo drawn in white that means a white
 * shape on a white card. So alpha-capable sources are kept as PNG when the
 * result fits, and only fall back to JPEG (composited onto white, never black)
 * when the PNG is too heavy to send.
 */
export async function prepareBrandImage(
  file: File,
  maxBase64: number,
): Promise<PreparedImage | { error: string }> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { error: `${file.name} could not be read as an image.` }
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return { error: 'This browser could not process the image.' }

    ctx.drawImage(bitmap, 0, 0, w, h)

    if (ALPHA_TYPES.includes(file.type)) {
      const png = encode(canvas, 'image/png')
      if (png.length <= maxBase64) {
        return { name: file.name, dataBase64: png, mediaType: 'image/png', bytes: png.length }
      }
    }

    // Composite onto white before flattening, so a transparent background
    // becomes paper rather than the black an empty canvas would give it.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(bitmap, 0, 0, w, h)

    for (const quality of JPEG_QUALITY) {
      const jpeg = encode(canvas, 'image/jpeg', quality)
      if (jpeg.length <= maxBase64) {
        return { name: file.name, dataBase64: jpeg, mediaType: 'image/jpeg', bytes: jpeg.length }
      }
    }
    return { error: `${file.name} is too detailed to send even after resizing. Try a smaller crop.` }
  } finally {
    bitmap.close()
  }
}
