export default function Footer() {
  return (
    <footer className="bg-netflix-dark border-t border-netflix-border text-netflix-text-secondary py-8 md:py-8 mt-12 md:mt-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center">
          <h3 className="font-poppins font-bold text-base md:text-lg mb-2 text-white">
            AUTOSCUOLA ABA
          </h3>
          <p className="text-sm md:text-sm text-netflix-text-secondary mb-3 md:mb-4">
            Bassano del Grappa &bull; Cartigliano
          </p>
          <div className="text-xs text-netflix-text-muted">
            <p>&copy; {new Date().getFullYear()} Autoscuola ABA</p>
            <p className="mt-1">
              Tutte le lezioni sono video privati su YouTube
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
