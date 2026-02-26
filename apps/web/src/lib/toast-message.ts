interface ToastMessages {
  loading?: string | React.ReactNode
  success?: string | React.ReactNode | (() => React.ReactNode)
  error?: string | React.ReactNode | ((err: any) => React.ReactNode)
  description?: string | React.ReactNode | (() => React.ReactNode)
}

type CrudOperation = 'update' | 'delete' | 'create' | 'read'

export function toastLabelMessage(
  operation: CrudOperation,
  label: string,
): ToastMessages {
  switch (operation) {
    case 'update':
      return {
        loading: `Mengubah ${label}`,
        success: `Berhasil memperbarui ${label}`,
        error: `Terjadi kesalahan saat memperbarui ${label}`,
      }
    case 'delete':
      return {
        loading: `Menghapus ${label}`,
        success: `Berhasil menghapus ${label}`,
        error: `Terjadi kesalahan saat menghapus ${label}`,
      }
    case 'create':
      return {
        loading: `Menambah ${label}`,
        success: `Berhasil membuat ${label}`,
        error: `Terjadi kesalahan saat membuat ${label}`,
      }
    case 'read':
      return {
        loading: `Mengambil ${label}`,
        success: `Berhasil mengambil ${label}`,
        error: `Terjadi kesalahan saat mengambil ${label}`,
      }
    default:
      return {
        loading: `Mengambil ${label}`,
        success: `Berhasil`,
        error: `Terjadi kesalahan`,
      }
  }
}
