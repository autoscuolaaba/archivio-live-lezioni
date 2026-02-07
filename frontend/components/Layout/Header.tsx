export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo e titolo */}
          <div className="flex items-center gap-4">
            <div className="text-3xl">🎓</div>
            <div>
              <h1 className="text-xl md:text-2xl font-poppins font-bold text-gray-dark">
                AUTOSCUOLA ABA
              </h1>
              <p className="text-sm text-gray-600 font-inter">
                Lezioni Live YouTube
              </p>
            </div>
          </div>

          {/* Badge */}
          <div className="hidden md:flex items-center gap-2 bg-aba-red text-white px-4 py-2 rounded-full text-sm font-medium">
            <span>📺</span>
            <span>Dal 2020</span>
          </div>
        </div>
      </div>
    </header>
  )
}
