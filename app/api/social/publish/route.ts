import { NextResponse } from 'next/server';
import { publishToTargets, type PublishRequest } from '@/lib/social-publisher';

function isValidBody(body: any): body is PublishRequest {
  return (
    body &&
    typeof body.message === 'string' &&
    body.message.trim().length > 0 &&
    typeof body.facebookPageId === 'string' &&
    body.facebookPageId.trim().length > 0 &&
    Array.isArray(body.targets) &&
    body.targets.length > 0
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isValidBody(body)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invalid payload. Required: message, facebookPageId, and at least one target.',
        },
        { status: 400 },
      );
    }

    const results = await publishToTargets({
      message: body.message,
      videoUrl: body.videoUrl,
      youtubeTitle: body.youtubeTitle,
      youtubeDescription: body.youtubeDescription,
      facebookPageId: body.facebookPageId,
      targets: body.targets,
    });

    const hasFailure = results.some((item) => !item.success);

    return NextResponse.json(
      {
        ok: !hasFailure,
        results,
      },
      { status: hasFailure ? 207 : 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Unexpected error while publishing content.',
      },
      { status: 500 },
    );
  }
}
