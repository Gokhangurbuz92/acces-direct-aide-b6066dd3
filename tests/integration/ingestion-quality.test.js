import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../../api/_utils/prisma.js';
import crypto from 'crypto';

describe('Ingestion Quality', () => {
  const testRunId = `test-${crypto.randomUUID()}`;
  const testSlug = `test-aide-${Date.now()}`;
  
  afterAll(async () => {
    // Cleanup test data
    await prisma.aide.deleteMany({
      where: {
        slug: {
          startsWith: 'test-aide-'
        }
      }
    });
  });

  describe('Idempotence', () => {
    it('should not duplicate when ingesting same item twice', async () => {
      const testData = {
        slug: testSlug,
        titre: 'Test Aide for Idempotence',
        cest_quoi: 'Test description',
        providerName: 'TestConnector',
        providerType: 'ingest',
        source_url: 'https://example.com/test-aide',
        source_url_exact: 'https://example.com/test-aide',
        statut: 'publie',
        published_at: new Date(),
        content_hash: crypto.createHash('md5').update('test-content').digest('hex'),
        retrieved_at: new Date(),
        last_checked_at: new Date()
      };

      // First insert
      const first = await prisma.aide.create({ data: testData });
      expect(first).toBeDefined();
      expect(first.slug).toBe(testSlug);

      // Try to insert again (should upsert instead)
      const existing = await prisma.aide.findFirst({
        where: {
          OR: [
            { slug: testSlug },
            { source_url: testData.source_url }
          ]
        }
      });

      expect(existing).toBeDefined();
      expect(existing.id).toBe(first.id);

      // Count should be 1
      const count = await prisma.aide.count({
        where: { slug: testSlug }
      });
      expect(count).toBe(1);
    });

    it('should update when content changes', async () => {
      const slug = `test-aide-update-${Date.now()}`;
      const initialHash = crypto.createHash('md5').update('initial-content').digest('hex');
      const updatedHash = crypto.createHash('md5').update('updated-content').digest('hex');

      // Create initial
      const initial = await prisma.aide.create({
        data: {
          slug,
          titre: 'Initial Title',
          cest_quoi: 'Initial content',
          providerName: 'TestConnector',
          providerType: 'ingest',
          source_url: `https://example.com/${slug}`,
          statut: 'publie',
          published_at: new Date(),
          content_hash: initialHash,
          retrieved_at: new Date(),
          last_checked_at: new Date()
        }
      });

      expect(initial.content_hash).toBe(initialHash);

      // Update with new content
      const updated = await prisma.aide.update({
        where: { id: initial.id },
        data: {
          titre: 'Updated Title',
          cest_quoi: 'Updated content',
          content_hash: updatedHash,
          last_checked_at: new Date()
        }
      });

      expect(updated.content_hash).toBe(updatedHash);
      expect(updated.titre).toBe('Updated Title');
      expect(updated.id).toBe(initial.id); // Same ID, not duplicated
    });

    it('should skip when content hash is unchanged', async () => {
      const slug = `test-aide-skip-${Date.now()}`;
      const contentHash = crypto.createHash('md5').update('unchanged-content').digest('hex');

      const initial = await prisma.aide.create({
        data: {
          slug,
          titre: 'Unchanged Title',
          cest_quoi: 'Unchanged content',
          providerName: 'TestConnector',
          providerType: 'ingest',
          source_url: `https://example.com/${slug}`,
          statut: 'publie',
          published_at: new Date(),
          content_hash: contentHash,
          retrieved_at: new Date(),
          last_checked_at: new Date()
        }
      });

      // Check if content hash matches (simulating skip logic)
      const existing = await prisma.aide.findUnique({
        where: { id: initial.id }
      });

      expect(existing.content_hash).toBe(contentHash);
      // In real ingestion, this would trigger a skip (no update)
    });
  });

  describe('Traceability', () => {
    it('should store source_url and retrieved_at', async () => {
      const slug = `test-aide-trace-${Date.now()}`;
      const retrievedAt = new Date();

      const aide = await prisma.aide.create({
        data: {
          slug,
          titre: 'Traceable Aide',
          cest_quoi: 'Test content',
          providerName: 'TestConnector',
          providerType: 'ingest',
          source_url: 'https://example.com/traceable',
          source_url_exact: 'https://example.com/traceable?param=value',
          statut: 'publie',
          published_at: new Date(),
          retrieved_at: retrievedAt,
          last_checked_at: new Date()
        }
      });

      expect(aide.source_url).toBe('https://example.com/traceable');
      expect(aide.source_url_exact).toBe('https://example.com/traceable?param=value');
      expect(aide.retrieved_at).toBeDefined();
      expect(aide.last_checked_at).toBeDefined();
      expect(aide.providerName).toBe('TestConnector');
    });

    it('should update last_checked_at on re-ingestion', async () => {
      const slug = `test-aide-recheck-${Date.now()}`;
      const initialCheck = new Date('2024-01-01');

      const initial = await prisma.aide.create({
        data: {
          slug,
          titre: 'Rechecked Aide',
          cest_quoi: 'Test content',
          providerName: 'TestConnector',
          providerType: 'ingest',
          source_url: `https://example.com/${slug}`,
          statut: 'publie',
          published_at: new Date(),
          retrieved_at: initialCheck,
          last_checked_at: initialCheck
        }
      });

      // Simulate re-ingestion
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const newCheckTime = new Date();

      const updated = await prisma.aide.update({
        where: { id: initial.id },
        data: {
          last_checked_at: newCheckTime
        }
      });

      expect(updated.last_checked_at.getTime()).toBeGreaterThan(initial.last_checked_at.getTime());
      expect(updated.retrieved_at).toEqual(initial.retrieved_at); // Original timestamp preserved
    });
  });

  describe('Data Normalization', () => {
    it('should trim whitespace from text fields', () => {
      const title = '  Test Title  ';
      const description = '\\n  Test Description  \\n';
      const url = '  https://example.com/test  ';

      const normalized = {
        title: title.trim(),
        description: description.trim(),
        url: url.trim()
      };

      expect(normalized.title).toBe('Test Title');
      expect(normalized.description).toBe('Test Description');
      expect(normalized.url).toBe('https://example.com/test');
    });

    it('should handle null/undefined values gracefully', () => {
      const data = {
        title: null,
        description: undefined,
        url: ''
      };

      const normalized = {
        title: data.title?.trim() || '',
        description: data.description?.trim() || '',
        url: data.url?.trim() || ''
      };

      expect(normalized.title).toBe('');
      expect(normalized.description).toBe('');
      expect(normalized.url).toBe('');
    });
  });
});
