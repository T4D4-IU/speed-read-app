/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$app/environment';
import { precacheAndRoute } from 'workbox-precaching';

// self.addEventListener('message', (event) => {
// 	if (event.data && event.data.type === 'SKIP_WAITING') {
// 		self.skipWaiting();
// 	}
// });

// self.addEventListener('install', (event) => {
// 	event.waitUntil(self.skipWaiting());
// });

// self.addEventListener('activate', (event) => {
// 	event.waitUntil(self.clients.claim());
// });

precacheAndRoute([
	...build.map((s) => ({ url: s, revision: null })),
	...files.map((s) => ({ url: s, revision: null })),
	{ url: '/', revision: version },
	{ url: '/manifest.json', revision: null },
	{ url: '/icons/icon-192x192.png', revision: null },
	{ url: '/icons/icon-512x512.png', revision: null }
]);
