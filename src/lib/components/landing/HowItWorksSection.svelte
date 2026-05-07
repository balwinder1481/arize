<script lang="ts">
  const steps = [
    { n: '01', title: 'Connect Wallet',  desc: 'Connect your MetaMask or any Web3 wallet to BSC network.' },
    { n: '02', title: 'Register',        desc: 'Register with a referrer ID and choose your investment package.' },
    { n: '03', title: 'Earn Daily ROI',  desc: 'Your package accrues 0.5%–1.5% daily, claimable anytime.' },
    { n: '04', title: 'Build Your Team', desc: 'Earn referral + level income as your network grows.' },
    { n: '05', title: 'Claim Salary',    desc: 'Qualify for daily salary rewards by hitting team business targets.' },
    { n: '06', title: 'Withdraw',        desc: 'Withdraw your available balance to your wallet at any time.' },
  ];
</script>

<section id="how-it-works" class="px-4 py-20" style="background: var(--color-surface-2);">
  <div class="mx-auto max-w-6xl">
    <div class="mb-12 text-center">
      <h2 class="section-title mb-4">How It <span class="gold-gradient">Works</span></h2>
      <p class="text-text-secondary">Six simple steps to start earning on-chain</p>
    </div>

    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {#each steps as s, i}
        <div class="card p-6 flex gap-4">
          <div class="flex-shrink-0 flex h-10 w-10 items-center justify-center
                      rounded-full text-sm font-bold text-black"
               style="background: linear-gradient(135deg, #f59e0b, #d97706);">
            {s.n}
          </div>
          <div>
            <h3 class="mb-1 font-bold text-text-primary">{s.title}</h3>
            <p class="text-sm text-text-secondary leading-relaxed">{s.desc}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
