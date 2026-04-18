import { NextResponse } from 'next/server';
import { publishToTargets, type PublishRequest } from '@/lib/social-publisher';

function parseDefaultPayload(): PublishRequest {
  const raw = process.env.SOCIAL_AUTOMATION_DEFAULT_PAYLOAD_JSON;

  if (!raw) {
    throw new Error(
      'Missing SOCIAL_AUTOMATION_DEFAULT_PAYLOAD_JSON env var for cron workflow.',
    );
  }

  const payload = JSON.parse(raw);

  if (
    !payload?.message ||
    !payload?.facebookPageId ||
    !Array.isArray(payload?.targets) ||
    payload.targets.length === 0
  ) {
    throw new Error('SOCIAL_AUTOMATION_DEFAULT_PAYLOAD_JSON has invalid shape.');
  }

  return payload as PublishRequest;
}

export async function GET(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;

    if (secret) {
      const authHeader = request.headers.get('authorization');

      if (authHeader !== `Bearer ${secret}`) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const payload = parseDefaultPayload();
    const results = await publishToTargets(payload);

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Cron publishing failed.' },
      { status: 500 },
    );
  }
}
