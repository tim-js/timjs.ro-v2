import { parseString } from 'xml2js';
import { promisify } from 'util';

const TIMJS_CHANNEL_ID = 'UCdbyO-PwK-5UVOSQuoWZ9vQ';

const parseXml = promisify(parseString);

export async function getYouTubeVideos() {
  // We use the RSS feed because it works without any auth
  const response = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${TIMJS_CHANNEL_ID}`
  );
  const text = await response.text();
  
  const result = await parseXml(text);
  
  const entries = result.feed.entry;
  const videos = entries.map(entry => ({
    id: entry['yt:videoId'][0],
    title: entry.title[0],
    link: entry.link[0].$.href,
    thumbnail: `https://i.ytimg.com/vi/${entry['yt:videoId'][0]}/hqdefault.jpg`,
    publishedAt: entry.published[0]
  }));

  return videos;
}