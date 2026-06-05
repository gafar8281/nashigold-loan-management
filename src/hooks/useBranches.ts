import { useEffect, useState } from 'react'
import type { Branch } from '@/types'
import { branchService } from '@/services/branchService'

/** Live-subscribes to the `branches` collection. Admin-only data. */
export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = branchService.subscribe(
      items => {
        setBranches(items)
        setLoading(false)
      },
      err => {
        setError(err.message || 'Failed to load branches.')
        setLoading(false)
      },
    )
    return unsub
  }, [])

  return { branches, loading, error }
}
