<script lang="ts">
  export let activeTab: string;
  export let onTabChange: (tab: string) => void;

  const tabs = [
    { id: 'overview',  label: 'Overview',  d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'packages',  label: 'Packages',  d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'team',      label: 'Team',      d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    { id: 'earnings',  label: 'Earnings',  d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'bonanza',   label: 'Rewards',   d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  ];
</script>

<!-- Bottom-center capsule nav -->
<nav class="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
  <div class="flex items-center gap-1 rounded-full px-2 py-2"
       style="background:rgba(17,17,24,0.92);backdrop-filter:blur(16px);border:1px solid rgba(245,158,11,0.2);box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.04)">
    {#each tabs as tab}
      <button
        on:click={() => onTabChange(tab.id)}
        aria-label={tab.label}
        class="flex items-center gap-0 overflow-hidden rounded-full py-2.5 text-xs font-semibold
               transition-all duration-300 ease-out
               {activeTab === tab.id ? 'pl-3 pr-4 text-black' : 'px-3 text-text-muted hover:text-gold'}"
        style="{activeTab === tab.id
          ? 'background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 0 16px rgba(245,158,11,0.4)'
          : ''}"
      >
        <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d={tab.d}/>
        </svg>
        <span class="overflow-hidden whitespace-nowrap transition-all duration-300
                     {activeTab === tab.id ? 'ml-1.5 max-w-[60px] opacity-100' : 'max-w-0 opacity-0'}">
          {tab.label}
        </span>
      </button>
    {/each}
  </div>
</nav>

<div class="h-20"></div>
