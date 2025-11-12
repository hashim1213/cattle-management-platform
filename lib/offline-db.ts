/**
 * Offline Database Layer using IndexedDB
 * Provides robust offline data storage with automatic sync
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface CattleOSDB extends DBSchema {
  cattle: {
    key: string
    value: any
    indexes: { 'by-updated': string }
  }
  pens: {
    key: string
    value: any
  }
  barns: {
    key: string
    value: any
  }
  healthRecords: {
    key: string
    value: any
    indexes: { 'by-cattle': string }
  }
  movements: {
    key: string
    value: any
    indexes: { 'by-cattle': string; 'by-date': string }
  }
  feedInventory: {
    key: string
    value: any
  }
  transactions: {
    key: string
    value: any
  }
  pendingSync: {
    key: string
    value: {
      id: string
      collection: string
      action: 'create' | 'update' | 'delete'
      data: any
      timestamp: number
    }
  }
  voiceNotes: {
    key: string
    value: {
      id: string
      cattleId?: string
      audioBlob: Blob
      transcription?: string
      timestamp: number
      synced: boolean
    }
  }
}

class OfflineDatabase {
  private db: IDBPDatabase<CattleOSDB> | null = null
  private readonly DB_NAME = 'cattleos-offline'
  private readonly DB_VERSION = 1

  async init() {
    if (this.db) return this.db

    this.db = await openDB<CattleOSDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Cattle store
        if (!db.objectStoreNames.contains('cattle')) {
          const cattleStore = db.createObjectStore('cattle', { keyPath: 'id' })
          cattleStore.createIndex('by-updated', 'updatedAt')
        }

        // Pens store
        if (!db.objectStoreNames.contains('pens')) {
          db.createObjectStore('pens', { keyPath: 'id' })
        }

        // Barns store
        if (!db.objectStoreNames.contains('barns')) {
          db.createObjectStore('barns', { keyPath: 'id' })
        }

        // Health records store
        if (!db.objectStoreNames.contains('healthRecords')) {
          const healthStore = db.createObjectStore('healthRecords', { keyPath: 'id' })
          healthStore.createIndex('by-cattle', 'cattleId')
        }

        // Movements store
        if (!db.objectStoreNames.contains('movements')) {
          const movementStore = db.createObjectStore('movements', { keyPath: 'id' })
          movementStore.createIndex('by-cattle', 'cattleId')
          movementStore.createIndex('by-date', 'date')
        }

        // Feed inventory store
        if (!db.objectStoreNames.contains('feedInventory')) {
          db.createObjectStore('feedInventory', { keyPath: 'id' })
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' })
        }

        // Pending sync queue
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'id' })
        }

        // Voice notes store
        if (!db.objectStoreNames.contains('voiceNotes')) {
          db.createObjectStore('voiceNotes', { keyPath: 'id' })
        }
      },
    })

    return this.db
  }

  async put(storeName: keyof CattleOSDB, data: any) {
    const db = await this.init()
    await db.put(storeName as any, data)
  }

  async get(storeName: keyof CattleOSDB, id: string) {
    const db = await this.init()
    return await db.get(storeName as any, id)
  }

  async getAll(storeName: keyof CattleOSDB) {
    const db = await this.init()
    return await db.getAll(storeName as any)
  }

  async delete(storeName: keyof CattleOSDB, id: string) {
    const db = await this.init()
    await db.delete(storeName as any, id)
  }

  async clear(storeName: keyof CattleOSDB) {
    const db = await this.init()
    await db.clear(storeName as any)
  }

  // Add to sync queue
  async addToPendingSync(collection: string, action: 'create' | 'update' | 'delete', data: any) {
    const db = await this.init()
    const syncItem = {
      id: `sync-${Date.now()}-${Math.random()}`,
      collection,
      action,
      data,
      timestamp: Date.now()
    }
    await db.put('pendingSync', syncItem)
    return syncItem.id
  }

  // Get all pending sync items
  async getPendingSync() {
    const db = await this.init()
    return await db.getAll('pendingSync')
  }

  // Remove from sync queue
  async removePendingSync(id: string) {
    const db = await this.init()
    await db.delete('pendingSync', id)
  }

  // Voice notes
  async saveVoiceNote(cattleId: string | undefined, audioBlob: Blob) {
    const db = await this.init()
    const voiceNote = {
      id: `voice-${Date.now()}`,
      cattleId,
      audioBlob,
      timestamp: Date.now(),
      synced: false
    }
    await db.put('voiceNotes', voiceNote)
    return voiceNote.id
  }

  async getUnsyncedVoiceNotes() {
    const db = await this.init()
    const all = await db.getAll('voiceNotes')
    return all.filter(note => !note.synced)
  }
}

export const offlineDB = new OfflineDatabase()
