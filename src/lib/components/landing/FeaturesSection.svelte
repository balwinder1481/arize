<script lang="ts">
  const features = [
    {
      icon: '📈',
      title: 'Daily ROI',
      desc: '0.5%–1.5% daily return on your active package. Booster activates with 2+ direct referrals within 7 days.',
    },
    {
      icon: '🔗',
      title: '10-Level Income',
      desc: 'Earn from 10 generations of your network. Level unlocks based on direct investor count and business volume.',
    },
    {
      icon: '💰',
      title: 'Direct Referral',
      desc: 'Instant percentage payout whenever your direct referral invests. Credited to available balance immediately.',
    },
    {
      icon: '🏆',
      title: 'Salary Rewards',
      desc: 'Qualify for daily salary tiers ($5–$2000/day) based on your team business across 3 legs.',
    },
    {
      icon: '🎯',
      title: 'Bonanza Events',
      desc: 'Admin-created special events with big rewards for top performers. Separate qualification criteria.',
    },
    {
      icon: '🔒',
      title: 'Smart Contract',
      desc: 'All logic runs on-chain. No admin can alter balances or manipulate payouts. Fully transparent.',
    },
  ];
</script>

<section id="features" class="px-4 py-20">
  <div class="mx-auto max-w-6xl">
    <div class="mb-12 text-center">
      <h2 class="section-title mb-4">
        Everything You Need to <span class="gold-gradient">Earn</span>
      </h2>
      <p class="mx-auto max-w-xl text-text-secondary">
        Multiple income streams, all automated, all transparent.
      </p>
    </div>

    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each features as f}
        <div class="card card-hover p-6">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl
                      text-2xl" style="background: var(--color-gold-dim);">
            {f.icon}
          </div>
          <h3 class="mb-2 text-base font-bold text-text-primary">{f.title}</h3>
          <p class="text-sm leading-relaxed text-text-secondary">{f.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
