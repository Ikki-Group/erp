import { format } from 'date-fns'

export function toDateTimeStamp(date: Date | string | number): string {
  return format(date, 'dd-MM-yyyy, HH:mm')
}
