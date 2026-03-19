<script>
  import { getMasteryColor, getMasteryLevel } from '$lib/design/tokens.mjs';
  
  export let score = 0;
  export let label = '';
  export let size = 'md';
  export let animate = true;

  const sizes = {
    sm: { dim: 48, stroke: 4, fontSize: '0.6rem', labelSize: '0.55rem' },
    md: { dim: 72, stroke: 5, fontSize: '0.8rem', labelSize: '0.6rem' },
    lg: { dim: 100, stroke: 6, fontSize: '1.1rem', labelSize: '0.7rem' },
  };

  $: cfg = sizes[size] || sizes.md;
  $: radius = (cfg.dim - cfg.stroke) / 2;
  $: circumference = 2 * Math.PI * radius;
  $: offset = circumference - (score / 100) * circumference;

  $: color = getMasteryColor(score);
  $: masteryLevel = getMasteryLevel(score);

  // Dynamic style variable
  $: gaugeStyle = `
    --mg-color: ${color}; 
    --dim: ${cfg.dim}px; 
    --circumference: ${circumference}; 
    --target-offset: ${offset};
  `;
</script>

<div class="mastery-gauge" style={gaugeStyle}>
  <svg
    width={cfg.dim}
    height={cfg.dim}
    viewBox="0 0 {cfg.dim} {cfg.dim}"
    class="gauge-svg"
    class:animate-gauge={animate}
  >
    <circle
      class="stroke-slate-100 dark:stroke-slate-800"
      cx={cfg.dim / 2}
      cy={cfg.dim / 2}
      r={radius}
      stroke-width={cfg.stroke}
      fill="none"
    />
    <circle
      class="gauge-fill"
      cx={cfg.dim / 2}
      cy={cfg.dim / 2}
      r={radius}
      stroke-width={cfg.stroke}
      fill="none"
      stroke="var(--mg-color)"
      stroke-dasharray={circumference}
      stroke-dashoffset={offset}
      stroke-linecap="round"
      transform="rotate(-90 {cfg.dim / 2} {cfg.dim / 2})"
    />
  </svg>
  <div class="gauge-inner">
    <span class="gauge-score" style="font-size: {cfg.fontSize}">
      {score}
    </span>
    {#if label}
      <span class="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center truncate px-1" style="max-width: {cfg.dim}px">
        {label}
      </span>
    {/if}
  </div>
</div>

<style>
  .mastery-gauge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--dim);
    height: var(--dim);
    flex-shrink: 0;
  }

  .gauge-svg {
    position: absolute;
    inset: 0;
  }



  .gauge-fill {
    transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .animate-gauge .gauge-fill {
    animation: gaugeFill 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes gaugeFill {
    from {
      stroke-dashoffset: var(--circumference);
    }
  }

  .gauge-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1;
    pointer-events: none;
    width: 100%;
  }

  .gauge-score {
    font-weight: 900;
    line-height: 1;
    color: var(--mg-color);
  }
</style>
