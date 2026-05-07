<script lang="ts">
  const highlights = [
    { icon: '🛡️', title: 'Verified Smart Contracts', desc: 'Fully verified on BSC blockchain' },
    { icon: '🕐', title: '24/7 Available',            desc: 'Platform never sleeps' },
    { icon: '👥', title: 'Community Driven',          desc: 'Built by the community, for the community' },
    { icon: '✅', title: 'Proven System',             desc: 'Tested and trusted by investors' },
  ];

  const stats = [
    { val: '100%', label: 'Decentralized' },
    { val: '0%',   label: 'Hidden Fees' },
    { val: '24/7', label: 'Availability' },
    { val: '∞',    label: 'Earning Potential' },
  ];
</script>

<section id="about" class="relative overflow-hidden px-4 py-20" style="background:var(--color-surface-2)">
  <!-- Glow -->
  <div class="pointer-events-none absolute inset-0">
    <div class="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
         style="background:radial-gradient(circle,#f59e0b,transparent);filter:blur(100px)"></div>
  </div>

  <div class="relative mx-auto max-w-6xl">
    <!-- Header -->
    <div class="mb-12 text-center">
      <div class="mb-4 inline-flex rounded-full border border-border-strong px-4 py-1.5 text-sm font-medium text-gold"
           style="background:var(--color-gold-dim)">
        About Us
      </div>
      <h2 class="section-title mb-4">
        <span class="gold-gradient">Built on Trust & Technology</span>
      </h2>
    </div>

    <!-- Two-col content -->
    <div class="mb-14 grid gap-12 lg:grid-cols-2 lg:items-center">
      <!-- Left: mission text -->
      <div class="relative space-y-5 border-l-2 border-gold-dark pl-8">
        <h3 class="text-xl font-bold text-text-primary">Our Mission</h3>
        <p class="leading-relaxed text-text-secondary">
          ArizeBiz combines cutting-edge blockchain technology with proven network marketing strategies
          to create a transparent, secure, and profitable platform for everyone.
        </p>
        <p class="leading-relaxed text-text-secondary">
          Our smart contracts are fully verified on BSC. The system is designed for long-term sustainability,
          ensuring your investments are safe and earnings are automated.
        </p>
        <p class="leading-relaxed text-text-secondary">
          We believe in democratizing wealth creation through decentralized technology,
          making financial freedom accessible to everyone, everywhere.
        </p>
        <div class="pt-2">
          <a href="/register" class="btn-primary inline-block px-6 py-3">Join Our Community →</a>
        </div>
      </div>

      <!-- Right: highlight cards -->
      <div class="grid grid-cols-2 gap-4">
        {#each highlights as h}
          <div class="card card-hover cursor-pointer p-5 text-center">
            <div class="mb-3 flex h-14 w-14 mx-auto items-center justify-center rounded-2xl text-2xl"
                 style="background:var(--color-gold-dim)">
              {h.icon}
            </div>
            <h4 class="mb-1 text-sm font-bold text-text-primary">{h.title}</h4>
            <p class="text-xs text-text-secondary">{h.desc}</p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Stats banner -->
    <div class="rounded-3xl p-8" style="background:var(--color-surface-3);border:1px solid var(--color-border)">
      <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
        {#each stats as s}
          <div class="text-center">
            <div class="text-3xl font-bold gold-text md:text-4xl">{s.val}</div>
            <div class="mt-1 text-sm text-text-muted">{s.label}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>
