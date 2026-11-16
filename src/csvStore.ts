const NAME_KEY = 'pl_csv_nome'
const FILE_NAME = 'puzzle.csv'
const PART_NAME = 'puzzle.csv.part'

type MovableHandle = FileSystemFileHandle & {
  move?: (name: string) => Promise<void>
}

export async function keepCsv(file: File): Promise<void> {
  const root = await navigator.storage.getDirectory()
  const part = await root.getFileHandle(PART_NAME, { create: true })
  const writable = await part.createWritable()
  try {
    await file.stream().pipeTo(writable)
  } catch (error) {
    await writable.abort().catch(() => undefined)
    await root.removeEntry(PART_NAME).catch(() => undefined)
    throw error
  }
  const movable = part as MovableHandle
  if (movable.move) {
    await root.removeEntry(FILE_NAME).catch(() => undefined)
    await movable.move(FILE_NAME)
  } else {
    const dest = await root.getFileHandle(FILE_NAME, { create: true })
    const out = await dest.createWritable()
    const saved = await part.getFile()
    await saved.stream().pipeTo(out)
    await root.removeEntry(PART_NAME)
  }
  localStorage.setItem(NAME_KEY, file.name)
}

export async function loadKeptCsv(): Promise<File | null> {
  const name = localStorage.getItem(NAME_KEY)
  if (!name) return null
  try {
    const root = await navigator.storage.getDirectory()
    const handle = await root.getFileHandle(FILE_NAME)
    const stored = await handle.getFile()
    if (!stored.size) return null
    return new File([stored], name, { type: 'text/csv', lastModified: stored.lastModified })
  } catch {
    return null
  }
}
