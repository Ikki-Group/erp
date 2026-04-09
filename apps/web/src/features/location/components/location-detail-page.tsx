import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Building2Icon,
  CalendarIcon,
  ChevronRightIcon,
  EditIcon,
  HistoryIcon,
  InfoIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  StoreIcon,
  UsersIcon,
} from 'lucide-react'

import { CardSection } from '@/components/blocks/card/card-section'
import { DataList } from '@/components/blocks/data-display/data-list'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { userApi } from '@/features/iam'
import { cn } from '@/lib/utils'

import { locationApi } from '../api'

interface LocationDetailPageProps {
  id: number
}

export function LocationDetailPage({ id }: LocationDetailPageProps) {
  const { data: locationResult } = useSuspenseQuery({ ...locationApi.detail.query({ id }) })
  const location = locationResult.data

  const { data: membersResult } = useSuspenseQuery({
    ...userApi.list.query({ locationId: id, limit: 100 }),
  })
  const members = membersResult.data ?? []

  return (
    <Page size="lg">
      <Page.BlockHeader
        title={location.name}
        description="Detail informasi lokasi dan daftar pengguna yang ditugaskan."
        back={{ to: '/location' }}
        action={
          <Link
            to="/location/$id/edit"
            params={{ id: String(id) }}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          >
            <EditIcon className="mr-2 size-4" />
            Edit Lokasi
          </Link>
        }
      />

      <Page.Content className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Members */}
        <div className="lg:col-span-2 space-y-6">
          <CardSection title="Informasi Lokasi" icon={<InfoIcon className="size-4 text-primary" />}>
            <DataList cols={2}>
              <DataList.Item label="Nama Lokasi" value={location.name} />
              <DataList.Item label="Kode" value={<code className="font-mono text-xs">{location.code}</code>} />
              <DataList.Item
                label="Tipe"
                value={
                  <Badge variant={location.type === 'store' ? 'info-outline' : 'warning-outline'} size="sm">
                    {location.type === 'store' ? (
                      <StoreIcon className="mr-1 size-3" />
                    ) : (
                      <Building2Icon className="mr-1 size-3" />
                    )}
                    {location.type === 'store' ? 'Store' : 'Warehouse'}
                  </Badge>
                }
              />
              <DataList.Item
                label="Status"
                value={
                  <Badge variant={location.isActive ? 'success-outline' : 'destructive-outline'} size="sm">
                    {location.isActive ? 'Aktif' : 'Non-Aktif'}
                  </Badge>
                }
              />

              <DataList.Item label="Deskripsi" span={2} value={location.description || '-'} />

              {location.address && (
                <DataList.Item
                  label="Alamat"
                  span={2}
                  value={
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="mt-1 size-4 text-muted-foreground shrink-0" />
                      <span>{location.address}</span>
                    </div>
                  }
                />
              )}

              {location.phone && (
                <DataList.Item
                  label="Kontak"
                  value={
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="size-4 text-muted-foreground shrink-0" />
                      <span>{location.phone}</span>
                    </div>
                  }
                />
              )}
            </DataList>
          </CardSection>

          <CardSection
            title="Daftar Anggota"
            icon={<UsersIcon className="size-4 text-primary" />}
            description={`${members.length} pengguna ditugaskan ke lokasi ini`}
          >
            <div className="border rounded-lg overflow-hidden divide-y">
              {members.length === 0 ? (
                <div className="p-8 text-center bg-muted/20">
                  <p className="text-sm text-muted-foreground">Belum ada anggota yang ditugaskan.</p>
                </div>
              ) : (
                members.map((user) => (
                  <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.fullname.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user.fullname}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MailIcon className="size-3" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to="/settings/user/$id"
                      params={{ id: String(user.id) }}
                      className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                    >
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardSection>
        </div>

        {/* Right Column: Audit & Stats */}
        <div className="space-y-6">
          <CardSection title="Audit" icon={<HistoryIcon className="size-4 text-primary" />}>
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <CalendarIcon className="mt-1 size-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Dibuat Pada</span>
                  <span className="text-sm">{new Date(location.createdAt).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <HistoryIcon className="mt-1 size-4 text-muted-foreground shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Terakhir Diperbarui</span>
                  <span className="text-sm">{new Date(location.updatedAt).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <Separator className="border-dashed" />

              <div className="flex flex-col gap-1.5 p-3 rounded-md bg-muted/30 border border-dashed">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  System Identifiers
                </span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Record ID</span>
                  <span className="font-mono">#{location.id}</span>
                </div>
              </div>
            </div>
          </CardSection>
        </div>
      </Page.Content>
    </Page>
  )
}
