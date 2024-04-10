<script lang="ts">
  export let onClick: () => void;
</script>

<button
  on:click={onClick}
  class="flex items-center justify-center w-4 h-4 p-4 overflow-hidden text-xl transition-all bg-black rounded-full md:h-8 md:w-8 md:p-6 md:text-2xl duration-70 text-brand bg-opacity-60 hover:bg-opacity-100">
  <slot />
</button>
