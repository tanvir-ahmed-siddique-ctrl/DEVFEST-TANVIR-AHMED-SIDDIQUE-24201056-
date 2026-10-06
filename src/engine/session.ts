import type { ExpiryDates, Matches, RequirementsData } from '../types'

const DB_NAME = 'tender-package-builder'
const STORE = 'workspace'

export interface SavedFile {
  hash: string
  name: string
  type: string
  bytes: ArrayBuffer
}

export interface SavedWorkspace {
  data: RequirementsData
  matchesByHash: Record<string, string>
  expiryDates: ExpiryDates
  files: SavedFile[]
  includeIndex: boolean
  banglaOnCover: boolean
  sealOnCover: boolean
  sealRequirementIds: string[]
  seal?: { name: string; bytes: ArrayBuffer }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveWorkspace(workspace: SavedWorkspace): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(workspace, 'current')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
  db.close()
}

export async function loadWorkspace(): Promise<SavedWorkspace | undefined> {
  const db = await openDb()
  const result = await new Promise<SavedWorkspace | undefined>((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get('current')
    request.onsuccess = () => resolve(request.result as SavedWorkspace | undefined)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return result
}

export function matchesByHash(matches: Matches, hashByFileId: Map<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(matches)
      .map(([requirementId, fileId]) => [requirementId, hashByFileId.get(fileId)])
      .filter((pair): pair is [string, string] => Boolean(pair[1])),
  )
}
