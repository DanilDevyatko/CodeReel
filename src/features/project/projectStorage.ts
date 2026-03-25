import type { ProjectDocument } from '../../types/scene'
import { normalizeProjectDocument } from './projectDocument'

const STORAGE_KEY = 'codescenes.project.v1'

export function loadStoredProject() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    return normalizeProjectDocument(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveStoredProject(project: ProjectDocument) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}
