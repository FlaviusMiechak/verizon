export type PublishRequest = {
  message: string;
  videoUrl?: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
  facebookPageId: string;
  targets: Array<'youtube' | 'facebook'>;
};

export type PublishResult = {
  target: 'youtube' | 'facebook';
  success: boolean;
  id?: string;
  error?: string;
};

const YOUTUBE_UPLOAD_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart';

function ensureEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function postToFacebook(input: PublishRequest): Promise<PublishResult> {
  const token = ensureEnv('FACEBOOK_PAGE_ACCESS_TOKEN');

  const response = await fetch(
    `https://graph.facebook.com/v20.0/${input.facebookPageId}/feed`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        message: input.message,
        ...(input.videoUrl ? { link: input.videoUrl } : {}),
        access_token: token,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    return {
      target: 'facebook',
      success: false,
      error: data?.error?.message ?? 'Failed to publish post to Facebook.',
    };
  }

  return {
    target: 'facebook',
    success: true,
    id: data?.id,
  };
}

async function postToYouTube(input: PublishRequest): Promise<PublishResult> {
  if (!input.videoUrl) {
    return {
      target: 'youtube',
      success: false,
      error: 'YouTube publishing requires a publicly reachable videoUrl.',
    };
  }

  const token = ensureEnv('YOUTUBE_ACCESS_TOKEN');

  const videoResponse = await fetch(input.videoUrl);

  if (!videoResponse.ok) {
    return {
      target: 'youtube',
      success: false,
      error: `Failed to fetch video file from URL. HTTP ${videoResponse.status}`,
    };
  }

  const contentType =
    videoResponse.headers.get('content-type') || 'application/octet-stream';

  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  const metadata = {
    snippet: {
      title: input.youtubeTitle || 'Automated Upload',
      description: input.youtubeDescription || input.message,
      categoryId: '22',
    },
    status: {
      privacyStatus: 'public',
    },
  };

  const boundary = `----social-upload-${Date.now()}`;
  const metadataPart =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n`;

  const mediaHeader =
    `--${boundary}\r\n` +
    `Content-Type: ${contentType}\r\n\r\n`;

  const endBoundary = `\r\n--${boundary}--`;

  const multipartBody = Buffer.concat([
    Buffer.from(metadataPart),
    Buffer.from(mediaHeader),
    videoBuffer,
    Buffer.from(endBoundary),
  ]);

  const response = await fetch(YOUTUBE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': multipartBody.length.toString(),
    },
    body: multipartBody,
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      target: 'youtube',
      success: false,
      error: data?.error?.message ?? 'Failed to upload video to YouTube.',
    };
  }

  return {
    target: 'youtube',
    success: true,
    id: data?.id,
  };
}

export async function publishToTargets(
  input: PublishRequest,
): Promise<PublishResult[]> {
  const tasks: Promise<PublishResult>[] = [];

  if (input.targets.includes('facebook')) {
    tasks.push(postToFacebook(input));
  }

  if (input.targets.includes('youtube')) {
    tasks.push(postToYouTube(input));
  }

  return Promise.all(tasks);
}
