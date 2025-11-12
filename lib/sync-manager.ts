/**
 * Sync Manager
 * Handles automatic synchronization of offline data when connectivity is restored
 * Now includes Supabase integration for cloud sync
 */

import { offlineDB } from './offline-db'
import { dataStore } from './data-store'
import { supabase, isSupabaseConfigured } from './supabase'

class SyncManager {
  private isOnline: boolean = true
  private syncInProgress: boolean = false
  private syncListeners: Array<(status: string) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      this.setupEventListeners()
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.notifyListeners('online')
      this.syncAll()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyListeners('offline')
    })
  }

  // Subscribe to sync status changes
  onSyncStatusChange(callback: (status: string) => void) {
    this.syncListeners.push(callback)
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback)
    }
  }

  private notifyListeners(status: string) {
    this.syncListeners.forEach(listener => listener(status))
  }

  // Check if online
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  // Save data (works offline)
  async saveData(collection: string, data: any, action: 'create' | 'update' | 'delete' = 'create') {
    try {
      // Save to IndexedDB immediately
      await offlineDB.put(collection as any, data)

      // If online, also save to localStorage (for compatibility)
      if (this.isOnline) {
        await this.syncToLocalStorage(collection, data, action)
      } else {
        // Add to sync queue
        await offlineDB.addToPendingSync(collection, action, data)
      }

      return { success: true, offline: !this.isOnline }
    } catch (error) {
      console.error('[SyncManager] Error saving data:', error)
      return { success: false, error }
    }
  }

  // Sync specific item to localStorage and Supabase
  private async syncToLocalStorage(collection: string, data: any, action: 'create' | 'update' | 'delete') {
    try {
      // Sync to localStorage
      const existing = JSON.parse(localStorage.getItem(collection) || '[]')

      if (action === 'create' || action === 'update') {
        const index = existing.findIndex((item: any) => item.id === data.id)
        if (index >= 0) {
          existing[index] = data
        } else {
          existing.push(data)
        }
      } else if (action === 'delete') {
        const filtered = existing.filter((item: any) => item.id !== data.id)
        localStorage.setItem(collection, JSON.stringify(filtered))

        // Also delete from Supabase
        await this.syncToSupabase(collection, data, 'delete')
        return
      }

      localStorage.setItem(collection, JSON.stringify(existing))

      // Also sync to Supabase if configured
      await this.syncToSupabase(collection, data, action)
    } catch (error) {
      console.error('[SyncManager] Error syncing to localStorage:', error)
    }
  }

  // Sync to Supabase
  private async syncToSupabase(collection: string, data: any, action: 'create' | 'update' | 'delete') {
    if (!isSupabaseConfigured()) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return
      }

      const tableName = this.getSupabaseTableName(collection)
      if (!tableName) {
        return
      }

      // Convert camelCase to snake_case for Supabase
      const dbData = this.toSnakeCase(data)
      dbData.user_id = user.id

      if (action === 'create') {
        const { error } = await supabase
          .from(tableName)
          .insert([dbData])

        if (error) {
          console.error(`[SyncManager] Error creating in Supabase:`, error)
        }
      } else if (action === 'update') {
        const { error } = await supabase
          .from(tableName)
          .update(dbData)
          .eq('id', data.id)
          .eq('user_id', user.id)

        if (error) {
          console.error(`[SyncManager] Error updating in Supabase:`, error)
        }
      } else if (action === 'delete') {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', data.id)
          .eq('user_id', user.id)

        if (error) {
          console.error(`[SyncManager] Error deleting from Supabase:`, error)
        }
      }
    } catch (error) {
      console.error('[SyncManager] Error syncing to Supabase:', error)
    }
  }

  // Map collection names to Supabase table names
  private getSupabaseTableName(collection: string): string | null {
    const mapping: Record<string, string> = {
      'cattle': 'cattle',
      'pens': 'pens',
      'barns': 'barns',
      'weightRecords': 'weight_records',
      'healthRecords': 'health_records',
      'feedInventory': 'feed_inventory',
      'transactions': 'transactions',
    }
    return mapping[collection] || null
  }

  // Convert camelCase object to snake_case for Supabase
  private toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item))
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc: any, key: string) => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        acc[snakeKey] = obj[key]
        return acc
      }, {})
    }
    return obj
  }

  // Sync all pending changes
  async syncAll() {
    if (this.syncInProgress || !this.isOnline) {
      return
    }

    this.syncInProgress = true
    this.notifyListeners('syncing')

    try {
      const pendingItems = await offlineDB.getPendingSync()

      for (const item of pendingItems) {
        await this.syncToLocalStorage(item.collection, item.data, item.action)
        await offlineDB.removePendingSync(item.id)
      }

      // Sync voice notes
      await this.syncVoiceNotes()

      this.notifyListeners('synced')
    } catch (error) {
      console.error('[SyncManager] Sync failed:', error)
      this.notifyListeners('sync-failed')
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncVoiceNotes() {
    const unsyncedNotes = await offlineDB.getUnsyncedVoiceNotes()

    for (const note of unsyncedNotes) {
      // In production, upload to server
      // For now, mark as synced
      note.synced = true
      await offlineDB.put('voiceNotes', note)
    }
  }

  // Get all data from offline DB
  async getData(collection: string) {
    try {
      // Try IndexedDB first
      const data = await offlineDB.getAll(collection as any)

      // Fall back to localStorage if IndexedDB is empty
      if (!data || data.length === 0) {
        const localData = localStorage.getItem(collection)
        if (localData) {
          const parsed = JSON.parse(localData)
          // Populate IndexedDB from localStorage
          for (const item of parsed) {
            await offlineDB.put(collection as any, item)
          }
          return parsed
        }
      }

      return data
    } catch (error) {
      console.error('[SyncManager] Error getting data:', error)
      // Fall back to localStorage
      const localData = localStorage.getItem(collection)
      return localData ? JSON.parse(localData) : []
    }
  }

  // Initialize offline DB with localStorage data
  async initializeFromLocalStorage() {
    const collections = ['cattle', 'pens', 'barns', 'healthRecords', 'feedInventory', 'transactions']

    for (const collection of collections) {
      const localData = localStorage.getItem(collection)
      if (localData) {
        const items = JSON.parse(localData)
        for (const item of items) {
          await offlineDB.put(collection as any, item)
        }
      }
    }
  }
}

export const syncManager = new SyncManager()
