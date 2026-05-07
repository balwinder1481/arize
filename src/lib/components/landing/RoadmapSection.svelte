<script lang="ts">
  const milestones = [
    { q: 'Q4 2025', icon: '🚀', title: 'Core Investment Contract',  desc: 'Deployment of ArizeBizV2 on BSC — secure, on-chain investment with automated ROI.', current: true  },
    { q: 'Q1 2026', icon: '🌱', title: 'Community Growth',           desc: 'Strategic partnerships and community expansion to build a robust ecosystem.',           current: false },
    { q: 'Q2 2026', icon: '📱', title: 'Mobile App Beta',            desc: 'ArizeBiz mobile application for on-the-go portfolio and earnings management.',          current: false },
    { q: 'Q3 2026', icon: '💎', title: 'AXM Token Distribution',     desc: 'Official distribution of AXM tokens to early adopters and investors.',                  current: false },
    { q: 'Q4 2026', icon: '🌍', title: 'Global Marketing',           desc: 'Large-scale marketing campaign to increase brand awareness and adoption.',              current: false },
    { q: 'Q1 2027', icon: '📈', title: 'Exchange Listing',           desc: 'Listing of AXM token on major CEX for liquidity and trading.',                          current: false },
    { q: 'Q2 2027', icon: '🔄', title: 'DEX Launch',                 desc: 'ArizeBiz Decentralized Exchange for secure token swapping.',                            current: false },
    { q: 'Q3 2027', icon: '🎨', title: 'NFT Marketplace',            desc: 'Integration of an NFT marketplace for trading unique digital assets.',                  current: false },
    { q: 'Q1 2028', icon: '🌉', title: 'Cross-Chain Bridge',         desc: 'Bridges to other major blockchains for full interoperability.',                         current: false },
    { q: 'Q2 2028', icon: '🗳️', title: 'DAO Governance',             desc: 'Transition to fully Decentralized Autonomous Organization for community governance.',    current: false },
    { q: 'Q4 2028', icon: '🌐', title: 'Public Blockchain',          desc: 'Development of the ArizeBiz Public Blockchain for scalable dApp development.',          current: false },
    { q: 'Q2 2029', icon: '🛡️', title: 'Stress Testing & Audit',     desc: 'Comprehensive security audits and stress testing before mainnet finalization.',         current: false },
  ];
</script>

<section id="roadmap" class="relative overflow-hidden px-4 py-20">
  <!-- BG glows -->
  <div class="pointer-events-none absolute inset-0">
    <div class="absolute left-0 top-1/4 h-96 w-96 rounded-full opacity-10"
         style="background:radial-gradient(circle,#f59e0b,transparent);filter:blur(80px)"></div>
    <div class="absolute bottom-1/4 right-0 h-96 w-96 rounded-full opacity-10"
         style="background:radial-gradient(circle,#d97706,transparent);filter:blur(80px)"></div>
  </div>

  <div class="relative mx-auto max-w-5xl">
    <div class="mb-14 text-center">
      <h2 class="section-title mb-4">
        Strategic <span class="gold-gradient">Roadmap</span>
      </h2>
      <p class="mx-auto max-w-2xl text-text-secondary">
        Our step-by-step journey towards building a complete decentralized financial ecosystem.
      </p>
    </div>

    <!-- Timeline -->
    <div class="relative">
      <!-- Center line (desktop) -->
      <div class="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block"
           style="background:linear-gradient(to bottom,#f59e0b,#d97706,#f59e0b);opacity:0.25"></div>
      <!-- Left line (mobile) -->
      <div class="absolute left-5 top-0 h-full w-px md:hidden"
           style="background:linear-gradient(to bottom,#f59e0b,#d97706);opacity:0.25"></div>

      <div class="space-y-10 md:space-y-0">
        {#each milestones as m, i}
          <div class="relative flex items-start gap-6 pb-10 md:flex-row md:pb-12
                      {i % 2 === 0 ? 'md:flex-row-reverse' : ''}">

            <!-- Mobile dot -->
            <div class="relative z-10 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center
                        rounded-full border-2 md:hidden
                        {m.current ? 'border-gold' : 'border-border-strong'}"
                 style="background:var(--color-surface)">
              <div class="h-2 w-2 rounded-full {m.current ? 'bg-gold animate-pulse' : 'bg-text-muted'}"></div>
            </div>

            <!-- Card -->
            <div class="w-full md:w-5/12">
              <div class="card p-5 transition-all duration-300 hover:border-border-strong hover:shadow-lg
                          {m.current ? 'border-gold' : ''}"
                   style="{m.current ? 'box-shadow:0 0 20px var(--color-gold-glow)' : ''}">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">{m.icon}</span>
                    <h3 class="font-bold text-text-primary">{m.title}</h3>
                  </div>
                  <span class="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold
                               {m.current ? 'text-gold' : 'text-text-muted'}"
                        style="{m.current ? 'background:var(--color-gold-dim)' : 'background:var(--color-surface-3)'}">
                    {m.q}
                  </span>
                </div>
                <p class="text-sm leading-relaxed text-text-secondary">{m.desc}</p>
              </div>
            </div>

            <!-- Desktop center dot -->
            <div class="absolute left-1/2 top-5 z-10 hidden h-8 w-8 -translate-x-1/2
                        items-center justify-center rounded-full border-2 md:flex
                        {m.current ? 'border-gold' : 'border-border-strong'}"
                 style="background:var(--color-surface)">
              <div class="h-3 w-3 rounded-full {m.current ? 'bg-gold animate-pulse' : 'bg-text-muted'}"></div>
            </div>

            <!-- Empty side (desktop layout balance) -->
            <div class="hidden w-5/12 md:block"></div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
