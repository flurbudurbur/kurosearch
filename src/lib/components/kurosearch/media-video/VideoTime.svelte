<script lang="ts">
	import { formatVideoTime } from '$lib/logic/format-time';

	interface Props {
		timeLeft: number;
	}

	let { timeLeft }: Props = $props();
</script>

<span>{formatVideoTime(timeLeft)}</span>

<style>
    span {
        font-size: 12px;
        background-color: #0008;
        border-radius: var(--tiny-gap);
        color: white;
        user-select: none;
        display: inline-block;
        padding: 0.4em 0.6em;
        line-height: 1;
    }
</style>
