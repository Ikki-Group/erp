export function LoadingPage() {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div className="animate-spin rounded-full size-8 border-t-2 border-b-2 border-gray-200" />
      <p className="text-center text-sm mt-4 text-muted-foreground">
        Loading...
      </p>
    </div>
  )
}
