const duration = require('@dnode/duration');
const RSS = require('rss');

module.exports = ({ redis }) => [
  'get',
  [
    '/flashbriefings',
    async (req, res) => {
      const flashbriefings = await redis.getJSON('FLASHBRIEFINGS') || [];

      const host = req.get('host');
      let url = '';
      if (req.originalUrl !== '/') {
        url = req.originalUrl;
      }

      const feed = new RSS({
        title: 'Alexa Flashbriefings von maxdome',
        description: '',
        feed_url: 'http://' + host + url,
        image_url: 'http://' + host + '/img/maxdome-logo.jpg',
        site_url: 'http://' + host,
        ttl: duration('1 hour').asMinutes(),
      });

      for (const flashbriefing of flashbriefings) {
        const item = {
          date: new Date(flashbriefing.updateDate),
          title: flashbriefing.titleText,
          description: flashbriefing.mainText,
          url: flashbriefing.redirectionUrl,
        };
        const asset = flashbriefing.asset;
        if (asset) {
          item.categories = asset.genres;
          item.enclosure = {
            url: asset.image.url,
            type: 'image/jpeg',
          };
        }
        if (flashbriefing.image) {
          item.enclosure = flashbriefing.image;
        }
        feed.item(item);
      }

      res.set('Content-Type', 'application/rss+xml');
      res.send(feed.xml({ indent: true }));
    },
  ],
];
