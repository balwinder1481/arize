<script lang="ts">
  import { isConnected } from '$lib/web3/store';
  import WalletButton from '$lib/components/WalletButton.svelte';

  let mobileOpen = false;

  const navLinks = [
    { label: 'Features',     href: '#features'     },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Benefits',     href: '#benefits'     },
    { label: 'Roadmap',      href: '#roadmap'      },
    { label: 'FAQ',          href: '#faq'          },
  ];
</script>

<header class="glass sticky top-0 z-50 px-4 py-3">
  <nav class="mx-auto flex max-w-6xl items-center justify-between">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl"
           style="background: linear-gradient(135deg, #f59e0b, #d97706);">
        <span class="text-sm font-bold text-black">AB</span>
      </div>
      <span class="font-heading text-lg font-bold text-text-primary">
        Arize<span class="gold-text">Biz</span>
      </span>
    </a>

    <!-- Desktop nav -->
    <ul class="hidden items-center gap-6 md:flex">
      {#each navLinks as link}
        <li>
          <a href={link.href}
             class="text-sm font-medium text-text-secondary transition-colors hover:text-gold">
            {link.label}
          </a>
        </li>
      {/each}
    </ul>

    <!-- Wallet button -->
    <div class="flex items-center gap-3">
      <WalletButton size="sm" />

      <!-- Mobile hamburger -->
      <button class="md:hidden text-text-secondary hover:text-gold"
              on:click={() => mobileOpen = !mobileOpen}>
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {#if mobileOpen}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"/>
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"/>
          {/if}
        </svg>
      </button>
    </div>
  </nav>

  <!-- Mobile menu -->
  {#if mobileOpen}
    <div class="mt-3 border-t border-border pb-3 md:hidden">
      <ul class="mt-3 flex flex-col gap-1">
        {#each navLinks as link}
          <li>
            <a href={link.href}
               class="block px-4 py-2 text-sm text-text-secondary hover:text-gold"
               on:click={() => mobileOpen = false}>
              {link.label}
            </a>
          </li>
        {/each}
        {#if $isConnected}
          <li>
            <a href="/dashboard" class="block px-4 py-2 text-sm text-gold font-medium">
              Dashboard
            </a>
          </li>
        {/if}
      </ul>
    </div>
  {/if}
</header>
