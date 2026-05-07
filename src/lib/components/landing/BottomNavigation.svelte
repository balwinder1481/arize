<script lang="ts">
  let active = 'home';

  const items = [
    { id: 'home',     label: 'Home',     section: 'hero',        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'features', label: 'Features', section: 'features',    icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'roadmap',  label: 'Roadmap',  section: 'roadmap',     icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { id: 'benefits', label: 'Benefits', section: 'benefits',    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'faq',      label: 'FAQ',      section: 'faq',         icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
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

<!-- Bottom-center capsule nav — both mobile and desktop -->
<nav class="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
  <div class="flex items-center gap-1 rounded-full px-2 py-2"
       style="background:rgba(17,17,24,0.92);backdrop-filter:blur(16px);border:1px solid rgba(245,158,11,0.2);box-shadow:0 8px 32px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.04)">
    {#each items as item}
      <button
        on:click={() => scrollTo(item)}
        aria-label={item.label}
        class="group relative flex items-center gap-0 overflow-hidden rounded-full px-3 py-2.5
               text-xs font-semibold transition-all duration-300 ease-out
               {active === item.id
                 ? 'text-black pl-3 pr-4'
                 : 'text-text-muted hover:text-gold px-3'}"
        style="{active === item.id
          ? 'background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 0 16px rgba(245,158,11,0.4)'
          : ''}"
      >
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d={item.icon}/>
        </svg>
        <!-- Label only when active -->
        <span class="overflow-hidden whitespace-nowrap transition-all duration-300
                     {active === item.id ? 'ml-1.5 max-w-[60px] opacity-100' : 'max-w-0 opacity-0'}">
          {item.label}
        </span>
      </button>
    {/each}
  </div>
</nav>

<!-- Spacer so footer isn't hidden behind nav -->
<div class="h-20"></div>
