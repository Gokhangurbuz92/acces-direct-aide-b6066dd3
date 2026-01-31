import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Organizations API Integration Tests', () => {
  let testOrganization;
  let testEstablishment;

  beforeAll(async () => {
    // Create test organization
    testOrganization = await prisma.organization.upsert({
      where: { slug: 'test-org' },
      update: {},
      create: {
        slug: 'test-org',
        nom: 'Test Organization',
        description: 'A test organization for integration tests',
        type_organization: 'service_public',
        territoire_couverture: 'departmental',
        categories: ['test', 'integration'],
        tags: ['test'],
        statut: 'publie',
        published_at: new Date(),
      },
    });

    // Create test establishment
    testEstablishment = await prisma.establishment.create({
      data: {
        organizationId: testOrganization.id,
        nom: 'Test Establishment',
        adresse: '123 Test Street',
        ville: 'Strasbourg',
        code_postal: '67000',
        departement: '67',
        telephone: '0388000000',
        email: 'test@example.com',
        services: ['Test Service'],
        statut: 'actif',
        published_at: new Date(),
      },
    });
  });

  describe('GET /api/organizations', () => {
    it('should list organizations', async () => {
      const response = await fetch('http://localhost:5173/api/organizations?page=1&pageSize=10');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('should filter organizations by type', async () => {
      const response = await fetch('http://localhost:5173/api/organizations?type=service_public');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.items.every(org => org.type_organization === 'service_public')).toBe(true);
    });

    it('should search organizations by name', async () => {
      const response = await fetch('http://localhost:5173/api/organizations?q=Test');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.items.some(org => org.nom.includes('Test'))).toBe(true);
    });
  });

  describe('GET /api/organizations/:slug', () => {
    it('should get organization by slug', async () => {
      const response = await fetch('http://localhost:5173/api/organizations?slug=test-org');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.slug).toBe('test-org');
      expect(data.nom).toBe('Test Organization');
      expect(data).toHaveProperty('establishmentCount');
    });

    it('should return 404 for non-existent organization', async () => {
      const response = await fetch('http://localhost:5173/api/organizations?slug=non-existent');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/organizations/:slug/establishments', () => {
    it('should list establishments for an organization', async () => {
      const response = await fetch(`http://localhost:5173/api/organizations?organizationSlug=test-org&page=1&pageSize=20`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.items)).toBe(true);
    });

    it('should filter establishments by department', async () => {
      const response = await fetch(`http://localhost:5173/api/organizations?organizationSlug=test-org&department=67`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.items.every(est => est.departement === '67')).toBe(true);
    });

    it('should filter establishments by city', async () => {
      const response = await fetch(`http://localhost:5173/api/organizations?organizationSlug=test-org&city=Strasbourg`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.items.every(est => est.ville.includes('Strasbourg'))).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('should paginate organizations correctly', async () => {
      const response = await fetch('http://localhost:5173/api/organizations?page=1&pageSize=5');
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.pageSize).toBe(5);
      expect(data.items.length).toBeLessThanOrEqual(5);
    });
  });
});
