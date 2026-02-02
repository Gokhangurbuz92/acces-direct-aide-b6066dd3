/**
 * RSS CONNECTOR
 *
 * Generic RSS/Atom feed connector
 */

import { BaseConnector } from './BaseConnector.js';
import Parser from 'rss-parser';

const parser = new Parser();

export class RssConnector extends BaseConnector {
  /**
   * @param {Object} config
   * @param {string} config.feed_url - RSS feed URL
   */
  constructor(config) {
    super(config);
    this.feed_url = config.feed_url;
  }

  async discover({ limit }) {
    try {
      const feed = await parser.parseURL(this.feed_url);
      let items = feed.items || [];

      if (limit) {
        items = items.slice(0, limit);
      }

      return items;
    } catch (error) {
      console.error(`[${this.name}] RSS fetch error:`, error);
      return [];
    }
  }

  async parse(rawItem) {
    // Extract publication date
    let source_published_at = null;
    if (rawItem.isoDate) {
      source_published_at = new Date(rawItem.isoDate);
    } else if (rawItem.pubDate) {
      source_published_at = new Date(rawItem.pubDate);
    }

    // Extract content
    const content = rawItem.content || rawItem.contentSnippet || rawItem.summary || '';
    const excerpt = rawItem.contentSnippet || content.substring(0, 300);

    return {
      title: rawItem.title || 'Sans titre',
      excerpt,
      content,
      source_url: rawItem.link || rawItem.guid,
      source_published_at,
      tags: rawItem.categories || [],
      guid: rawItem.guid
    };
  }
}
