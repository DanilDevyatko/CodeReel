import type { ProjectDocument } from '../../types/scene'
import { normalizeProjectDocument } from './projectDocument'

const STORAGE_KEY = 'codereel.project.v2'
const LEGACY_STORAGE_KEY = 'codescenes.project.v1'

export function loadStoredProject() {
  try {
    const currentRaw = window.localStorage.getItem(STORAGE_KEY)

    if (currentRaw) {
      return normalizeProjectDocument(JSON.parse(currentRaw))
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY)

    if (!legacyRaw) {
      return null
    }

    const migratedProject = normalizeProjectDocument(JSON.parse(legacyRaw))
    saveStoredProject(migratedProject)
    window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    return migratedProject
  } catch {
    return null
  }
}

export function saveStoredProject(project: ProjectDocument) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}
