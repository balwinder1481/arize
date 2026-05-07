<script lang="ts">
  import { isConnected, connectWallet } from '$lib/web3/store';
  import { goto } from '$app/navigation';

  const stats = [
    { label: 'Daily ROI',       value: '0.5%',   sub: 'up to 1.5% with booster' },
    { label: 'Level Income',    value: '10',      sub: 'levels deep' },
    { label: 'Working Cap',     value: '3×',      sub: 'of investment' },
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
  <!-- Background glow -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden">
    <div class="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-10"
         style="background: radial-gradient(circle, #f59e0b 0%, transparent 70%)"></div>
  </div>

  <div class="relative mx-auto max-w-4xl">
    <!-- Badge -->
    <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-border-strong
                bg-gold-dim px-4 py-1.5 text-sm font-medium text-gold">
      <span class="h-2 w-2 rounded-full bg-gold animate-pulse"></span>
      Live on BSC Blockchain
    </div>

    <!-- Heading -->
    <h1 class="section-title mb-6">
      Earn Daily with<br/>
      <span class="gold-gradient">Smart Contract ROI</span>
    </h1>

    <p class="mx-auto mb-10 max-w-2xl text-lg text-text-secondary">
      ArizeBiz is a transparent, on-chain investment platform with automated ROI,
      10-level referral income, and salary rewards — all governed by smart contracts.
    </p>

    <!-- CTAs -->
    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
      <button on:click={handleCTA} class="btn-primary px-8 py-3 text-base">
        {$isConnected ? 'Go to Dashboard' : 'Connect & Start'}
      </button>
      <a href="#how-it-works" class="btn-outline px-8 py-3 text-base">
        How It Works
      </a>
    </div>

    <!-- Stats row -->
    <div class="mt-16 grid grid-cols-3 gap-4 md:gap-8">
      {#each stats as s}
        <div class="card p-5 text-center">
          <div class="text-2xl font-bold gold-text md:text-3xl">{s.value}</div>
          <div class="mt-1 text-sm font-semibold text-text-primary">{s.label}</div>
          <div class="text-xs text-text-muted mt-1">{s.sub}</div>
        </div>
      {/each}
    </div>
  </div>
</section>
