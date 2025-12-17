import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

/**
 * 
 * @param file
 * @param folder
 * @returns 
 */
export async function uploadToSupabase(file: File, folder: string): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
  const filePath = `${folder}/${filename}`

  const { data, error } = await supabaseAdmin.storage
    .from('uploads')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (error) {
    console.error('Supabase upload error:', error)
    throw new Error(`Gagal mengupload file: ${file.name}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('uploads')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
