<script lang="ts">
  export let name: string;
  export let value: string | undefined = undefined;
  export let onChange = (event: Event) => {};
  export let disabled: boolean | undefined = false;
  export let form: string | undefined = undefined;
</script>

<div class="grid">
  {#if value === undefined}
    <select {name} {disabled} id={name} {form}>
      <slot />
    </select>
  {:else}
    <select {name} {disabled} bind:value id={name} on:change={onChange} {form}>
      <slot />
    </select>
  {/if}

  <svg
    class="relative pointer-events-none row-start-1 col-start-1 w-5 h-5 right-4 justify-self-end self-center"
    viewBox="0 0 512 512"
  >
    <path
      d="M136 208l120-104 120 104M136 304l120 104 120-104"
      fill="none"
      stroke="currentcolor"
      stroke-width="48"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</div>

<style>
  select#shoes-size-metric {
    @apply border-gray-900;

    padding: 0.4em 1em;
    font-size: 12px;
    width: 6em;
    font-weight: bold;
    background-color: transparent;
  }

  select#shoes-size-metric + svg {
    right: 0.4em;
  }
</style>
