'use client'
// L'ancien module « lettre type » est remplacé par « Mes lettres ».
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LettreTypeRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/mes-lettres') }, [router])
  return null
}
