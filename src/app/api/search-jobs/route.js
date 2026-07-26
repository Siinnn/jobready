import { NextResponse } from 'next/server'
import { searchAllPlatforms } from '@/lib/apify'

/**
 * POST /api/search-jobs
 * Body: { keywords, location, contractType, limit }
 */
export async function POST(req) {
  try {
    const { keywords, location, contractType, limit = 10 } = await req.json()

    if (!keywords) {
      return NextResponse.json({ error: 'keywords requis' }, { status: 400 })
    }

    const offers = await searchAllPlatforms({ keywords, location, contractType, limit })

    return NextResponse.json({
      success: true,
      count: offers.length,
      offers,
    })
  } catch (err) {
    console.error('search-jobs error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
