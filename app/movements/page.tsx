'use client';
import { useState } from 'react';
import { useAppContext } from '@/lib/AppContext';
import { ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MovementsPage() {
  const { tools, employees, movements, recordMovement, userRole, activeLoans } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'checkout' | 'checkin'>('checkout');

  // Form state
  const [toolId, setToolId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await recordMovement({ toolId, assetId: assetId.trim() || undefined, employeeId, type, quantity });
    setFeedback(result);

    if (result.success) {
      setTimeout(() => {
        setIsModalOpen(false);
        setFeedback(null);
        setToolId('');
        setAssetId('');
        setEmployeeId('');
        setQuantity(1);
      }, 1500);
    }
  };

  const openModal = (movementType: 'checkout' | 'checkin') => {
    setType(movementType);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Movimentações</h1>
        {userRole === 'admin' && (
          <div className="flex space-x-3">
            <button
              onClick={() => openModal('checkin')}
              className="flex items-center rounded-md bg-white border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <ArrowDownRight className="mr-2 h-4 w-4 text-green-600" />
              Registrar Devolução
            </button>
            <button
              onClick={() => openModal('checkout')}
              className="flex items-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Registrar Retirada
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Tipo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Ferramenta</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Colaborador</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Qtd Movimentada</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Estoque (Antes ➔ Depois)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Data e Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {movements.map((mov) => {
              const tool = tools.find(t => t.id === mov.toolId);
              const emp = employees.find(e => e.id === mov.employeeId);
              return (
                <tr key={mov.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    {mov.type === 'checkout' ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        <ArrowUpRight className="mr-1 h-3 w-3" /> Retirada
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <ArrowDownRight className="mr-1 h-3 w-3" /> Devolução
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{tool?.name || 'Ferramenta Removida'}</div>
                    {mov.assetId && <div className="text-xs text-slate-500">ID: {mov.assetId}</div>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-slate-900">{emp?.name || 'Colaborador Removido'}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {mov.quantity} un.
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-700">
                    {mov.previousQuantity !== undefined && mov.newQuantity !== undefined 
                      ? `${mov.previousQuantity} ➔ ${mov.newQuantity}` 
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {formatDate(mov.date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {movements.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">Nenhuma movimentação registrada.</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 sm:p-0" onClick={() => setIsModalOpen(false)}>
          <div className="relative w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium leading-6 text-slate-900 mb-4 flex items-center">
                    {type === 'checkout' ? (
                      <><ArrowUpRight className="mr-2 h-5 w-5 text-blue-600" /> Registrar Retirada</>
                    ) : (
                      <><ArrowDownRight className="mr-2 h-5 w-5 text-green-600" /> Registrar Devolução</>
                    )}
                  </h3>

                  {feedback && (
                    <div className={`mb-4 rounded-md p-4 ${feedback.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {feedback.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                          )}
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${feedback.success ? 'text-green-800' : 'text-red-800'}`}>
                            {feedback.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Colaborador</label>
                      <select required value={employeeId} onChange={e => {
                        setEmployeeId(e.target.value);
                        if (type === 'checkin') {
                          setToolId('');
                          setAssetId('');
                        }
                      }} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm">
                        <option value="">Selecione um colaborador</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Ferramenta</label>
                      {type === 'checkout' ? (
                        <select required value={toolId} onChange={e => setToolId(e.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm">
                          <option value="">Selecione uma ferramenta</option>
                          {tools.map(tool => (
                            <option key={tool.id} value={tool.id} disabled={tool.availableQuantity <= 0}>
                              {tool.name} ({tool.availableQuantity} disp.)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select required value={toolId && employeeId ? `${toolId}|${assetId}|${employeeId}` : ''} onChange={e => {
                          if (!e.target.value) {
                            setToolId('');
                            setAssetId('');
                            return;
                          }
                          const [tId, aId, eId] = e.target.value.split('|');
                          setToolId(tId);
                          setAssetId(aId || '');
                          if (eId) setEmployeeId(eId);
                          
                          const loan = activeLoans.find(l => l.toolId === tId && (l.assetId || '') === (aId || '') && l.employeeId === eId);
                          if (loan && quantity > loan.quantity) {
                            setQuantity(loan.quantity);
                          }
                        }} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm">
                          <option value="">Selecione uma ferramenta</option>
                          {activeLoans
                            .filter(loan => !employeeId || loan.employeeId === employeeId)
                            .map(loan => {
                              const tool = tools.find(t => t.id === loan.toolId);
                              if (!tool) return null;
                              const emp = employees.find(e => e.id === loan.employeeId);
                              return (
                                <option key={`${loan.toolId}|${loan.assetId || ''}|${loan.employeeId}`} value={`${loan.toolId}|${loan.assetId || ''}|${loan.employeeId}`}>
                                  {tool.name} {loan.assetId ? `(ID: ${loan.assetId})` : ''} - {loan.quantity} un. {employeeId ? '' : `com ${emp?.name}`}
                                </option>
                              );
                            })}
                        </select>
                      )}
                    </div>
                    {type === 'checkout' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700">ID da Ferramenta / Patrimônio (Opcional)</label>
                        <input type="text" value={assetId} onChange={e => setAssetId(e.target.value)} placeholder="Ex: FUR-001" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Quantidade</label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        max={type === 'checkin' && toolId && employeeId ? activeLoans.find(l => l.toolId === toolId && (l.assetId || '') === assetId && l.employeeId === employeeId)?.quantity : undefined}
                        value={quantity} 
                        onChange={e => setQuantity(parseInt(e.target.value))} 
                        className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500 sm:text-sm" 
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button type="submit" className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${type === 'checkout' ? 'bg-amber-500 text-slate-900 hover:bg-amber-600 focus:ring-amber-500' : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'}`}>
                    Confirmar
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 inline-flex w-full justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
    </div>
  );
}
