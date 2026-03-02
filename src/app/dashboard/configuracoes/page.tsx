"use client"

import { useState, useEffect } from "react"
import { Shield, Database, Check, AlertCircle, Save } from "lucide-react"

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isBancoAtivo, setIsBancoAtivo] = useState(true)
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear())
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setIsBancoAtivo(data.isBancoQuestoesAtivo)
        setAnoLetivo(data.anoLetivoAtual || new Date().getFullYear())
        setAvailableYears(data.availableYears || [new Date().getFullYear()])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setSaving(true)
    setShowConfirm(false)
    setMessage(null)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isBancoQuestoesAtivo: isBancoAtivo,
          anoLetivoAtual: Number(anoLetivo)
        })
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso!' })
        // Força atualização da página para refletir no sidebar se necessário
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar configurações.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro de conexão.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="text-blue-600" />
          Configurações do Sistema
        </h1>
        <p className="text-gray-500 mt-2">Gerencie as funcionalidades globais e acessos dos professores.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Módulos Pedagógicos
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="space-y-1">
              <p className="font-medium text-gray-900">Banco de Questões</p>
              <p className="text-sm text-gray-500">Permitir que professores enviem e visualizem o banco de questões.</p>
            </div>
            <button
              onClick={() => setIsBancoAtivo(!isBancoAtivo)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ${
                isBancoAtivo ? 'bg-blue-600 ring-blue-500' : 'bg-gray-200 ring-transparent'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isBancoAtivo ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="space-y-1">
              <p className="font-medium text-gray-900">Ano Letivo Ativo</p>
              <p className="text-sm text-gray-500">Define qual ano letivo será exibido e gerenciado no sistema.</p>
            </div>
            <select
              value={anoLetivo}
              onChange={(e) => setAnoLetivo(Number(e.target.value))}
              className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-32 p-2.5"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div>
            {message && (
              <div className={`flex items-center gap-2 text-sm font-medium ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}>
                {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Modal de Confirmação para Configurações */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Salvar Configurações?</h3>
            <p className="text-slate-500 font-medium mb-8">
              Estas alterações afetarão o comportamento global do sistema para todos os usuários. Deseja confirmar?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                className="py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleSave()}
                className="py-4 rounded-2xl font-black bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
