<script lang="ts">
import { createEventDispatcher } from "svelte";

export let isTableView: boolean;

const dispatch = createEventDispatcher<{ toggle: undefined }>();

const handleToggle = () => {
	dispatch("toggle");
};
</script>

<button
	class="btn"
	id="view-toggle"
	title={isTableView ? "Switch to editor view" : "Switch to table view"}
	aria-label={isTableView ? "Switch to editor view" : "Switch to table view"}
	on:click={handleToggle}
>
	{#if isTableView}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
			<polyline points="14,2 14,8 20,8"/>
			<line x1="16" y1="13" x2="8" y2="13"/>
			<line x1="16" y1="17" x2="8" y2="17"/>
			<polyline points="10,9 9,9 8,9"/>
		</svg>
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
			<line x1="9" y1="9" x2="9" y2="15"/>
			<line x1="15" y1="9" x2="15" y2="15"/>
			<line x1="9" y1="9" x2="15" y2="9"/>
			<line x1="9" y1="15" x2="15" y2="15"/>
		</svg>
	{/if}
</button>

<style>
#view-toggle {
	position: absolute;
	top: 12px;
	right: 102px;
	font-weight: bold;
	font-size: 15px;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	width: 40px;
	height: 40px;
}

#view-toggle svg {
	fill: none;
	stroke: currentColor;
	width: 20px;
	height: 20px;
}
</style>