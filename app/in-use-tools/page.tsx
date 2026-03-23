'use client';
import { useAppContext } from '@/lib/AppContext';
import { Search, Wrench, User, Calendar, Hash } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InUseToolsPage() {
  const { activeLoans, tools, employees } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const enrichedLoans = activeLoans.map(loan => {
    const tool = tools.find(t => t.id === loan.toolId);
    const employee = employees.find(e => e.id === loan.employeeId);
    return {
      ...loan,
      toolName: tool?.name || 'Ferramenta Desconhecida',
      employeeName: employee?.name || 'Colaborador Desconhecido',
      employeePhoto: employee?.photo || '',
      employeeRole: employee?.role || '',
    };
  });

  const filteredLoans = enrichedLoans.filter(loan => 
    loan.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Ferramentas em Uso</h1>
      </div>

      <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 shadow-sm">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por ferramenta ou colaborador..."
          className="ml-2 block w-full border-0 p-0 text-slate-900 placeholder-slate-400 focus:ring-0 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLoans.map((loan, index) => (
          <div key={`${loan.toolId}-${loan.employeeId}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
            <div className="border-b border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">{loan.toolName}</h3>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <Hash className="mr-1 h-3 w-3" />
                    <span>Quantidade: {loan.quantity}</span>
                    {loan.assetId && (
                      <>
                        <span className="mx-2">•</span>
                        <span>ID: {loan.assetId}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-slate-200">
                  {loan.employeePhoto ? (
                    <Image src={loan.employeePhoto} alt={loan.employeeName} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{loan.employeeName}</p>
                  <p className="text-xs text-slate-500">{loan.employeeRole}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <Calendar className="mr-1.5 h-4 w-4 text-slate-400" />
                <span>Retirado em: {format(loan.lastCheckoutDate, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}</span>
              </div>
            </div>
          </div>
        ))}

        {filteredLoans.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-slate-300 p-12 text-center">
            <Wrench className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">Nenhuma ferramenta em uso</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm ? 'Nenhum resultado encontrado para sua busca.' : 'Todas as ferramentas estão disponíveis no momento.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
