import { supabase } from './supabase'

const bucket = 'pedidos'

export async function uploadOrderPhotos(files: File[], customerId: string) {
  const urls: string[] = []
  for (const file of files) {
    const name = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${customerId}/${crypto.randomUUID()}-${name}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type })
    if (error) throw new Error('Não foi possível enviar as fotos. Tente novamente.')
    urls.push(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl)
  }
  return urls
}
