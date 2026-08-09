'use client'
import { useState, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Réordonnancement par glisser-déposer, basé sur l'API HTML5 native
// (aucune dépendance). Les flèches Monter/Descendre restent disponibles :
// elles servent d'équivalent accessible au clavier, et de secours sur les
// appareils où le glisser-déposer est malaisé.
// ─────────────────────────────────────────────────────────────────────────────
export default function useDragList(items, onReorder, keyOf = (x, i) => i) {
  const [dragKey, setDragKey] = useState(null)   // élément en cours de déplacement
  const [overKey, setOverKey] = useState(null)   // cible survolée

  const move = useCallback((from, to) => {
    if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return
    const arr = [...items]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    onReorder(arr)
  }, [items, onReorder])

  // Props à étaler sur chaque élément de la liste
  const itemProps = useCallback((index) => {
    const key = keyOf(items[index], index)
    return {
      draggable: true,
      onDragStart: (e) => {
        setDragKey(key)
        e.dataTransfer.effectAllowed = 'move'
        // Firefox exige que des données soient définies
        try { e.dataTransfer.setData('text/plain', String(index)) } catch {}
      },
      onDragEnd: () => { setDragKey(null); setOverKey(null) },
      onDragOver: (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (overKey !== key) setOverKey(key)
      },
      onDragLeave: () => { if (overKey === key) setOverKey(null) },
      onDrop: (e) => {
        e.preventDefault()
        const from = items.findIndex((it, i) => keyOf(it, i) === dragKey)
        if (from !== -1) move(from, index)
        setDragKey(null)
        setOverKey(null)
      },
      'data-dragging': dragKey === key ? 'true' : undefined,
      'data-dragover': overKey === key && dragKey !== key ? 'true' : undefined,
    }
  }, [items, keyOf, dragKey, overKey, move])

  const isDragging = (index) => keyOf(items[index], index) === dragKey
  const isOver = (index) => keyOf(items[index], index) === overKey && !isDragging(index)

  return { itemProps, move, isDragging, isOver, dragging: dragKey !== null }
}

// Style visuel commun aux éléments déplaçables
export function dragStyle({ dragging, over }) {
  return {
    opacity: dragging ? 0.4 : 1,
    boxShadow: over ? 'inset 0 3px 0 0 var(--c-primary)' : undefined,
    transition: 'opacity .12s',
  }
}
