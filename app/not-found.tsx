import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Pagina niet gevonden</h2>
        <p className="text-gray-600 mb-6">
          De pagina die je probeerde te bezoeken bestaat niet of is verplaatst.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-center"
          >
            Ga naar dashboard
          </Link>
          <Link 
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-center"
          >
            Terug naar startpagina
          </Link>
        </div>
      </div>
    </div>
  );
} 