import { handleUpload } from '@vercel/blob/client'

/*
 * Issues short-lived tokens so the contact form can upload photos straight
 * from the browser to Blob storage, bypassing the 4.5 MB function body limit.
 * The uploaded URLs are then passed to /api/contact and included in the email.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/heic',
          'image/heif',
          'application/pdf',
        ],
        maximumSizeInBytes: 15 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {},
    })
    res.status(200).json(jsonResponse)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
