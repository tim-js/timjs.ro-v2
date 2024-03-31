<script lang="ts">
  import Chevron from "./chevron.svelte";

  import { onDestroy } from "svelte";

  let current = 0;
  let autoPlay = true;
  let chevronsVisible = false;
  const slides = [
    "https://secure.meetupstatic.com/photos/event/e/5/8/8/highres_508798760.jpeg",
    "https://secure.meetupstatic.com/photos/event/2/c/1/f/highres_513791295.jpeg",
    "https://secure.meetupstatic.com/photos/event/c/9/9/b/highres_519891611.jpeg",
  ];
  function updateCurrentSlide(delta: number, jump = false) {
    if (jump) {
      current = delta;
    } else {
      current = (current + delta + slides.length) % slides.length;
    }
  }
  const stopAutoPlay = () => (autoPlay = false);

  const prev = () => {
    stopAutoPlay();
    updateCurrentSlide(-1);
  };
  const next = () => {
    stopAutoPlay();
    updateCurrentSlide(1);
  };
  const jump = (index: number) => {
    stopAutoPlay();
    updateCurrentSlide(index, true);
  };

  let interval = setInterval(() => {
    if (autoPlay) {
      updateCurrentSlide(1);
    }
  }, 5000);

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div
  class="relative inline-flex overflow-hidden"
  role="contentinfo"
  on:mouseenter={() => (chevronsVisible = true)}
  on:mouseleave={() => (chevronsVisible = false)}>
  <div
    class={`flex transition ease-linear duration-40 `}
    style={`transform: translateX(${-current * 100}%)`}>
    {#each slides as slide}
      <img
        src={slide}
        id={slide}
        alt="meetup"
        class={`md:aspect-video object-cover rounded-lg`} />
    {/each}
  </div>
  <div
    class={`absolute top-0 h-full w-full justify-between items-center flex px-4 md:px-10 text-3xl ${chevronsVisible ? "md:flex" : "md:hidden"}`}>
    <Chevron onClick={prev}>{`<`}</Chevron>
    <Chevron onClick={next}>{`>`}</Chevron>
  </div>

  <div class="absolute bottom-0 flex justify-center w-full gap-3 py-4">
    {#each slides as _, index}
      <button
        on:click={() => jump(index)}
        on:keydown={() => jump(index)}
        class={`rounded-full w-2 h-2 md:w-3 md:h-3 cursor-pointer ${current === index ? "bg-brand" : "bg-gray-600"}`} />
    {/each}
  </div>
</div>
