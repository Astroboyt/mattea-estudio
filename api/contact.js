import { Resend } from 'resend'

/*
 * Receives the contact form as JSON (text fields + Blob photo URLs) and
 * emails it to the studio via Resend.
 *
 * Env:
 *   RESEND_API_KEY  – required
 *   CONTACT_TO      – where enquiries land (default matteaestudio@gmail.com)
 *   CONTACT_FROM    – verified sender (default Resend's shared onboarding address,
 *                     which only delivers to the Resend account owner's inbox —
 *                     set this to hello@estudiomattea.com once the domain is
 *                     verified in Resend)
 */
const TO = process.env.CONTACT_TO || 'matteaestudio@gmail.com'
const FROM = process.env.CONTACT_FROM || 'Mattea Estudio <onboarding@resend.dev>'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, place, message, photos, company } = req.body || {}

  // Honeypot — bots fill hidden fields; pretend it worked.
  if (company) return res.status(200).json({ ok: true })

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  if (!EMAIL_RE.test(String(email)) || String(email).length > 200) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  if (String(name).length > 200 || String(message).length > 8000 || String(place || '').length > 300) {
    return res.status(400).json({ error: 'Field too long' })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Email is not configured yet' })

  const photoUrls = Array.isArray(photos)
    ? photos.filter((u) => typeof u === 'string' && u.startsWith('https://')).slice(0, 20)
    : []

  const text = [
    `Name:  ${name}`,
    `Email: ${email}`,
    `Where's the wall: ${place || '—'}`,
    '',
    message,
    '',
    `Photos / references (${photoUrls.length}):`,
    photoUrls.length ? photoUrls.map((u) => `  ${u}`).join('\n') : '  (none)',
  ].join('\n')

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to: [TO],
      replyTo: String(email),
      subject: `New mural enquiry — ${name}`,
      text,
    })
    if (error) {
      console.error('Resend error', error)
      return res.status(502).json({ error: 'Could not send the message' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('contact handler error', err)
    return res.status(500).json({ error: 'Could not send the message' })
  }
}
