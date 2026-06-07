import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useBranches } from '@/hooks/useBranches'
import { formatDate } from '@/lib/formatters'
import CreateBranchDialog from '@/components/branches/CreateBranchDialog'

export default function BranchesPage() {
  const { branches, loading, error } = useBranches()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Branches</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Branch
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-sm text-destructive">{error}</div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading branches…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No branches yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  branches.map(branch => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        <Link to={`/branches/${branch.id}`} className="text-amber-600 hover:underline">
                          {branch.branchName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{branch.branchEmail}</TableCell>
                      <TableCell>
                        {branch.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(branch.createdAt.slice(0, 10))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateBranchDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
