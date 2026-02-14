
import SEO from '@/components/SEO';
import HeroSection from '@/components/home/HeroSection';
import QuickAccessSection from '@/components/home/QuickAccessSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import AssistantFeatureSection from '@/components/home/AssistantFeatureSection';
import NewsSection from '@/components/home/NewsSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Accueil"
        description="Vos droits et démarches sociales, simplement."
        path="/"
      />

      <HeroSection />
      <QuickAccessSection />
      <CategoriesSection />
      <AssistantFeatureSection />
      <NewsSection />
    </div>
  );
}
