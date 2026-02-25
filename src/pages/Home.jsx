
import SEO from '@/components/SEO';
import HeroSearch from '@/components/organisms/HeroSearch';
import QuickAccessSection from '@/components/home/QuickAccessSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import AssistantFeatureSection from '@/components/home/AssistantFeatureSection';
import NewsSection from '@/components/home/NewsSection';
import { buildSiteSchema } from '@/lib/seo';

export default function Home() {
  const schema = buildSiteSchema();

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Accueil"
        description="Vos droits et démarches sociales, simplement."
        path="/"
        schema={schema}
      />

      <HeroSearch />
      <QuickAccessSection />
      <CategoriesSection />
      <AssistantFeatureSection />
      <NewsSection />
    </div>
  );
}
