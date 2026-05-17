export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div
        className={`${sizes[size]} border-2 rounded-full spin`}
        style={{
          borderColor: 'rgba(139,92,246,0.2)',
          borderTopColor: 'rgba(139,92,246,0.9)',
          boxShadow: '0 0 12px rgba(139,92,246,0.3)',
        }}
      />
    </div>
  )
}