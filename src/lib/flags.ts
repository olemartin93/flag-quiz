const urls = import.meta.glob<string>('../../node_modules/flag-icons/flags/4x3/??.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byCode = new Map<string, string>()
for (const [path, url] of Object.entries(urls)) {
  const code = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)
  byCode.set(code, url)
}

export function flagUrl(code: string): string {
  return byCode.get(code) ?? byCode.get('xx') ?? ''
}
