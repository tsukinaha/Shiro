'use client'

import { useQuery } from '@tanstack/react-query'
import { memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { tv } from 'tailwind-variants'
import type { Target, TargetAndTransition } from 'framer-motion'

import { LeftToRightTransitionView } from '~/components/ui/transition/LeftToRightTransitionView'
import { routeBuilder, Routes } from '~/lib/route-builder'
import { useCurrentNoteDataSelector } from '~/providers/note/CurrentNoteDataProvider'
import { useCurrentNoteId } from '~/providers/note/CurrentNoteIdProvider'
import { clsxm } from '~/utils/helper'
import { apiClient } from '~/utils/request'
import { springScrollToTop } from '~/utils/scroller'

export const NoteTimeline = memo(() => {
  const noteId = useCurrentNoteId()
  if (!noteId) return null
  return <NoteTimelineImpl />
})

const animateUl: TargetAndTransition = {
  transition: {
    staggerChildren: 0.5,
  },
}
const NoteTimelineImpl = () => {
  const note = useCurrentNoteDataSelector((data) => {
    const note = data?.data
    if (!note) return null
    return {
      id: note.id,
      nid: note.nid,
      title: note.title,
      created: note.created,
    }
  })
  const noteNid = useCurrentNoteId()

  const noteId = note?.id

  const { data: timelineData } = useQuery(
    ['notetimeline', noteId],
    async ({ queryKey }) => {
      const [, noteId] = queryKey
      if (!noteId) throw ''
      return (await apiClient.note.getMiddleList(noteId, 10)).$serialized.data
    },
    {
      enabled: noteId !== undefined,
      keepPreviousData: true,
    },
  )

  if (!timelineData) {
    return null
  }

  const initialData = note
    ? [
        {
          title: note.title,
          nid: note.nid,
          id: note.id,
          created: note.created,
        },
      ]
    : []

  return (
    <AnimatePresence>
      <motion.ul className="space-y-1" animate={animateUl}>
        {(timelineData || initialData)?.map((item) => {
          const isCurrent = item.nid === parseInt(noteNid || '0')
          return (
            <MemoedItem
              key={item.id}
              active={isCurrent}
              title={item.title}
              nid={item.nid}
            />
          )
        })}
      </motion.ul>
    </AnimatePresence>
  )
}

const styles = tv({
  base: 'text-neutral-content min-w-0 truncate text-left opacity-50 w-[10rem] transition-all tabular-nums hover:opacity-80',
  variants: {
    status: {
      active: 'ml-2 opacity-100',
    },
  },
})

const initialLi: Target = {
  opacity: 0.0001,
}
const animateLi: TargetAndTransition = {
  opacity: 1,
}

const MemoedItem = memo<{
  active: boolean
  title: string
  nid: number
}>((props) => {
  const { active, nid, title } = props

  return (
    <motion.li
      layout
      className="flex items-center [&_i]:hover:text-accent"
      layoutId={`note-${nid}`}
      initial={initialLi}
      animate={animateLi}
      exit={initialLi}
    >
      {active && (
        <LeftToRightTransitionView
          as="span"
          className="inline-flex items-center"
        >
          <i className="icon-[material-symbols--arrow-circle-right-outline-rounded] duration-200" />
        </LeftToRightTransitionView>
      )}
      <Link
        onClick={springScrollToTop}
        prefetch={false}
        className={clsxm(
          active
            ? styles({
                status: 'active',
              })
            : styles(),
        )}
        href={routeBuilder(Routes.Note, {
          id: nid,
        })}
        scroll={false}
      >
        {title}
      </Link>
    </motion.li>
  )
})
