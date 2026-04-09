import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ActivityIcon, CalendarCheckIcon, CheckCircleIcon, PlayIcon, PlusIcon, TimerIcon } from 'lucide-react'
import { toast } from 'sonner'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import {
  createColumnHelper,
  dateColumn,
  statusColumn,
  textColumn,
} from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'
import { Page } from '@/components/layout/page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'
import { workOrderApi } from '@/features/production/api/production.api'
import { WorkOrderSelectDto } from '@/features/production/dto/work-order.dto'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation } from '@tanstack/react-query'

export const Route = createFileRoute('/_app/production/work-orders')({ component: WorkOrdersPage })

const ch = createColumnHelper<WorkOrderSelectDto>()

function WorkOrdersPage() {
  const ds = useDataTableState({ limit: 10 })
  const { data, isLoading, refetch } = workOrderApi.list.useQuery({ ...ds.query, ...ds.pagination })
  
  const [completeWoId, setCompleteWoId] = useState<number | null>(null)
  const [actualQty, setActualQty] = useState('')

  const startMutation = useMutation(workOrderApi.start, {
    onSuccess: () => {
      toast.success('Work Order started')
      refetch()
    },
  })

  const completeMutation = useMutation( {
    mutationFn: workOrderApi.complete.mutationFn,
    onSuccess: () => {
      toast.success('Work Order completed and stock updated')
      setCompleteWoId(null)
      setActualQty('')
      refetch()
    },
  })

  const columns = [
    ch.accessor('id', textColumn({ header: 'No. WO', size: 100 })),
    ch.accessor('recipeName', textColumn({ header: 'Resep/Menu', size: 200 })),
    ch.accessor('productName', textColumn({ header: 'Produk Jadi', size: 200 })),
    ch.accessor(
      'expectedQty',
      statusColumn({
        header: 'Target Qty',
        render: (value) => (
          <span className="font-bold tabular-nums text-foreground/80 pr-4">
            {value}
          </span>
        ),
        size: 130,
      }),
    ) as any,
    ch.accessor('createdAt', dateColumn({ header: 'Dibuat Pada', size: 160 })),
    ch.accessor(
      'status',
      statusColumn({
        header: 'Status',
        render: (value) => {
          const status = value as string
          if (status === 'completed') return <BadgeDot variant="success-outline">Selesai</BadgeDot>
          if (status === 'in_progress') return <BadgeDot variant="warning-outline">Berjalan</BadgeDot>
          if (status === 'draft') return <BadgeDot variant="primary-outline">Draft</BadgeDot>
          return <BadgeDot variant="destructive-outline">{status}</BadgeDot>
        },
        size: 130,
      }),
    ),
    ch.display({
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const wo = row.original
        if (wo.status === 'draft') {
          return (
            <Button
              size="xs"
              variant="outline"
              className="text-primary border-primary/20 hover:bg-primary/5"
              onClick={() => startMutation.mutate({ id: wo.id })}
              loading={startMutation.isPending}
            >
              <PlayIcon className="size-3 mr-1" /> Mulai
            </Button>
          )
        }
        if (wo.status === 'in_progress') {
          return (
            <Button
              size="xs"
              variant="outline"
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => {
                setCompleteWoId(wo.id)
                setActualQty(wo.expectedQty.toString())
              }}
            >
              <CheckCircleIcon className="size-3 mr-1" /> Selesaikan
            </Button>
          )
        }
        return null
      },
      size: 150,
    }),
  ]

  const table = useDataTable({
    columns,
    data: data?.data ?? [],
    pageCount: data?.meta.pageCount ?? 0,
    rowCount: data?.meta.totalCount ?? 0,
    ds,
  })

  return (
    <Page>
      <Page.BlockHeader
100:         title="Perintah Kerja (Work Orders)"
101:         description="Manajemen jadwal produksi dan eksekusi batch untuk barang setengah jadi dan jadi."
102:       />
103:       <Page.Content className="flex flex-col gap-6">
104:         {/* Metric Cards Dashboard */}
105:         <div className="grid gap-4 md:grid-cols-3">
106:           <Card>
107:             <Card.Header className="flex flex-row items-center justify-between pb-2">
108:               <Card.Title className="text-sm font-medium text-muted-foreground">Persentase Selesai</Card.Title>
109:               <ActivityIcon className="h-4 w-4 text-emerald-500" />
110:             </Card.Header>
111:             <Card.Content>
112:               <div className="text-2xl font-bold font-mono tracking-tight">--%</div>
113:               <p className="text-xs text-muted-foreground mt-1">Status Real-time</p>
114:             </Card.Content>
115:           </Card>
116:           <Card>
117:             <Card.Header className="flex flex-row items-center justify-between pb-2">
118:               <Card.Title className="text-sm font-medium text-muted-foreground">Sedang Berjalan</Card.Title>
119:               <TimerIcon className="h-4 w-4 text-amber-500" />
120:             </Card.Header>
121:             <Card.Content>
122:               <div className="text-2xl font-bold font-mono tracking-tight">{data?.data.filter(d => d.status === 'in_progress').length ?? 0} WO</div>
123:               <p className="text-xs text-muted-foreground mt-1">Bahan baku dialokasikan</p>
124:             </Card.Content>
125:           </Card>
126:           <Card>
127:             <Card.Header className="flex flex-row items-center justify-between pb-2">
128:               <Card.Title className="text-sm font-medium text-muted-foreground">Antrian Draft</Card.Title>
129:               <CalendarCheckIcon className="h-4 w-4 text-blue-500" />
130:             </Card.Header>
131:             <Card.Content>
132:               <div className="text-2xl font-bold font-mono tracking-tight">{data?.data.filter(d => d.status === 'draft').length ?? 0} Rencana</div>
133:               <p className="text-xs text-muted-foreground mt-1">Siap untuk diproduksi</p>
134:             </Card.Content>
135:           </Card>
136:         </div>
137: 
138:         <DataTableCard
139:           title="Daftar Work Orders"
140:           table={table}
141:           isLoading={isLoading}
142:           recordCount={data?.meta.totalCount ?? 0}
143:           toolbar={<DataGridFilter ds={ds} options={[{ type: 'search', placeholder: 'Cari No. WO...' }]} />}
144:           action={
145:             <Button size="sm" className="h-10 shadow-md font-medium">
146:               <PlusIcon className="size-4 mr-2" /> Buat WO Baru
147:             </Button>
148:           }
149:         />
150:       </Page.Content>
151: 
152:       <Dialog open={!!completeWoId} onOpenChange={(open) => !open && setCompleteWoId(null)}>
153:         <DialogContent>
154:           <DialogHeader>
155:             <DialogTitle>Selesaikan Work Order</DialogTitle>
156:             <DialogDescription>
157:               Masukkan jumlah aktual (yield) hasil produksi. Pastikan bahan baku telah tercatat dengan benar.
158:             </DialogDescription>
159:           </DialogHeader>
160:           <div className="grid gap-4 py-4">
161:             <div className="grid grid-cols-4 items-center gap-4">
162:               <Label htmlFor="actualQty" className="text-right">Qty Aktual</Label>
163:               <Input
164:                 id="actualQty"
165:                 type="number"
166:                 value={actualQty}
167:                 onChange={(e) => setActualQty(e.target.value)}
168:                 className="col-span-3"
169:               />
170:             </div>
171:           </div>
172:           <DialogFooter>
173:             <Button variant="outline" onClick={() => setCompleteWoId(null)}>Batal</Button>
174:             <Button
175:               variant="success"
176:               onClick={() => completeWoId && completeMutation.mutate({ id: completeWoId, actualQty })}
177:               loading={completeMutation.isPending}
178:             >
179:               Konfirmasi & Tutup WO
180:             </Button>
181:           </DialogFooter>
182:         </DialogContent>
183:       </Dialog>
184:     </Page>
185:   )
186: }
187: 

