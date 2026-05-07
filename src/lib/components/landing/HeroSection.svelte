<script lang="ts">
  import { isConnected, connectWallet } from '$lib/web3/store';
  import { goto } from '$app/navigation';

  const stats = [
    { label: 'Daily ROI',         value: '0.5%',  sub: 'AI-optimised yield' },
    { label: 'Rank Rewards',      value: '10',     sub: 'income tiers' },
    { label: 'Neural AI Trades',  value: '24/7',   sub: 'fully automated' },
  ];

  async function handleCTA() {
    if ($isConnected) {
      goto('/dashboard');
    } else {
      await connectWallet();
    }
  }
</script>

<section class="relative overflow-hidden px-4 py-24 text-center md:py-32">
  <!-- Background glows -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full opacity-10"
         style="background: radial-gradient(circle, #f59e0b 0%, transparent 65%)"></div>
    <div class="absolute -left-20 top-1/3 h-64 w-64 rounded-full opacity-5"
         style="background:radial-gradient(circle,#a78bfa,transparent);filter:blur(60px)"></div>
    <div class="absolute -right-20 top-1/4 h-64 w-64 rounded-full opacity-5"
         style="background:radial-gradient(circle,#3b82f6,transparent);filter:blur(60px)"></div>
  </div>

  <div class="relative mx-auto max-w-4xl">
    <!-- Badge -->
    <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-border-strong
                bg-gold-dim px-4 py-1.5 text-sm font-medium text-gold">
      <span class="h-2 w-2 rounded-full bg-gold animate-pulse"></span>
      Powered by Neural AI · Live on BSC
    </div>

    <!-- Heading -->
    <h1 class="section-title mb-6">
      AI-Driven Wealth.<br/>
      <span class="gold-gradient">Automated. Transparent. Unstoppable.</span>
    </h1>

    <p class="mx-auto mb-10 max-w-2xl text-lg text-text-secondary">
      ArizeBiz fuses <span class="text-gold font-semibold">Neural AI trading models</span> with
      immutable smart contracts — delivering daily ROI, 10-level referral income, and
      rank rewards, all on-chain with zero human intervention.
    </p>

    <!-- CTAs -->
    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <button on:click={handleCTA}
              class="btn-primary px-8 py-3.5 text-base font-bold shadow-lg"
              style="box-shadow:0 0 30px rgba(245,158,11,0.35)">
        {$isConnected ? '🚀 Go to Dashboard' : '⚡ Start Earning Now'}
      </button>
      <a href="#roadmap" class="btn-outline px-8 py-3.5 text-base font-semibold">
        View AI Roadmap
      </a>
    </div>

    <!-- Stats row -->
    <div class="mt-16 grid grid-cols-3 gap-4 md:gap-8">
      {#each stats as s}
        <div class="card p-5 text-center transition-all duration-300 hover:border-border-strong"
             style="background:var(--color-surface-2)">
          <div class="text-2xl font-bold gold-text md:text-3xl">{s.value}</div>
          <div class="mt-1 text-sm font-semibold text-text-primary">{s.label}</div>
          <div class="text-xs text-text-muted mt-1">{s.sub}</div>
        </div>
      {/each}
    </div>

    <!-- Floating AI chip -->
    <div class="mt-10 inline-flex items-center gap-3 rounded-2xl border border-border px-5 py-3"
         style="background:var(--color-surface-2)">
      <div class="flex h-8 w-8 items-center justify-center rounded-full"
           style="background:linear-gradient(135deg,#a78bfa,#3b82f6)">
        <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2"/>
        </svg>
      </div>
      <span class="text-sm text-text-secondary">
        Neural AI model processes <span class="font-bold text-text-primary">market signals 24/7</span> — you just earn
      </span>
    </div>
  </div>
</section>
