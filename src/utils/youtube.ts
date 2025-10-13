const TIMJS_CHANNEL_ID = 'UCdbyO-PwK-5UVOSQuoWZ9vQ';
const API_KEY = import.meta.env.YOUTUBE_API_KEY;

interface Video {
  id: string;
  title: string;
  link: string;
  thumbnail: string;
  publishedAt: string;
}

interface YouTubePlaylistItem {
  snippet: {
    resourceId: {
      videoId: string;
    };
    title: string;
    publishedAt: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
  };
}

interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  nextPageToken?: string;
}

// In-memory cache
let cachedVideos: Video[] | null = null;

export async function getYouTubeVideos(): Promise<Video[]> {
  // Return cached videos if available
  if (cachedVideos) {
    console.log('Returning cached YouTube videos');
    return cachedVideos;
  }

  console.log('Fetching YouTube videos from API...');

  if (!API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not set in environment variables');
  }

  // Convert channel ID (UC...) to uploads playlist ID (UU...)
  const uploadsPlaylistId = TIMJS_CHANNEL_ID.replace('UC', 'UU');

  const allVideos: Video[] = [];
  let nextPageToken: string | undefined = undefined;

  // Fetch all videos using pagination
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('playlistId', uploadsPlaylistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', API_KEY);

    if (nextPageToken) {
      url.searchParams.set('pageToken', nextPageToken);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data: YouTubePlaylistResponse = await response.json();

    const videos = data.items.map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      thumbnail: item.snippet.thumbnails.high.url,
      publishedAt: item.snippet.publishedAt
    }));

    allVideos.push(...videos);
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  console.log(`Fetched ${allVideos.length} videos from YouTube API`);

  // Cache the results
  cachedVideos = allVideos;

  return allVideos;
}
