export function LoadingPage() {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div className="animate-spin rounded-full size-8 border-t-2 border-b-2 border-gray-200" />
      <div className="text-center mt-4">Loading...</div>
    </div>
  )
}
