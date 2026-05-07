<script lang="ts">
  let active = 'home';

  const items = [
    { id: 'home',     label: 'Home',     section: 'hero',        icon: '🏠' },
    { id: 'features', label: 'Features', section: 'features',    icon: '✨' },
    { id: 'how',      label: 'How',      section: 'how-it-works',icon: '🚀' },
    { id: 'benefits', label: 'Benefits', section: 'benefits',    icon: '📊' },
    { id: 'about',    label: 'About',    section: 'about',       icon: 'ℹ️' },
  ];

  function scrollTo(item: typeof items[0]) {
    active = item.id;
    const el = document.getElementById(item.section);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
</script>

<!-- Desktop — vertical left sidebar -->
<nav class="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
  <div class="glass flex flex-col gap-1 rounded-2xl p-2">
    {#each items as item}
      <button
        class="group relative flex items-center gap-0 overflow-hidden rounded-xl px-3 py-2.5
               text-sm font-medium transition-all duration-300
               {active === item.id ? 'text-black' : 'text-text-secondary hover:text-gold'}"
        style="{active === item.id ? 'background:linear-gradient(135deg,#f59e0b,#d97706)' : ''}"
        on:click={() => scrollTo(item)}
        aria-label={item.label}
      >
        <span class="text-base leading-none">{item.icon}</span>
        <!-- Label slides in on hover/active -->
        <span class="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300
                     group-hover:ml-2 group-hover:max-w-[80px]
                     {active === item.id ? 'ml-2 max-w-[80px]' : ''}">
          {item.label}
        </span>
      </button>
    {/each}
  </div>
</nav>

<!-- Mobile — bottom bar -->
<nav class="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
     style="background:rgba(17,17,24,0.95);backdrop-filter:blur(12px);border-top:1px solid var(--color-border)">
  <div class="flex justify-around px-2 py-2">
    {#each items as item}
      <button
        class="relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium
               transition-colors {active === item.id ? 'text-gold' : 'text-text-muted'}"
        on:click={() => scrollTo(item)}
      >
        {#if active === item.id}
          <!-- Active top line -->
          <div class="absolute -top-px left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-b-full"
               style="background:linear-gradient(90deg,#f59e0b,#d97706)"></div>
        {/if}
        <span class="text-lg leading-none">{item.icon}</span>
        <span>{item.label}</span>
      </button>
    {/each}
  </div>
</nav>

<!-- Mobile spacer -->
<div class="h-16 lg:hidden"></div>
