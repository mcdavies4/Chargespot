// api/notify.js — Vercel Serverless Function
// Sends web push notifications to NestCharge users

import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:hello@nestcharge.co.uk',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subscription, title, body, url, tag } = req.body;

  if (!subscription || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = JSON.stringify({
    title,
    body,
    url: url || '/bookings.html',
    tag: tag || 'nestcharge',
    icon: '/icon-192.png'
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Push error:', error);
    // Subscription expired or invalid
    if (error.statusCode === 410 || error.statusCode === 404) {
      return res.status(410).json({ error: 'Subscription expired' });
    }
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
