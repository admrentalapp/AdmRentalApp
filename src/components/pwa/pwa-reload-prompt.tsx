import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaReloadPrompt() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  })

  if (!needRefresh && !offlineReady) {
    return null
  }

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-100 mx-auto max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-4 text-white shadow-2xl sm:inset-x-auto sm:right-6"
    >
      {offlineReady && !needRefresh && (
        <p className="text-sm text-zinc-300">
          App pronto para uso offline.
        </p>
      )}

      {needRefresh && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-300">
            Nova versão disponível. Atualize para carregar as mudanças.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Atualizar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
