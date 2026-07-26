'use client'
// Ancienne page profil — fusionnée dans « Mes CV ».
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/mes-cv') }, [router])
  return null
}
