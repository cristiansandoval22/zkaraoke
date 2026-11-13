// node_modules/astro/dist/core/cache/provider-utils.js
/**
* Prefix used for auto-generated path tags.
* Responses are tagged with `astro-path:{pathname}` so that
* `invalidate({ path })` can be implemented via tag-based purge
* on platforms that don't support native path invalidation.
*/
var PATH_TAG_PREFIX = "astro-path:";
/**
* Generate a cache tag for a given path.
* Used by Netlify and Vercel providers to support `invalidate({ path })`.
*/
function pathTag(path) {
	return `${PATH_TAG_PREFIX}${path}`;
}
/**
* Build cache-control directives from CacheOptions.
* Returns the directive string (e.g. `"public, max-age=300, stale-while-revalidate=60"`)
* without the header name, so each provider can use its own header
* (`Netlify-CDN-Cache-Control`, `Vercel-CDN-Cache-Control`, `Cloudflare-CDN-Cache-Control`).
*
* Returns `undefined` if no caching directives are present.
*/
function buildCacheControlDirectives(options, extraDirectives) {
	const directives = [];
	if (extraDirectives) directives.push(...extraDirectives);
	if (options.maxAge !== void 0) directives.push(`max-age=${options.maxAge}`);
	if (options.swr !== void 0) directives.push(`stale-while-revalidate=${options.swr}`);
	return directives.length > 0 ? directives.join(", ") : void 0;
}
/**
* Set common conditional headers (Last-Modified, ETag) on a Headers object.
*/
function setConditionalHeaders(headers, options) {
	if (options.lastModified) headers.set("Last-Modified", options.lastModified.toUTCString());
	if (options.etag) headers.set("ETag", options.etag);
}
/**
* Normalize `InvalidateOptions.tags` to a flat string array.
*/
function normalizeTags(tags) {
	if (!tags) return [];
	return Array.isArray(tags) ? tags : [tags];
}
/**
* Collect all tags needed to invalidate the given options,
* including the path tag if `options.path` is set.
* Used by providers that implement path invalidation via tags
* (Netlify, Vercel) rather than native path purge (Cloudflare).
*/
function collectInvalidationTags(options) {
	const tags = normalizeTags(options.tags);
	if (options.path) tags.push(pathTag(options.path));
	return tags;
}
// node_modules/@astrojs/vercel/dist/cache/provider.js
var factory = () => {
	return {
		name: "vercel",
		setHeaders(options, request) {
			const headers = new Headers();
			const directives = buildCacheControlDirectives(options, ["public"]);
			if (directives) headers.set("Vercel-CDN-Cache-Control", directives);
			const tags = [...options.tags ?? []];
			const { pathname } = new URL(request.url);
			tags.push(pathTag(pathname));
			headers.set("Vercel-Cache-Tag", tags.join(","));
			setConditionalHeaders(headers, options);
			return headers;
		},
		async invalidate(options) {
			const { invalidateByTag } = await import("@vercel/functions");
			const tags = collectInvalidationTags(options);
			await Promise.all(tags.map((tag) => invalidateByTag(tag)));
		}
	};
};
// \0virtual:astro:cache-provider
var _virtual_astro_cache_provider_default = factory;
export { _virtual_astro_cache_provider_default as default };
