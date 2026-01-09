import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { supabase, checkIsDemoMode } from '../lib/supabase'

const RealtimeContext = createContext()

export function useRealtime() {
    const context = useContext(RealtimeContext)
    if (!context) {
        throw new Error('useRealtime must be used within RealtimeProvider')
    }
    return context
}

export function RealtimeProvider({ children }) {
    const [connectionState, setConnectionState] = useState('disconnected') // 'connected' | 'disconnected' | 'reconnecting'
    const [isDemo, setIsDemo] = useState(true)
    const channelsRef = useRef(new Map())
    const reconnectTimeoutRef = useRef(null)

    // Check demo mode on mount
    useEffect(() => {
        setIsDemo(checkIsDemoMode())
    }, [])

    // Subscribe to a table with optional filters
    const subscribe = useCallback((channelName, table, filter, callback, events = ['INSERT', 'UPDATE', 'DELETE']) => {
        // Skip in demo mode
        if (checkIsDemoMode()) {
            console.log(`[Realtime] Skipping subscription to ${table} (demo mode)`)
            return () => {}
        }

        // Avoid duplicate subscriptions
        if (channelsRef.current.has(channelName)) {
            console.log(`[Realtime] Channel ${channelName} already exists`)
            return () => unsubscribe(channelName)
        }

        const channelConfig = {
            event: '*',
            schema: 'public',
            table,
            ...(filter && { filter })
        }

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', channelConfig, (payload) => {
                if (events.includes(payload.eventType)) {
                    callback(payload)
                }
            })
            .subscribe((status) => {
                console.log(`[Realtime] ${channelName}: ${status}`)
                if (status === 'SUBSCRIBED') {
                    setConnectionState('connected')
                } else if (status === 'CHANNEL_ERROR') {
                    setConnectionState('reconnecting')
                    handleReconnect(channelName, table, filter, callback, events)
                } else if (status === 'CLOSED') {
                    setConnectionState('disconnected')
                }
            })

        channelsRef.current.set(channelName, channel)

        return () => unsubscribe(channelName)
    }, [])

    // Unsubscribe from a channel
    const unsubscribe = useCallback((channelName) => {
        const channel = channelsRef.current.get(channelName)
        if (channel) {
            supabase.removeChannel(channel)
            channelsRef.current.delete(channelName)
            console.log(`[Realtime] Unsubscribed from ${channelName}`)
        }
    }, [])

    // Handle reconnection with exponential backoff
    const handleReconnect = useCallback((channelName, table, filter, callback, events) => {
        let delay = 1000
        const maxDelay = 30000

        const attemptReconnect = () => {
            if (channelsRef.current.has(channelName)) {
                unsubscribe(channelName)
            }

            console.log(`[Realtime] Attempting reconnect for ${channelName} in ${delay}ms`)

            reconnectTimeoutRef.current = setTimeout(() => {
                subscribe(channelName, table, filter, callback, events)
                delay = Math.min(delay * 2, maxDelay)
            }, delay)
        }

        attemptReconnect()
    }, [subscribe, unsubscribe])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            channelsRef.current.forEach((channel, name) => {
                supabase.removeChannel(channel)
            })
            channelsRef.current.clear()
        }
    }, [])

    // Get active subscription count
    const getActiveSubscriptions = useCallback(() => {
        return channelsRef.current.size
    }, [])

    return (
        <RealtimeContext.Provider value={{
            connectionState,
            isDemo,
            subscribe,
            unsubscribe,
            getActiveSubscriptions,
            isConnected: connectionState === 'connected'
        }}>
            {children}
        </RealtimeContext.Provider>
    )
}
