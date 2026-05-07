<script lang="ts">
  export let activeTab: string;
  export let onTabChange: (tab: string) => void;

  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: '🏠' },
    { id: 'packages',  label: 'Packages',  icon: '🛍️' },
    { id: 'team',      label: 'Team',      icon: '👥' },
    { id: 'earnings',  label: 'Earnings',  icon: '💰' },
    { id: 'bonanza',   label: 'Rewards',   icon: '🏆' },
  ];
</script>

<!-- Mobile bottom nav -->
<nav class="fixed bottom-0 left-0 right-0 z-50"
     style="background:rgba(10,10,15,0.97);backdrop-filter:blur(12px);border-top:1px solid var(--color-border)">
  <div class="flex justify-around px-1 py-1.5">
    {#each tabs as tab}
      <button
        class="relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-xs font-medium transition-all
               {activeTab === tab.id ? 'text-black' : 'text-text-muted hover:text-text-secondary'}"
        style="{activeTab === tab.id ? 'background:linear-gradient(135deg,#f59e0b,#d97706)' : ''}"
        on:click={() => onTabChange(tab.id)}
      >
        {#if activeTab === tab.id}
          <div class="absolute -top-px left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-b-full"
               style="background:linear-gradient(90deg,#f59e0b,#d97706)"></div>
        {/if}
        <span class="text-lg leading-none">{tab.icon}</span>
        <span>{tab.label}</span>
      </button>
    {/each}
  </div>
</nav>

<div class="h-16"></div>
