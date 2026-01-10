/**
 * Lazy import wrapper with chunk load error recovery
 *
 * When Vite/Vercel deploys a new version, old chunk hashes become invalid.
 * This wrapper catches chunk load failures and triggers a page reload
 * to fetch fresh chunks, preventing the "Failed to fetch dynamically
 * imported module" error from breaking the app.
 */

import { lazy } from 'react'

// Track if we've already attempted a reload to prevent infinite loops
const hasReloaded = () => {
    const reloadKey = 'chunk_reload_attempted'
    const lastReload = sessionStorage.getItem(reloadKey)

    if (lastReload) {
        const elapsed = Date.now() - parseInt(lastReload, 10)
        // If we reloaded in the last 10 seconds, don't reload again
        if (elapsed < 10000) {
            return true
        }
    }
    return false
}

const markReloaded = () => {
    sessionStorage.setItem('chunk_reload_attempted', Date.now().toString())
}

const clearReloadFlag = () => {
    sessionStorage.removeItem('chunk_reload_attempted')
}

/**
 * Wraps a dynamic import with retry and reload logic
 * @param {() => Promise<any>} importFn - Dynamic import function
 * @param {string} chunkName - Name of the chunk for logging
 * @returns {React.LazyExoticComponent}
 */
export function lazyWithRetry(importFn, chunkName = 'unknown') {
    return lazy(async () => {
        try {
            // Clear reload flag on successful load
            const component = await importFn()
            clearReloadFlag()
            return component
        } catch (error) {
            // Check if this is a chunk load error
            const isChunkError =
                error.message?.includes('Failed to fetch dynamically imported module') ||
                error.message?.includes('Loading chunk') ||
                error.message?.includes('Loading CSS chunk') ||
                error.name === 'ChunkLoadError'

            if (isChunkError && !hasReloaded()) {
                console.warn(`[lazyWithRetry] Chunk load failed for ${chunkName}, reloading page...`)
                markReloaded()
                // Force reload from server, bypassing cache
                window.location.reload()
                // Return a never-resolving promise to prevent rendering stale content
                return new Promise(() => {})
            }

            // Re-throw if not a chunk error or if we already tried reloading
            console.error(`[lazyWithRetry] Failed to load ${chunkName}:`, error)
            throw error
        }
    })
}

export default lazyWithRetry
