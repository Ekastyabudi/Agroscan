// This is the service worker with the Cache-first network

const CACHE = "precache";
const precacheFiles = [
  "/",
  "/index.html",
  "/static/js/main.chunk.js",
  "/static/js/0.chunk.js",
  "/static/js/bundle.js",
  "/manifest.json",
  "/favicon.ico",
  "/assets/Logo192.png", 
  "/assets/Logo512.png", 
  "/assets/logo.png", 
  "/assets/konten.webp",
  "/assets/screenshot-wide.png",
  "/assets/screenshot-narrow.png" 
];

self.addEventListener("install", function (event) {
  console.log("[PWA Builder] Install Event processing");

  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log("[PWA Builder] Cached offline page during install");
      // Catch any errors during precaching so the service worker doesn't fail to install
      return cache.addAll(precacheFiles).catch(function(error) {
        console.error('Precache failed:', error);
      });
    })
  );
});

// Allow sw to control of current page
self.addEventListener("activate", function (event) {
  console.log("[PWA Builder] Claiming clients for current page");
  event.waitUntil(self.clients.claim());
});

// If any fetch fails, it will look for the request in the cache
// and will return the cached response
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        console.log("[PWA Builder] add page to offline cache: " + response.url);

        // If request was successful, add or update it in the cache
        event.waitUntil(updateCache(event.request, response.clone()));

        return response;
      })
      .catch(function (error) {
        console.log("[PWA Builder] Network request Failed. Serving content from cache for: " + event.request.url + ", Error: " + error);
        return fromCache(event.request);
      })
  );
});

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return the offline page
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if (!matching || matching.status === 404) {
        // Fallback to a generic offline page if a specific cached resource is not found
        // return caches.match('/offline.html'); // Uncomment and create an offline.html if needed
        return Promise.reject("no-match found in cache"); // Reject to trigger the catch in fetch handler
      }

      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.put(request, response);
  });
} 