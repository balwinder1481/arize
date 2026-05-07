<script lang="ts">
  const faqs = [
    {
      q: 'What is the Neural AI trading model?',
      a: 'ArizeBiz uses a proprietary Neural AI model trained on years of crypto market data. It analyses price action, volume, on-chain signals, and macro indicators 24/7 to execute high-probability trades. Profits are distributed automatically to members via smart contract — no manual intervention, no delay.'
    },
    {
      q: 'How is my daily ROI generated?',
      a: 'The Neural AI model generates returns through automated spot and derivatives trading on major exchanges. Daily profits are calculated, verified on-chain, and distributed at 0.5% per day base rate. The AI dynamically adjusts position sizing based on market volatility — preserving capital during downturns.'
    },
    {
      q: 'Is my investment safe? What if the AI loses?',
      a: 'Smart contracts hold all funds on BSC blockchain — no admin can move user funds. The Neural AI has built-in risk controls: stop-loss limits, maximum drawdown thresholds, and capital protection modes. In adverse markets the AI reduces exposure automatically, prioritising capital safety over yield.'
    },
    {
      q: 'What is the minimum investment and how are packages structured?',
      a: 'Minimum investment starts at $25 USDT. Each package earns up to 4× of the invested amount (2× ROI cap + 2× working income cap). Once the cap is reached, the package deactivates and you can reinvest at a higher tier for compounding growth.'
    },
    {
      q: 'What are Rank Rewards and how do I qualify?',
      a: 'Rank Rewards are daily bonuses paid for 60 days when your team\'s business volume reaches a rank threshold. There are 10 rank tiers from $2,500 to $3.8M team volume. The more your network grows, the higher your rank and daily reward — from $2.5/day all the way to $3,000/day.'
    },
    {
      q: 'How transparent is the AI? Can I verify its performance?',
      a: 'Fully transparent. All ROI distributions, rank claims, referral payments, and withdrawals are recorded permanently on BSC blockchain — verifiable by anyone. Our Q2 2026 roadmap milestone introduces real-time on-chain AI signal feeds so every trade decision is publicly auditable.'
    },
    {
      q: 'Can I withdraw anytime?',
      a: 'Yes. Your available balance can be withdrawn at any time (minimum $10 USDT, once per day). A 10% withdrawal fee applies — this fee funds the AI trading liquidity pool and platform sustainability. Your net amount is shown before you confirm.'
    },
    {
      q: 'What is the referral and level income system?',
      a: 'Earn 5% direct referral bonus instantly when someone registers under you. Additionally, earn level income up to 10 levels deep — 10% on L1, 8% on L2, down through the network. The deeper your team, the more passive income streams you unlock automatically.'
    },
  ];

  let open = -1;
</script>

<section id="faq" class="px-4 py-20">
  <div class="mx-auto max-w-3xl">
    <div class="mb-12 text-center">
      <h2 class="section-title mb-4">Frequently Asked <span class="gold-gradient">Questions</span></h2>
    </div>

    <div class="flex flex-col gap-3">
      {#each faqs as faq, i}
        <div class="card overflow-hidden">
          <button class="flex w-full items-center justify-between p-5 text-left"
                  on:click={() => open = open === i ? -1 : i}>
            <span class="font-semibold text-text-primary">{faq.q}</span>
            <span class="ml-4 flex-shrink-0 text-gold text-xl leading-none">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {#if open === i}
            <div class="border-t border-border px-5 pb-5 pt-3 text-sm text-text-secondary leading-relaxed">
              {faq.a}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
