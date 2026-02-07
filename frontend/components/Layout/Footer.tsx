export default function Footer() {
  return (
    <footer className="bg-gray-dark text-white py-8 mt-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center">
          <h3 className="font-poppins font-bold text-lg mb-2">
            AUTOSCUOLA ABA
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Bassano del Grappa • Cartigliano
          </p>
          <div className="text-xs text-gray-400">
            <p>© {new Date().getFullYear()} Autoscuola ABA</p>
            <p className="mt-1">
              Tutte le lezioni sono video privati su YouTube
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
