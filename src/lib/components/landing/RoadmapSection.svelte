<script lang="ts">
  const milestones = [
    {
      q: 'Q4 2025', icon: '⚡', title: 'Neural AI Core & Smart Contract Launch',
      desc: 'Deployment of ArizeBizV2 on BSC with the foundational Neural AI trading engine. Automated ROI distribution begins — zero human involvement, pure algorithm.',
      current: true, tag: 'LIVE'
    },
    {
      q: 'Q1 2026', icon: '🧠', title: 'AI Model v2 — Multi-Strategy Engine',
      desc: 'Upgrade to a multi-strategy Neural AI model combining trend-following, mean-reversion, and momentum signals. Higher accuracy, lower drawdown, consistent daily yield.',
      current: false, tag: 'IN PROGRESS'
    },
    {
      q: 'Q2 2026', icon: '📶', title: 'Real-Time On-Chain Signal Feed',
      desc: 'Live AI signal transparency — users can view trading signals and execution logs on-chain. Full auditability of every AI-generated trade decision.',
      current: false, tag: 'UPCOMING'
    },
    {
      q: 'Q3 2026', icon: '🤖', title: 'Autonomous Yield Optimizer',
      desc: 'AI-powered auto-compounding module that dynamically re-invests profits at optimal intervals, maximising compound growth for every participant.',
      current: false, tag: 'UPCOMING'
    },
    {
      q: 'Q4 2026', icon: '📈', title: 'ArizeBiz AI Mobile App',
      desc: 'Native app with real-time AI trade feeds, portfolio analytics, push notifications for rank upgrades, and one-tap claim — your AI wealth manager in your pocket.',
      current: false, tag: 'UPCOMING'
    },
    {
      q: 'Q1 2027', icon: '⛓', title: 'Cross-Chain AI Arbitrage',
      desc: 'Expand the Neural AI model to execute cross-chain arbitrage across BSC, Ethereum, and Arbitrum. More capital deployed, higher yield potential for all users.',
      current: false, tag: 'PLANNED'
    },
    {
      q: 'Q2 2027', icon: '🌍', title: 'Global AI Trading Pool',
      desc: 'Open the Neural AI trading pool to institutional partners. Shared liquidity depth fuels deeper markets, tighter spreads, and superior returns for retail members.',
      current: false, tag: 'PLANNED'
    },
    {
      q: 'Q3 2027', icon: '✅', title: 'AI Model Audit & Certification',
      desc: 'Third-party audit of the Neural AI trading model by leading blockchain security firms. Published performance reports and certified risk parameters — full trust.',
      current: false, tag: 'PLANNED'
    },
  ];
</script>

<section id="roadmap" class="relative overflow-hidden px-4 py-20">
  <!-- BG glows -->
  <div class="pointer-events-none absolute inset-0">
    <div class="absolute left-0 top-1/4 h-96 w-96 rounded-full opacity-10"
         style="background:radial-gradient(circle,#f59e0b,transparent);filter:blur(80px)"></div>
    <div class="absolute bottom-1/4 right-0 h-96 w-96 rounded-full opacity-10"
         style="background:radial-gradient(circle,#a78bfa,transparent);filter:blur(80px)"></div>
  </div>

  <div class="relative mx-auto max-w-5xl">
    <div class="mb-14 text-center">
      <h2 class="section-title mb-4">
        Neural AI <span class="gold-gradient">Roadmap</span>
      </h2>
      <p class="mx-auto max-w-2xl text-text-secondary">
        Our AI trading model evolves every quarter — smarter signals, deeper markets, greater returns.
        Every milestone is designed to grow your earning potential.
      </p>
    </div>

    <!-- Horizontal scroll timeline -->
    <div class="relative">
      <!-- Horizontal connector line -->
      <div class="absolute left-0 right-0 hidden md:block"
           style="top:2.75rem;height:2px;background:linear-gradient(90deg,transparent,#f59e0b55,#f59e0b99,#f59e0b55,transparent)"></div>

      <div class="flex gap-5 overflow-x-auto pb-6 md:grid md:grid-cols-4 md:overflow-visible md:pb-0"
           style="scrollbar-width:none;-ms-overflow-style:none">

        {#each milestones as m, i}
          <div class="relative flex-shrink-0 w-72 md:w-auto flex flex-col items-center">

            <!-- Timeline dot -->
            <div class="relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-full
                        transition-all duration-300
                        {m.current ? 'ring-2 ring-offset-2' : 'ring-1'}"
                 style="
                   background:{m.current ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'var(--color-surface-3)'};
                   ring-color:{m.current ? '#f59e0b' : 'rgba(255,255,255,0.1)'};
                   ring-offset-color:var(--color-surface);
                   {m.current ? 'box-shadow:0 0 24px rgba(245,158,11,0.6)' : ''}
                 ">
              <span class="text-lg leading-none" class:animate-pulse={m.current}>{m.icon}</span>
            </div>

            <!-- Card -->
            <div class="w-full rounded-2xl p-4 transition-all duration-300
                        hover:-translate-y-1 hover:shadow-xl"
                 style="
                   background:{m.current ? 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(217,119,6,0.04))' : 'var(--color-surface-2)'};
                   border:1px solid {m.current ? 'rgba(245,158,11,0.4)' : 'var(--color-border)'};
                   {m.current ? 'box-shadow:0 0 30px rgba(245,158,11,0.12)' : ''}
                 ">

              <!-- Quarter + tag row -->
              <div class="mb-3 flex items-center justify-between">
                <span class="text-xs font-bold"
                      style="color:{m.current ? '#f59e0b' : 'var(--color-text-muted)'}">
                  {m.q}
                </span>
                <span class="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider"
                      style="
                        {m.tag === 'LIVE'        ? 'background:rgba(34,197,94,0.12);color:#4ade80'  :
                         m.tag === 'IN PROGRESS' ? 'background:rgba(245,158,11,0.12);color:#fbbf24' :
                         m.tag === 'UPCOMING'    ? 'background:rgba(59,130,246,0.12);color:#60a5fa'  :
                                                   'background:var(--color-surface-3);color:var(--color-text-muted)'}
                      ">
                  {m.tag}
                </span>
              </div>

              <!-- Title -->
              <h3 class="mb-2 text-sm font-bold leading-snug text-text-primary">{m.title}</h3>

              <!-- Desc -->
              <p class="text-xs leading-relaxed text-text-secondary">{m.desc}</p>

              <!-- Bottom accent bar for current -->
              {#if m.current}
                <div class="mt-3 h-0.5 w-full rounded-full"
                     style="background:linear-gradient(90deg,#f59e0b,#d97706,transparent)"></div>
              {/if}
            </div>

            <!-- Step number badge -->
            <div class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center
                        rounded-full text-[10px] font-black md:hidden"
                 style="background:var(--color-surface-3);color:var(--color-text-muted);border:1px solid var(--color-border)">
              {i + 1}
            </div>
          </div>
        {/each}

      </div>

      <!-- Scroll hint on mobile -->
      <p class="mt-4 text-center text-xs text-text-muted md:hidden">← Swipe to explore →</p>
    </div>
  </div>
</section>
