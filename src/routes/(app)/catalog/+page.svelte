<script>
  import ProductTeaser from "$lib/components/ProductTeaser.svelte";

  export let data;
</script>

<ul class="grid md:grid-cols-2 lg:grid-cols-4 mt-12 gap-4">
  {#each data.teasers as product (product.id)}
    <li>
      <ProductTeaser {product} />
    </li>
  {/each}
</ul>
