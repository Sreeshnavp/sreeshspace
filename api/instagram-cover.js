export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  // Cache response at edge for 24 hours
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { shortcode, url } = req.query;
  const targetCode = shortcode || (url && (url.match(/(?:reel|reels|p|tv|share\/reel)\/([A-Za-z0-9_-]+)/i)?.[1]));
  if (!targetCode) {
    return res.status(400).json({ error: 'Missing shortcode or url' });
  }

  const canonicalUrl = `https://www.instagram.com/reel/${targetCode}/`;

  try {
    // 1. Try Instagram oEmbed v1 API
    const oembedRes = await fetch(`https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(canonicalUrl)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (oembedRes.ok) {
      const data = await oembedRes.json();
      if (data && data.thumbnail_url) {
        return res.status(200).json({
          thumbnailUrl: data.thumbnail_url,
          title: data.title,
          author: data.author_name ? `@${data.author_name}` : undefined,
          width: data.thumbnail_width,
          height: data.thumbnail_height
        });
      }
    }

    // 2. Fallback: Crawler fetch for og:image
    const crawlerRes = await fetch(canonicalUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    if (crawlerRes.ok) {
      const html = await crawlerRes.text();
      const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/i)
        || html.match(/content="([^"]+)"\s+property="og:image"/i)
        || html.match(/property='og:image'\s+content='([^']+)'/i);
      if (ogMatch && ogMatch[1]) {
        return res.status(200).json({
          thumbnailUrl: ogMatch[1].replace(/&amp;/g, '&'),
          title: (html.match(/<title>([^<]+)<\/title>/i) || [])[1]
        });
      }
    }

    return res.status(404).json({ error: 'Thumbnail not found' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
