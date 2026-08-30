/*
 * Preview-host compatibility endpoint.
 *
 * The host probes this path before opening the application. Next.js serves
 * static files from `public/`, so returning this no-op module prevents that
 * probe from being interpreted as an application route and falling through to
 * Next's not-found handler.
 */
