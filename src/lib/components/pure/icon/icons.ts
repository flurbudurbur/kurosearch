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
import IconCopyright from 'virtual:icons/tabler/copyright';
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
import IconVolume2 from 'virtual:icons/tabler/volume-2';
import IconVolume3 from 'virtual:icons/tabler/volume-3';
import IconVolumeOff from 'virtual:icons/tabler/volume-off';
import IconPlayerPause from 'virtual:icons/tabler/player-pause';
import IconPlayerPlay from 'virtual:icons/tabler/play';
import IconLoader from 'virtual:icons/tabler/loader';
import IconBookmarkFilled from 'virtual:icons/tabler/bookmark-filled';
import IconError404 from 'virtual:icons/tabler/error-404';
import IconBug from 'virtual:icons/tabler/bug';
import IconMoodWrrr from 'virtual:icons/tabler/mood-wrrr';
import IconMenu2 from 'virtual:icons/tabler/menu-2';
import IconPaint from 'virtual:icons/tabler/paint';
import IconKey from 'virtual:icons/tabler/key';
import IconHistoryToggle from 'virtual:icons/tabler/history-toggle';
import IconEyeOff from 'virtual:icons/tabler/eye-off';
import IconLayout from 'virtual:icons/tabler/layout';
import IconRepeat from 'virtual:icons/tabler/repeat';
import IconArrowAutofitRight from 'virtual:icons/tabler/arrow-autofit-right';
import IconSwitchVertical from 'virtual:icons/tabler/switch-vertical';
import IconBadgeHd from 'virtual:icons/tabler/badge-hd';
import IconProgressDown from 'virtual:icons/tabler/progress-down';
import IconUser from 'virtual:icons/tabler/user';
import IconUserEdit from 'virtual:icons/tabler/user-edit';
import IconStar from 'virtual:icons/tabler/star';
import IconStarFilled from 'virtual:icons/tabler/star-filled';
import type { Component } from 'svelte';
import type { SVGAttributes } from 'svelte/elements';

// Icon name to component mapping
export const iconRegistry: Record<string, Component<SVGAttributes<SVGSVGElement>>> = {
	'alert-circle': IconAlertCircle,
	'arrows-exchange': IconArrowsExchange,
	'arrows-maximize': IconArrowsMaximize,
	'arrow-up': IconArrowNarrowUp,
	star: IconStar,
	user: IconUser,
	'arrow-down': IconArrowNarrowDown,
	copyright: IconCopyright,
	'user-edit': IconUserEdit,
	'file-download': IconFileDownload,
	'file-upload': IconFileUpload,
	'player-pause': IconPlayerPause,
	'player-play': IconPlayerPlay,
	'error-404': IconError404,
	'history-toggle': IconHistoryToggle,
	'eye-off': IconEyeOff,
	'mood-wrrr': IconMoodWrrr,
	bug: IconBug,
	'progress-down': IconProgressDown,
	book: IconBook,
	layout: IconLayout,
	'badge-hd': IconBadgeHd,
	'switch-vertical': IconSwitchVertical,
	key: IconKey,
	repeat: IconRepeat,
	'arrow-autofit-right': IconArrowAutofitRight,
	volume: IconVolume,
	'volume-2': IconVolume2,
	'volume-3': IconVolume3,
	'volume-off': IconVolumeOff,
	home: IconHome,
	coffee: IconCoffee,
	loader: IconLoader,
	share: IconShare,
	'menu-2': IconMenu2,
	paint: IconPaint,
	bookmark: IconBookmark,
	'bookmark-filled': IconBookmarkFilled,
	bookmarks: IconBookmarks,
	'brand-github': IconBrandGithub,
	'chevron-left': IconChevronLeft,
	dots: IconDots,
	'brand-discord': IconBrandDiscord,
	edit: IconEdit,
	'external-link': IconExternalLink,
	file: IconFile,
	filter: IconFilter,
	heart: IconHeart,
	'help-circle': IconHelpCircle,
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
