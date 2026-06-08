import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useData } from '@/context/DataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import AddCustomerDialog from '@/components/customers/AddCustomerDialog'
import TablePagination from '@/components/shared/TablePagination'
import { formatDate } from '@/lib/formatters'

const PAGE_SIZE = 50

export default function CustomersPage() {
  const { customers, getLoansByCustomerId } = useData()
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [page, setPage] = useState(1)

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.idNumber.includes(q) ||
      c.id.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('customers.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('customers.subtitle', { count: customers.length })}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 me-1.5" />
          {t('customers.addCustomer')}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={t('customers.searchPlaceholder')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.customerId')}</TableHead>
                <TableHead>{t('table.fullName')}</TableHead>
                <TableHead>{t('table.idNumber')}</TableHead>
                <TableHead>{t('table.mobile')}</TableHead>
                <TableHead>{t('table.dob')}</TableHead>
                <TableHead>{t('table.activeLoans')}</TableHead>
                <TableHead>{t('table.memberSince')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t('customers.noFound')}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map(customer => {
                  const loans = getLoansByCustomerId(customer.id)
                  const activeCount = loans.filter(l => l.status === 'Active' || l.status === 'Overdue').length
                  return (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Link to={`/customers/${customer.id}`} className="font-medium text-amber-600 hover:underline">
                          {customer.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={`/customers/${customer.id}`} className="font-medium hover:underline">
                          {customer.fullName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.idNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.mobile}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(customer.dateOfBirth)}</TableCell>
                      <TableCell>
                        {activeCount > 0 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {activeCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(customer.createdAt)}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage(p => p - 1)}
            onNext={() => setPage(p => p + 1)}
          />
        </CardContent>
      </Card>

      <AddCustomerDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
