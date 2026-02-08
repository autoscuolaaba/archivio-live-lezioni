import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-netflix-dark/95 backdrop-blur-sm border-b border-netflix-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 md:py-6 max-w-7xl">
        <div className="flex items-center justify-center">
          {/* Logo ABAtflix */}
          <Image
            src="/logo-abatflix.png"
            alt="ABAtflix - Il vostro Netflix per la Scuola Guida"
            width={1200}
            height={630}
            className="h-20 md:h-32 w-auto object-contain"
            priority
          />
        </div>
      </div>
    </header>
  )
}
