// Central icon registry for the application
// This file imports all icons used in the app
// Tree-shaking will remove unused icons in production builds

import IconAlertCircle from 'virtual:icons/tabler/alert-circle';
import IconArrowsExchange from 'virtual:icons/tabler/arrows-exchange';
import IconArrowsMaximize from 'virtual:icons/tabler/arrows-maximize';
import IconBook from 'virtual:icons/tabler/book';
import IconBookmark from 'virtual:icons/tabler/bookmark';
import IconBrandGithub from 'virtual:icons/tabler/brand-github';
import IconChevronLeft from 'virtual:icons/tabler/chevron-left';
import IconDots from 'virtual:icons/tabler/dots';
import IconEdit from 'virtual:icons/tabler/edit';
import IconExternalLink from 'virtual:icons/tabler/external-link';
import IconFile from 'virtual:icons/tabler/file';
import IconFilter from 'virtual:icons/tabler/filter';
import IconHeart from 'virtual:icons/tabler/heart';
import IconHelpCircle from 'virtual:icons/tabler/help-circle';
import IconInfoCircle from 'virtual:icons/tabler/info-circle';
import IconLink from 'virtual:icons/tabler/link';
import IconMessage from 'virtual:icons/tabler/message';
import IconMinus from 'virtual:icons/tabler/minus';
import IconNotebook from 'virtual:icons/tabler/notebook';
import IconPlus from 'virtual:icons/tabler/plus';
import IconSearch from 'virtual:icons/tabler/search';
import IconServer from 'virtual:icons/tabler/server';
import IconSettings from 'virtual:icons/tabler/settings';
import IconStarFilled from 'virtual:icons/tabler/star-filled';
import IconTag from 'virtual:icons/tabler/tag';
import IconTilde from 'virtual:icons/tabler/tilde';
import IconTrash from 'virtual:icons/tabler/trash';
import IconUserCircle from 'virtual:icons/tabler/user-circle';
import IconX from 'virtual:icons/tabler/x';
import IconArrowNarrowUp from 'virtual:icons/tabler/arrow-narrow-up';
import IconArrowNarrowDown from 'virtual:icons/tabler/arrow-narrow-down';
import IconBrandDiscord from 'virtual:icons/tabler/brand-discord';
import IconCoffee from 'virtual:icons/tabler/coffee';
import IconBookmarks from 'virtual:icons/tabler/bookmarks';
import IconHome from 'virtual:icons/tabler/home';
import IconFileDownload from 'virtual:icons/tabler/file-download';
import IconFileUpload from 'virtual:icons/tabler/file-upload';
import IconShare from 'virtual:icons/tabler/share';
import IconVolume from 'virtual:icons/tabler/volume';
import IconPlayerPause from 'virtual:icons/tabler/player-pause';
import IconPlayerPlay from 'virtual:icons/tabler/play';
import IconLoader from 'virtual:icons/tabler/loader';
import IconError404 from 'virtual:icons/tabler/error-404';
import IconBug from 'virtual:icons/tabler/bug';
import IconMoodWrrr from 'virtual:icons/tabler/mood-wrrr';
import type { Component } from 'svelte';
import type { SVGAttributes } from 'svelte/elements';

// Icon name to component mapping
export const iconRegistry: Record<string, Component<SVGAttributes<SVGSVGElement>>> = {
	'alert-circle': IconAlertCircle,
	'arrows-exchange': IconArrowsExchange,
	'arrows-maximize': IconArrowsMaximize,
	'arrow-up': IconArrowNarrowUp,
	'arrow-down': IconArrowNarrowDown,
	'file-download': IconFileDownload,
	'file-upload': IconFileUpload,
	'player-pause': IconPlayerPause,
	'player-play': IconPlayerPlay,
	'error-404': IconError404,
	'mood-wrrr': IconMoodWrrr,
	bug: IconBug,
	book: IconBook,
	volume: IconVolume,
	home: IconHome,
	coffee: IconCoffee,
	loader: IconLoader,
	share: IconShare,
	bookmark: IconBookmark,
	bookmarks: IconBookmarks,
	'brand-github': IconBrandGithub,
	'chevron-left': IconChevronLeft,
	dots: IconDots,
	discord: IconBrandDiscord,
	edit: IconEdit,
	'external-link': IconExternalLink,
	file: IconFile,
	filter: IconFilter,
	heart: IconHeart,
	'help-circle': IconHelpCircle,
	info: IconInfoCircle,
	'info-circle': IconInfoCircle,
	link: IconLink,
	message: IconMessage,
	minus: IconMinus,
	notebook: IconNotebook,
	plus: IconPlus,
	search: IconSearch,
	server: IconServer,
	settings: IconSettings,
	'star-filled': IconStarFilled,
	tag: IconTag,
	tilde: IconTilde,
	trash: IconTrash,
	'user-circle': IconUserCircle,
	x: IconX,
	// Aliases
	account: IconUserCircle,
	code: IconFile
};
