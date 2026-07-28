'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Moon, Sun, Award, DollarSign, FileText, 
  Settings, RefreshCw, CheckCircle2, AlertCircle, Trash2, Edit3, 
  ChevronLeft, ChevronRight, Download, ShieldCheck
} from 'lucide-react';

interface DayEntry {
  normalHours: number;
  normalRate: number;
  nightHours: number;
  nightRate: number;
  festiveHours: number;
  festiveRate: number;
  worked: boolean;
}

interface MonthData {
  [day: string]: DayEntry;
}

interface AllMonthsData {
  [yearMonth: string]: MonthData;
}

export default function PayrollApp() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  const [defaultRates, setDefaultRates] = useState({
    normal: 11.70,
    night: 12.50,
    festive: 17.90,
  });

  const [incentivo, setIncentivo] = useState<number>(18.96);
  const [vacacionesExtra, setVacacionesExtra] = useState<number>(91.38);
  const [ppExtra, setPpExtra] = useState<number>(183.15);
  const [irpfPercent, setIrpfPercent] = useState<number>(2.0);

  const [allData, setAllData] = useState<AllMonthsData>({});
  const [activeTab, setActiveTab] = useState<'daily' | 'summary' | 'settings'>('daily');
  const [savedMessage, setSavedMessage] = useState<boolean>(false);

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  useEffect(() => {
    const saved = localStorage.getItem('hcsl_payroll_data');
    if (saved) {
      try { setAllData(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedRates = localStorage.getItem('hcsl_payroll_rates');
    if (savedRates) {
      try { setDefaultRates(JSON.parse(savedRates)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveData = (newData: AllMonthsData) => {
    setAllData(newData);
    localStorage.setItem('hcsl_payroll_data', JSON.stringify(newData));
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const saveRates = (newRates: typeof defaultRates) => {
    setDefaultRates(newRates);
    localStorage.setItem('hcsl_payroll_rates', JSON.stringify(newRates));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const daysInCurrentMonth = getDaysInMonth(selectedYear, selectedMonth);
  const currentMonthData: MonthData = allData[monthKey] || {};

  const getDayEntry = (day: number): DayEntry => {
    const dayStr = String(day);
    if (currentMonthData[dayStr]) return currentMonthData[dayStr];
    return {
      normalHours: 0,
      normalRate: defaultRates.normal,
      nightHours: 0,
      nightRate: defaultRates.night,
      festiveHours: 0,
      festiveRate: defaultRates.festive,
      worked: false,
    };
  };

  const updateDayEntry = (day: number, field: keyof DayEntry, value: any) => {
    const dayStr = String(day);
    const existing = getDayEntry(day);
    const updatedDay = { ...existing, [field]: value };
    if (['normalHours', 'nightHours', 'festiveHours'].includes(field) && Number(value) > 0) {
      updatedDay.worked = true;
    }
    saveData({ ...allData, [monthKey]: { ...currentMonthData, [dayStr]: updatedDay } });
  };

  let totalDaysWorked = 0;
  let totalNormalHours = 0, totalNormalAmount = 0;
  let totalNightHours = 0, totalNightAmount = 0;
  let totalFestiveHours = 0, totalFestiveAmount = 0;

  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const entry = getDayEntry(d);
    if (entry.worked || entry.normalHours > 0 || entry.nightHours > 0 || entry.festiveHours > 0) {
      totalDaysWorked++;
      totalNormalHours += Number(entry.normalHours) || 0;
      totalNormalAmount += (Number(entry.normalHours) || 0) * (Number(entry.normalRate) || defaultRates.normal);
      totalNightHours += Number(entry.nightHours) || 0;
      totalNightAmount += (Number(entry.nightHours) || 0) * (Number(entry.nightRate) || defaultRates.night);
      totalFestiveHours += Number(entry.festiveHours) || 0;
      totalFestiveAmount += (Number(entry.festiveHours) || 0) * (Number(entry.festiveRate) || defaultRates.festive);
    }
  }

  const grossTotal = totalNormalAmount + totalNightAmount + totalFestiveAmount + Number(incentivo) + Number(vacacionesExtra) + Number(ppExtra);
  const totalSS = grossTotal * (0.047 + 0.016 + 0.001 + 0.0015);
  const irpfAmount = grossTotal * (irpfPercent / 100);
  const totalDeducir = totalSS + irpfAmount;
  const liquidoAPercibir = grossTotal - totalDeducir;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="bg-gradient-to-r from-indigo-700 to-blue-800 text-white p-6 rounded-2xl shadow-xl mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="bg-indigo-500/30 text-indigo-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Control Profesional</span>
            <h1 className="text-3xl font-bold mt-2 flex items-center gap-2">
              <span>Control de Horas de Natalia</span>
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </h1>
            <p className="text-indigo-200 text-sm mt-1">Fácil, intuitivo y exacto.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <button onClick={() => { if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(selectedYear - 1); } else { setSelectedMonth(selectedMonth - 1); } }} className="p-2 hover:bg-white/20 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg min-w-[140px] text-center">{monthNames[selectedMonth - 1]} {selectedYear}</span>
            <button onClick={() => { if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(selectedYear + 1); } else { setSelectedMonth(selectedMonth + 1); } }} className="p-2 hover:bg-white/20 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-6 border-t border-indigo-600/50 pt-4">
          <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'daily' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-100 hover:bg-white/10'}`}>Fichaje Diario</button>
          <button onClick={() => setActiveTab('summary')} className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'summary' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-100 hover:bg-white/10'}`}>Hacer Nómina</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'settings' ? 'bg-white text-indigo-900 shadow-md' : 'text-indigo-100 hover:bg-white/10'}`}>Precios</button>
        </div>
      </header>

      {savedMessage && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium">¡Guardado automáticamente!</span>
        </div>
      )}

      {activeTab === 'daily' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Registro - {monthNames[selectedMonth - 1]} {selectedYear}</h2>
            <div className="bg-indigo-50 px-4 py-2 rounded-xl text-indigo-700 font-semibold text-sm">Días trabajados: {totalDaysWorked}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="py-3 px-3">Día</th>
                  <th className="py-3 px-3">Normales (h)</th>
                  <th className="py-3 px-3">Precio N. (€)</th>
                  <th className="py-3 px-3">Nocturnas (h)</th>
                  <th className="py-3 px-3">Precio Noct. (€)</th>
                  <th className="py-3 px-3">Festivas (h)</th>
                  <th className="py-3 px-3">Precio Fest. (€)</th>
                  <th className="py-3 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                  const entry = getDayEntry(day);
                  const dayTotal = (entry.normalHours * entry.normalRate) + (entry.nightHours * entry.nightRate) + (entry.festiveHours * entry.festiveRate);
                  return (
                    <tr key={day} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-medium text-slate-700">
                        <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-bold ${entry.worked ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{day}</span>
                      </td>
                      <td className="py-3 px-3"><input type="number" step="0.5" value={entry.normalHours || ''} onChange={(e) => updateDayEntry(day, 'normalHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-center" /></td>
                      <td className="py-3 px-3"><input type="number" step="0.01" value={entry.normalRate} onChange={(e) => updateDayEntry(day, 'normalRate', parseFloat(e.target.value) || 0)} className="w-24 px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center" /></td>
                      <td className="py-3 px-3"><input type="number" step="0.5" value={entry.nightHours || ''} onChange={(e) => updateDayEntry(day, 'nightHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-center" /></td>
                      <td className="py-3 px-3"><input type="number" step="0.01" value={entry.nightRate} onChange={(e) => updateDayEntry(day, 'nightRate', parseFloat(e.target.value) || 0)} className="w-24 px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center" /></td>
                      <td className="py-3 px-3"><input type="number" step="0.5" value={entry.festiveHours || ''} onChange={(e) => updateDayEntry(day, 'festiveHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-center" /></td>
                      <td className="py-3 px-3"><input type="number" step="0.01" value={entry.festiveRate} onChange={(e) => updateDayEntry(day, 'festiveRate', parseFloat(e.target.value) || 0)} className="w-24 px-2.5 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center" /></td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-800">{dayTotal > 0 ? `${dayTotal.toFixed(2)} €` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'summary' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Nómina de {monthNames[selectedMonth - 1]} {selectedYear}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border"><div className="text-xs text-slate-500 font-semibold">Normales</div><div className="text-2xl font-bold">{totalNormalHours.toFixed(1)} h</div><div className="text-sm font-semibold text-indigo-600">{totalNormalAmount.toFixed(2)} €</div></div>
            <div className="bg-slate-50 p-4 rounded-xl border"><div className="text-xs text-slate-500 font-semibold">Nocturnas</div><div className="text-2xl font-bold">{totalNightHours.toFixed(1)} h</div><div className="text-sm font-semibold text-indigo-600">{totalNightAmount.toFixed(2)} €</div></div>
            <div className="bg-slate-50 p-4 rounded-xl border"><div className="text-xs text-slate-500 font-semibold">Festivas</div><div className="text-2xl font-bold">{totalFestiveHours.toFixed(1)} h</div><div className="text-sm font-semibold text-indigo-600">{totalFestiveAmount.toFixed(2)} €</div></div>
          </div>
          <div className="bg-indigo-50/50 p-4 rounded-xl border flex gap-4">
            <div><label className="text-xs font-medium text-slate-600">Incentivo</label><input type="number" value={incentivo} onChange={(e) => setIncentivo(parseFloat(e.target.value) || 0)} className="w-full bg-white px-3 py-1.5 border rounded-lg text-sm font-semibold" /></div>
            <div><label className="text-xs font-medium text-slate-600">Vacaciones</label><input type="number" value={vacacionesExtra} onChange={(e) => setVacacionesExtra(parseFloat(e.target.value) || 0)} className="w-full bg-white px-3 py-1.5 border rounded-lg text-sm font-semibold" /></div>
            <div><label className="text-xs font-medium text-slate-600">P.P. Extra</label><input type="number" value={ppExtra} onChange={(e) => setPpExtra(parseFloat(e.target.value) || 0)} className="w-full bg-white px-3 py-1.5 border rounded-lg text-sm font-semibold" /></div>
          </div>
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
            <div className="flex justify-between"><span>Total Bruto:</span><span className="font-bold">{grossTotal.toFixed(2)} €</span></div>
            <div className="flex justify-between text-xs text-slate-400"><span>- Seg. Social (~6.45%):</span><span>-{totalSS.toFixed(2)} €</span></div>
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center gap-2">- IRPF (<input type="number" value={irpfPercent} onChange={(e) => setIrpfPercent(parseFloat(e.target.value) || 0)} className="w-14 bg-slate-800 border rounded text-center text-white" />%):</span>
              <span>-{irpfAmount.toFixed(2)} €</span>
            </div>
            <div className="pt-4 border-t border-slate-700 flex justify-between items-center bg-indigo-950/50 p-4 rounded-xl">
              <span className="uppercase text-indigo-300 font-semibold">LÍQUIDO A PERCIBIR (NETO)</span>
              <span className="text-3xl font-black text-emerald-400">{liquidoAPercibir.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Precios Genéricos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="text-sm font-bold">Normal (€/h)</label><input type="number" step="0.01" value={defaultRates.normal} onChange={(e) => saveRates({ ...defaultRates, normal: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-xl font-bold" /></div>
            <div><label className="text-sm font-bold">Nocturna (€/h)</label><input type="number" step="0.01" value={defaultRates.night} onChange={(e) => saveRates({ ...defaultRates, night: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-xl font-bold" /></div>
            <div><label className="text-sm font-bold">Festiva (€/h)</label><input type="number" step="0.01" value={defaultRates.festive} onChange={(e) => saveRates({ ...defaultRates, festive: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-xl font-bold" /></div>
          </div>
        </div>
      )}
    </div>
  );
}
