## Social Auto Publisher (YouTube + Facebook)

This project now includes an automation app that can post content to:

- Facebook Pages (text/link post)
- YouTube (video upload from a public video URL)

### What was added

- UI page: `GET /automation`
- Publish API: `POST /api/social/publish`
- Scheduled automation endpoint: `GET /api/social/cron`
- Vercel cron config (`vercel.json`) for daily auto-publishing

## 1) Configure API credentials

Copy `.env.example` into `.env` and fill in:

```bash
FACEBOOK_PAGE_ACCESS_TOKEN=...
YOUTUBE_ACCESS_TOKEN=...
CRON_SECRET=...
SOCIAL_AUTOMATION_DEFAULT_PAYLOAD_JSON={...}
```

### Required tokens

- **Facebook Page Access Token** with permission to publish to your page.
- **YouTube OAuth Access Token** with upload permission (`youtube.upload`).

> Note: YouTube upload tokens typically expire. For production use, implement refresh-token flow and store refreshed tokens securely.

## 2) Local run

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000/automation`

## 3) API usage

### Publish now

`POST /api/social/publish`

```json
{
  "message": "New launch video is live!",
  "videoUrl": "https://example.com/my-video.mp4",
  "youtubeTitle": "Launch Video",
  "youtubeDescription": "Short description",
  "facebookPageId": "1234567890",
  "targets": ["facebook", "youtube"]
}
```

### Cron-triggered publish

`GET /api/social/cron`

- Uses `SOCIAL_AUTOMATION_DEFAULT_PAYLOAD_JSON`.
- Optionally validates `Authorization: Bearer <CRON_SECRET>`.

## 4) Deploy (Vercel)

1. Push this repo to GitHub.
2. Import project in Vercel.
3. Add all environment variables from `.env.example`.
4. Deploy.
5. Verify cron route logs in Vercel (`/api/social/cron`).

`vercel.json` is already configured for a once-daily schedule (`0 14 * * *`).

## Security notes

- Never expose API tokens to client-side code.
- Restrict cron endpoint with `CRON_SECRET`.
- Consider adding request signing and payload validation for stricter controls.
