<script lang="ts">
  import { goto } from '$app/navigation';

  const benefits = [
    { icon: '✨', title: 'Passive Income',         desc: 'Earn daily returns automatically without any manual intervention.' },
    { icon: '🛡️', title: 'Blockchain Security',    desc: 'Funds are protected by immutable smart contracts on BSC.' },
    { icon: '🚀', title: 'Fast Growth',             desc: 'Build your network with our 10-level deep referral system.' },
    { icon: '💰', title: 'Multiple Streams',        desc: 'Earn from daily ROI, referral bonuses, and level income simultaneously.' },
    { icon: '👥', title: 'Community Driven',        desc: 'Join a thriving community of investors helping each other succeed.' },
    { icon: '📊', title: 'Transparent Tracking',    desc: 'Monitor all earnings and transactions in real-time on-chain.' },
  ];

  const highlights = [
    { val: '24/7',    label: 'Support Available' },
    { val: '100%',    label: 'Transparent' },
    { val: 'Instant', label: 'Withdrawals' },
  ];
</script>

<section id="benefits" class="relative overflow-hidden px-4 py-20">
  <!-- Glow blobs -->
  <div class="pointer-events-none absolute inset-0">
    <div class="absolute left-1/4 top-1/4 h-96 w-96 rounded-full opacity-10"
         style="background:radial-gradient(circle,#f59e0b,transparent);filter:blur(80px)"></div>
    <div class="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full opacity-10"
         style="background:radial-gradient(circle,#d97706,transparent);filter:blur(80px)"></div>
  </div>

  <div class="relative mx-auto max-w-6xl">
    <!-- Header -->
    <div class="mb-12 text-center">
      <div class="mb-4 inline-flex rounded-full border border-border-strong px-4 py-1.5 text-sm font-medium text-gold"
           style="background:var(--color-gold-dim)">
        Why Join Us
      </div>
      <h2 class="section-title mb-4">
        <span class="gold-gradient">Unlock Your Financial Freedom</span>
      </h2>
      <p class="mx-auto max-w-2xl text-text-secondary">
        Experience the future of decentralized earning with transparent smart contracts.
      </p>
    </div>

    <!-- Grid -->
    <div class="mb-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each benefits as b}
        <div class="card card-hover cursor-pointer p-6">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
               style="background:var(--color-gold-dim)">
            {b.icon}
          </div>
          <h3 class="mb-2 font-bold text-text-primary">{b.title}</h3>
          <p class="text-sm leading-relaxed text-text-secondary">{b.desc}</p>
        </div>
      {/each}
    </div>

    <!-- CTA Banner -->
    <div class="relative rounded-3xl p-8 md:p-12" style="background:var(--color-surface-3);border:1px solid var(--color-border-strong);">
      <div class="text-center">
        <h3 class="mb-3 text-2xl font-bold text-text-primary md:text-3xl">
          Ready to Start Your Journey?
        </h3>
        <p class="mx-auto mb-8 max-w-2xl text-text-secondary">
          Join investors already earning passive income through our fully on-chain platform.
        </p>

        <!-- Stats row -->
        <div class="mb-8 flex flex-wrap justify-center gap-10">
          {#each highlights as h}
            <div class="text-center">
              <div class="text-3xl font-bold gold-text">{h.val}</div>
              <div class="mt-1 text-sm text-text-muted">{h.label}</div>
            </div>
          {/each}
        </div>

        <button on:click={() => goto('/register')} class="btn-primary px-8 py-3 text-base">
          Get Started Now →
        </button>
      </div>
    </div>
  </div>
</section>
