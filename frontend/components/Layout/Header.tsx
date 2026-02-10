import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-netflix-dark">
      <div className="container mx-auto px-4 pt-2 pb-0 max-w-7xl">
        <div className="flex items-center justify-center">
          {/* Logo ABAtflix */}
          <Image
            src="/logo-abatflix.png"
            alt="ABAtflix - Il vostro Netflix per la Scuola Guida"
            width={1200}
            height={630}
            className="h-14 md:h-20 w-auto object-contain"
            priority
          />
        </div>
      </div>
    </header>
  )
}
