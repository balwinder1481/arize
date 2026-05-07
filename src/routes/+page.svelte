<script lang="ts">
  import Header            from '$lib/components/landing/Header.svelte';
  import HeroSection       from '$lib/components/landing/HeroSection.svelte';
  import FeaturesSection   from '$lib/components/landing/FeaturesSection.svelte';
  import HowItWorksSection from '$lib/components/landing/HowItWorksSection.svelte';
  import BenefitsSection   from '$lib/components/landing/BenefitsSection.svelte';
  import AboutSection      from '$lib/components/landing/AboutSection.svelte';
  import RoadmapSection    from '$lib/components/landing/RoadmapSection.svelte';
  import FAQSection        from '$lib/components/landing/FAQSection.svelte';
  import BottomNavigation  from '$lib/components/landing/BottomNavigation.svelte';
  import { env } from '$lib/constants/env';

  const hubAddr   = env.contracts.arizeBizHub;
  const bscScanUrl = `https://bscscan.com/address/${hubAddr}`;
</script>

<svelte:head>
  <title>ArizeBiz — Smart Contract ROI Platform</title>
  <meta name="description" content="Earn daily ROI, referral income and salary rewards on BSC blockchain." />
</svelte:head>

<div class="min-h-screen" style="background-color: var(--color-surface);">
  <Header />

  <main>
    <div id="hero"><HeroSection /></div>
    <FeaturesSection />
    <HowItWorksSection />
    <BenefitsSection />
    <AboutSection />
    <RoadmapSection />
    <FAQSection />
  </main>

  <!-- Footer -->
  <footer class="border-t border-border px-4 py-10 text-center">
    <div class="mx-auto max-w-4xl">
      <div class="mb-4 flex items-center justify-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black"
             style="background:linear-gradient(135deg,#f59e0b,#d97706)">AB</div>
        <span class="font-bold text-text-primary">Arize<span class="gold-text">Biz</span></span>
      </div>
      <p class="text-sm text-text-muted">
        © 2026 ArizeBiz · All rights reserved ·
        <a href={bscScanUrl}
           target="_blank" rel="noopener"
           class="text-gold hover:underline">Contract on BSCScan</a>
      </p>
    </div>
  </footer>

  <BottomNavigation />
</div>
