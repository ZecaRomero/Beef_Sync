import Image from 'next/image'

export default function ConsultaRapidaSplash({ splashProgress }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-amber-900 to-gray-900 flex items-center justify-center z-[9999] transition-opacity duration-300">
      <div className="text-center space-y-8 px-4">
        <div className="relative">
          <div className="animate-bounce">
            <div className="w-45 h-40 mx-auto relative rounded-2xl shadow-2xl overflow-hidden bg-white">
              <div className="relative w-full h-full">
                <Image
                  src="/logo-santanna.png.jpg"
                  alt="Logo Fazenda Sant'Anna"
                  fill
                  className="object-"
                  style={{ objectPosition: 'center center' }}
                  priority
                />
              </div>
            </div>
          </div>

          <div
            className="absolute -right-14 top-10 text-blue-300"
            style={{
              animation: 'float 2s ease-in-out infinite',
              transformOrigin: 'center',
            }}
          >
            <svg className="w-20 h-35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              <path d="M9 12h6m-6 4h6" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">Beef-Sync</h1>
          <p className="text-amber-200 text-lg animate-pulse">Iniciando o sistema...</p>
        </div>

        <div className="w-64 mx-auto">
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-300 ease-out"
              style={{ width: `${splashProgress}%` }}
            />
          </div>
          <p className="text-gray-400 text-sm mt-2">{Math.round(splashProgress)}%</p>
        </div>
      </div>
    </div>
  )
}

