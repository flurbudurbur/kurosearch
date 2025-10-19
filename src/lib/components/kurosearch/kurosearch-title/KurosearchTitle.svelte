<script lang="ts">
	import { APP_NAME } from '$lib/logic/app-config';

	const now = new Date();

	const getClass = (date: Date) => {
		if (date.getMonth() === 5) {
			return 'pride';
		}

		return 'default';
	};

	const cssClass = getClass(now);
</script>

<div class="title-card">
	<img src="/src/lib/assets/logo.svg" alt="{APP_NAME}">
	<h2 class="subtitle {cssClass}">powered by KuroSearch</h2>
</div>

<style lang="scss">
  .title-card {
    user-select: none;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;

    img {
      height: 32px;
      width: auto;
    }

    .pride {
      background-size: 100% 80%;
      background: linear-gradient(
                      #60d0fa 30%,
                      #60d0fa 42%,
                      #f5aab9 42%,
                      #f5aab9 54%,
                      #fff 54%,
                      #fff 66%,
                      #f5aab9 66%,
                      #f5aab9 78%,
                      #60d0fa 78%,
                      #60d0fa 90%
      ) bottom;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      font-size: 1rem;
      font-weight: 600;
      display: flex;
      place-content: flex-end;
      font-family: 'Bricolage Grotesque', sans-serif;
			font-style: italic;
			margin: 0;
			white-space: nowrap;
    }
  }
</style>
