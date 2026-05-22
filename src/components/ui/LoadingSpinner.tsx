export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className={`spin-ring ${sizes[size]}`}>
        <div className="spin-inner" style={{ background: 'var(--color-purple-5)' }} />
      </div>
    </div>
  )
}