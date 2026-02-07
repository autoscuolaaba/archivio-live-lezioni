import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo ABA + Titolo */}
          <div className="flex items-center gap-2 md:gap-4">
            <Image
              src="/logo-aba.png"
              alt="Autoscuola ABA Logo"
              width={280}
              height={168}
              className="h-14 md:h-20 w-auto object-contain"
              priority
            />
            <div className="border-l-2 border-gray-300 pl-2 md:pl-4">
              <h1 className="text-base md:text-2xl font-poppins font-semibold text-gray-800 leading-tight">
                Archivio Lezioni Teoria
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
