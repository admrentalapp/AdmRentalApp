const LOGO_SRC = '/Logo ADM.png'

export function AppLogo({
  className = 'h-12 w-auto object-contain',
}: {
  className?: string
}) {
  return (
    <img
      src={LOGO_SRC}
      alt="ADM Rental Service"
      className={className}
    />
  )
}
