export default function handler(req, res) {
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const hasSupabaseServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

  return res.status(200).json({
    success: true,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    configured: {
      NEXT_PUBLIC_SUPABASE_URL: hasSupabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: hasSupabaseAnon,
      SUPABASE_SERVICE_ROLE_KEY: hasSupabaseServiceRole,
      DATABASE_URL: hasDatabaseUrl,
    },
  })
}

