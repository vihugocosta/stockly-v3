'use client';
import { useAppContext } from '@/lib/AppContext';
import { Wrench, Users, ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { tools, employees, movements } = useAppContext();

  const totalTools = tools.reduce((acc, tool) => acc + tool.totalQuantity, 0);
  const availableTools = tools.reduce((acc, tool) => acc + tool.availableQuantity, 0);
  const loanedTools = totalTools - availableTools;

  const recentMovements = movements.slice(0, 5);

  const toolsLowStock = tools.filter(t => t.availableQuantity === 0);

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
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center">
            <div className="rounded-md bg-amber-100 p-3">
              <Wrench className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Total de Ferramentas</p>
              <p className="text-2xl font-semibold text-slate-900">{totalTools}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center">
            <div className="rounded-md bg-blue-100 p-3">
              <ArrowUpRight className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Em Uso (Emprestadas)</p>
              <p className="text-2xl font-semibold text-slate-900">{loanedTools}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center">
            <div className="rounded-md bg-green-100 p-3">
              <ArrowDownRight className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Disponíveis</p>
              <p className="text-2xl font-semibold text-slate-900">{availableTools}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <div className="flex items-center">
            <div className="rounded-md bg-purple-100 p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-500">Colaboradores</p>
              <p className="text-2xl font-semibold text-slate-900">{employees.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Movimentações Recentes</h2>
          <div className="space-y-4">
            {recentMovements.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma movimentação registrada.</p>
            ) : (
              recentMovements.map((mov) => {
                const tool = tools.find(t => t.id === mov.toolId);
                const emp = employees.find(e => e.id === mov.employeeId);
                return (
                  <div key={mov.id} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center">
                      <div className={`rounded-full p-2 ${mov.type === 'checkout' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {mov.type === 'checkout' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">
                          {tool?.name || 'Ferramenta Removida'}
                          {mov.assetId && <span className="ml-2 text-xs font-normal text-slate-500">ID: {mov.assetId}</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          {emp?.name || 'Colaborador Removido'} • {mov.quantity} un.
                          {mov.previousQuantity !== undefined && mov.newQuantity !== undefined ? ` (${mov.previousQuantity} ➔ ${mov.newQuantity})` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDate(mov.date)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
            Alertas de Estoque
          </h2>
          <div className="space-y-4">
            {toolsLowStock.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum alerta de estoque no momento.</p>
            ) : (
              toolsLowStock.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-red-800">{tool.name}</p>
                    <p className="text-xs text-red-600">Estoque zerado. Todas as unidades estão em uso.</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                    0 / {tool.totalQuantity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
