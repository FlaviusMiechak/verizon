'use client';

import { useMemo, useState } from 'react';

type ApiResult = {
  target: 'youtube' | 'facebook';
  success: boolean;
  id?: string;
  error?: string;
};

export default function AutomationPage() {
  const [message, setMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeDescription, setYoutubeDescription] = useState('');
  const [facebookPageId, setFacebookPageId] = useState('');
  const [publishToYoutube, setPublishToYoutube] = useState(true);
  const [publishToFacebook, setPublishToFacebook] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ApiResult[]>([]);
  const [error, setError] = useState('');

  const selectedTargets = useMemo(() => {
    const targets: Array<'youtube' | 'facebook'> = [];

    if (publishToYoutube) targets.push('youtube');
    if (publishToFacebook) targets.push('facebook');

    return targets;
  }, [publishToYoutube, publishToFacebook]);

  async function handlePublish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setResults([]);

    if (selectedTargets.length === 0) {
      setError('Pick at least one platform to publish to.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/social/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          videoUrl: videoUrl || undefined,
          youtubeTitle: youtubeTitle || undefined,
          youtubeDescription: youtubeDescription || undefined,
          facebookPageId,
          targets: selectedTargets,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data?.results) {
        throw new Error(data?.error || 'Failed to publish content.');
      }

      setResults(data?.results || []);
    } catch (err: any) {
      setError(err?.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className='min-h-screen bg-gray-50 px-6 py-10'>
      <section className='mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-semibold text-gray-900'>
          Social Auto Publisher
        </h1>
        <p className='mt-2 text-sm text-gray-600'>
          Publish one content payload to YouTube and Facebook from a single form.
        </p>

        <form onSubmit={handlePublish} className='mt-6 space-y-4'>
          <label className='block'>
            <span className='mb-1 block text-sm font-medium text-gray-800'>
              Content message
            </span>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className='h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2'
              placeholder='Type the text you want to publish...'
            />
          </label>

          <label className='block'>
            <span className='mb-1 block text-sm font-medium text-gray-800'>
              Public video URL (required for YouTube)
            </span>
            <input
              type='url'
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2'
              placeholder='https://example.com/video.mp4'
            />
          </label>

          <div className='grid gap-4 md:grid-cols-2'>
            <label className='block'>
              <span className='mb-1 block text-sm font-medium text-gray-800'>
                YouTube title
              </span>
              <input
                value={youtubeTitle}
                onChange={(e) => setYoutubeTitle(e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2'
                placeholder='Video title'
              />
            </label>

            <label className='block'>
              <span className='mb-1 block text-sm font-medium text-gray-800'>
                Facebook page ID
              </span>
              <input
                required
                value={facebookPageId}
                onChange={(e) => setFacebookPageId(e.target.value)}
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2'
                placeholder='123456789012345'
              />
            </label>
          </div>

          <label className='block'>
            <span className='mb-1 block text-sm font-medium text-gray-800'>
              YouTube description (optional)
            </span>
            <textarea
              value={youtubeDescription}
              onChange={(e) => setYoutubeDescription(e.target.value)}
              className='h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2'
            />
          </label>

          <div className='flex items-center gap-6'>
            <label className='inline-flex items-center gap-2 text-sm text-gray-700'>
              <input
                type='checkbox'
                checked={publishToYoutube}
                onChange={(e) => setPublishToYoutube(e.target.checked)}
              />
              YouTube
            </label>

            <label className='inline-flex items-center gap-2 text-sm text-gray-700'>
              <input
                type='checkbox'
                checked={publishToFacebook}
                onChange={(e) => setPublishToFacebook(e.target.checked)}
              />
              Facebook
            </label>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50'
          >
            {loading ? 'Publishing...' : 'Publish now'}
          </button>
        </form>

        {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}

        {results.length > 0 && (
          <ul className='mt-4 space-y-2 text-sm'>
            {results.map((result) => (
              <li
                key={`${result.target}-${result.id || result.error}`}
                className='rounded-md border border-gray-200 px-3 py-2'
              >
                <span className='font-semibold capitalize'>{result.target}</span>:&nbsp;
                {result.success
                  ? `Success${result.id ? ` (id: ${result.id})` : ''}`
                  : `Failed - ${result.error}`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
