<script lang="ts">
  const faqs = [
    { q: 'What is the minimum investment?',        a: 'Minimum investment is $50 USDT. Must be a multiple of $50.' },
    { q: 'How is ROI calculated?',                 a: 'ROI accrues per day from package start time. Daily rate is 0.5% base, up to 1.5% with booster.' },
    { q: 'What is the working cap?',               a: 'Each package earns up to 3× of invested amount. After that the package deactivates.' },
    { q: 'Can I have two active packages?',        a: 'No. You must wait for your current package to deactivate before investing again.' },
    { q: 'How does salary work?',                  a: 'Call checkRank() anytime. If you qualify, salary accrues daily for 60 days.' },
    { q: 'Is this contract upgradeable?',          a: 'Yes, via a transparent proxy. Admin can upgrade the implementation but cannot move user funds.' },
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
