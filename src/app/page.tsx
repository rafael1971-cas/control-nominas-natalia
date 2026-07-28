'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Moon, Sun, Award, FileText, 
  Settings, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, Heart,
  Lock, AlertCircle
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

  // Estados de navegación: 'splash' (portada) -> 'login' (PIN) -> 'app' (aplicación)
  const [appState, setAppState] = useState<'splash' | 'login' | 'app'>('splash');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);

  const [defaultRates, setDefaultRates] = useState({
    normal: 11.70,
    night: 12.50,
    festive: 17.90,
    incentivoDia: 0.948,
    vacacionesDia: 4.569,
    ppExtraDia: 9.1575,
  });

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

  // Lógica del PIN
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode === '8696') {
      setAppState('app');
      setPinError(false);
      setPinCode('');
    } else {
      setPinError(true);
      setPinCode('');
    }
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

  const totalIncentivo = totalDaysWorked * defaultRates.incentivoDia;
  const totalVacaciones = totalDaysWorked * defaultRates.vacacionesDia;
  const totalPPExtra = totalDaysWorked * defaultRates.ppExtraDia;

  const grossTotal = totalNormalAmount + totalNightAmount + totalFestiveAmount + totalIncentivo + totalVacaciones + totalPPExtra;
  const totalSS = grossTotal * (0.047 + 0.016 + 0.001 + 0.0015);
  const irpfAmount = grossTotal * (irpfPercent / 100);
  const totalDeducir = totalSS + irpfAmount;
  const liquidoAPercibir = grossTotal - totalDeducir;

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // ================= PORTADA =================
  if (appState === 'splash') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-md w-full border border-indigo-50">
          <div className="bg-indigo-100 p-6 rounded-full mb-8 shadow-inner">
            <FileText className="w-24 h-24 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Mis Nóminas</h1>
          <h2 className="text-2xl font-bold text-indigo-600 mb-8 uppercase tracking-widest">Natalia</h2>
          
          <div className="bg-gradient-to-r from-pink-50 to-red-50 p-6 rounded-2xl mb-10 w-full border border-pink-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-slate-700 font-bold text-lg leading-relaxed">
                Diseño-desarrollo-pogramacion<br/>con mucho AMOR<br/>tu esposo
              </p>
              <div className="mt-4 flex justify-center">
                <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-pulse drop-shadow-md" />
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setAppState('login')}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg active:scale-95"
          >
            Entrar a la Aplicación
          </button>
        </div>
      </div>
    );
  }

  // ================= PANTALLA DE PIN =================
  if (appState === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-sm w-full border border-indigo-50 animate-fade-in">
          <div className="bg-indigo-100 p-5 rounded-full mb-6 shadow-inner">
            <Lock className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Acceso Privado</h2>
          <p className="text-slate-500 mb-8 text-sm">Introduce tu código de seguridad</p>

          <form onSubmit={handlePinSubmit} className="w-full flex flex-col items-center">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinCode}
              onChange={(e) => {
                setPinCode(e.target.value);
                setPinError(false);
              }}
              className={`w-full text-center text-4xl tracking-[0.5em] font-black p-4 rounded-xl border-2 outline-none transition-all ${pinError ? 'border-red-400 bg-red-50 text-red-700' : 'border-indigo-100 bg-slate-50 text-indigo-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50'}`}
              placeholder="••••"
              autoFocus
            />
            
            <div className={`mt-4 h-6 flex items-center justify-center text-red-500 font-bold text-sm transition-opacity ${pinError ? 'opacity-100' : 'opacity-0'}`}>
              <AlertCircle className="w-4 h-4 mr-1.5" /> Código incorrecto
            </div>

            <button
              type="submit"
              className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
            >
              Desbloquear
            </button>
            
            <button 
              type="button" 
              onClick={() => setAppState('splash')}
              className="mt-4 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Volver atrás
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= APLICACIÓN PRINCIPAL =================
  return (
    <div className="min-h-screen bg-slate-50 pb-12 animate-fade-in">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        
        {/* Cabecera Centrada y Moderna */}
        <header className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 text-white p-8 rounded-[2rem] shadow-2xl mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-indigo-50 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 border border-white/20">
              Control Profesional
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black flex items-center justify-center gap-3 mb-6">
              Control de Horas de Natalia
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </h1>
            
            {/* Selector de Meses Centrado y Moderno */}
            <div className="flex items-center justify-center gap-4 bg-black/20 p-2 rounded-full backdrop-blur-md mx-auto w-fit border border-white/10 shadow-inner">
              <button onClick={() => { if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(selectedYear - 1); } else { setSelectedMonth(selectedMonth - 1); } }} className="p-3 hover:bg-white/20 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="font-bold text-xl min-w-[160px] tracking-wide">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
              <button onClick={() => { if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(selectedYear + 1); } else { setSelectedMonth(selectedMonth + 1); } }} className="p-3 hover:bg-white/20 rounded-full transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Botones de Pestañas Centrados y Llamativos */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button onClick={() => setActiveTab('daily')} className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-md ${activeTab === 'daily' ? 'bg-indigo-600 text-white scale-105 shadow-indigo-600/30' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}>
            <Calendar className="w-5 h-5" /> Fichaje Diario
          </button>
          <button onClick={() => setActiveTab('summary')} className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-md ${activeTab === 'summary' ? 'bg-indigo-600 text-white scale-105 shadow-indigo-600/30' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}>
            <FileText className="w-5 h-5" /> Hacer Nómina
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-md ${activeTab === 'settings' ? 'bg-indigo-600 text-white scale-105 shadow-indigo-600/30' : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'}`}>
            <Settings className="w-5 h-5" /> Precios Fijos
          </button>
        </div>

        {savedMessage && (
          <div className="mb-6 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 px-6 py-4 rounded-r-xl flex items-center gap-3 shadow-sm animate-bounce">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-emerald-900">¡Guardado automáticamente en este móvil!</span>
          </div>
        )}

        {/* TAB 1: FICHAJE DIARIO */}
        {activeTab === 'daily' && (
          <div className="bg-white p-4 md:p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 text-center md:text-left">
              <h2 className="text-2xl font-black text-slate-800">Registro Mensual</h2>
              <div className="bg-indigo-100 px-6 py-3 rounded-full text-indigo-800 font-bold shadow-inner">
                Días trabajados: <span className="text-xl ml-2">{totalDaysWorked}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
                    <th className="py-4 px-4 font-bold border-b border-slate-200 rounded-tl-xl">Día</th>
                    <th className="py-4 px-4 font-bold border-b border-slate-200 text-center">Normales (h)</th>
                    <th className="py-4 px-4 font-bold border-b border-slate-200 text-center">Precio N.</th>
                    <th className="py-4 px-4 font-bold border-b border-slate-200 text-center">Nocturnas (h)</th>
                    <th className="py-4 px-4 font-bold border-b border-slate-200 text-center">Precio Noct.</th>
                    <th className="py-4 px-4 font-bold border-b border-slate-200 text-center">Festivas (h)</th>
                    <th className="py-4 px-4 font-bold border-b border-slate-200 text-center">Precio Fest.</th>
                    <th className="py-4 px-4 font-bold border-b border-slate-200 text-right rounded-tr-xl">Total Día</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                    const entry = getDayEntry(day);
                    const dayTotal = (entry.normalHours * entry.normalRate) + (entry.nightHours * entry.nightRate) + (entry.festiveHours * entry.festiveRate);
                    const isWeekend = new Date(selectedYear, selectedMonth - 1, day).getDay() === 0 || new Date(selectedYear, selectedMonth - 1, day).getDay() === 6;
                    
                    return (
                      <tr key={day} className={`hover:bg-indigo-50/50 transition-colors ${isWeekend ? 'bg-slate-50/80' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 inline-flex items-center justify-center rounded-full text-sm font-bold shadow-sm ${entry.worked ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {day}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase w-8">
                              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(selectedYear, selectedMonth - 1, day).getDay()]}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center"><input type="number" step="0.5" value={entry.normalHours || ''} onChange={(e) => updateDayEntry(day, 'normalHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner" /></td>
                        <td className="py-3 px-2 text-center"><input type="number" step="0.01" value={entry.normalRate} onChange={(e) => updateDayEntry(day, 'normalRate', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-center text-slate-500 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" /></td>
                        <td className="py-3 px-2 text-center"><input type="number" step="0.5" value={entry.nightHours || ''} onChange={(e) => updateDayEntry(day, 'nightHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner" /></td>
                        <td className="py-3 px-2 text-center"><input type="number" step="0.01" value={entry.nightRate} onChange={(e) => updateDayEntry(day, 'nightRate', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-center text-slate-500 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" /></td>
                        <td className="py-3 px-2 text-center"><input type="number" step="0.5" value={entry.festiveHours || ''} onChange={(e) => updateDayEntry(day, 'festiveHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner" /></td>
                        <td className="py-3 px-2 text-center"><input type="number" step="0.01" value={entry.festiveRate} onChange={(e) => updateDayEntry(day, 'festiveRate', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-center text-slate-500 font-medium focus:ring-2 focus:ring-indigo-500 outline-none" /></td>
                        <td className="py-3 px-4 text-right font-black text-indigo-700 text-lg">
                          {dayTotal > 0 ? `${dayTotal.toFixed(2)} €` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: RESUMEN DE NÓMINA */}
        {activeTab === 'summary' && (
          <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 space-y-8 animate-fade-in">
            <h2 className="text-3xl font-black text-center text-slate-800 mb-8 border-b border-slate-100 pb-6">Resultado de {monthNames[selectedMonth - 1]}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-3xl border border-slate-200 shadow-sm text-center transform transition hover:scale-105">
                <div className="inline-flex items-center justify-center bg-amber-100 p-3 rounded-full mb-4">
                  <Sun className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Normales</div>
                <div className="text-3xl font-black text-slate-800">{totalNormalHours.toFixed(1)} <span className="text-lg text-slate-400 font-medium">h</span></div>
                <div className="text-lg font-bold text-amber-600 mt-2 bg-amber-50 rounded-full py-1">{totalNormalAmount.toFixed(2)} €</div>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-3xl border border-slate-200 shadow-sm text-center transform transition hover:scale-105">
                <div className="inline-flex items-center justify-center bg-indigo-100 p-3 rounded-full mb-4">
                  <Moon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Nocturnas</div>
                <div className="text-3xl font-black text-slate-800">{totalNightHours.toFixed(1)} <span className="text-lg text-slate-400 font-medium">h</span></div>
                <div className="text-lg font-bold text-indigo-600 mt-2 bg-indigo-50 rounded-full py-1">{totalNightAmount.toFixed(2)} €</div>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-3xl border border-slate-200 shadow-sm text-center transform transition hover:scale-105">
                <div className="inline-flex items-center justify-center bg-purple-100 p-3 rounded-full mb-4">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Festivas</div>
                <div className="text-3xl font-black text-slate-800">{totalFestiveHours.toFixed(1)} <span className="text-lg text-slate-400 font-medium">h</span></div>
                <div className="text-lg font-bold text-purple-600 mt-2 bg-purple-50 rounded-full py-1">{totalFestiveAmount.toFixed(2)} €</div>
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-inner">
              <h3 className="text-center font-black text-indigo-900 mb-6 uppercase tracking-widest text-sm">Extras acumulados por los {totalDaysWorked} días trabajados</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Incentivo</div>
                  <div className="text-2xl font-black text-slate-700">{totalIncentivo.toFixed(2)} €</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Vacaciones</div>
                  <div className="text-2xl font-black text-slate-700">{totalVacaciones.toFixed(2)} €</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">P.P. Extra</div>
                  <div className="text-2xl font-black text-slate-700">{totalPPExtra.toFixed(2)} €</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <FileText className="w-40 h-40" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex justify-between items-end border-b border-slate-700 pb-4">
                  <span className="text-lg text-slate-300 font-medium">Total Bruto Sumado:</span>
                  <span className="text-3xl font-black">{grossTotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center py-2 text-slate-400 font-medium">
                  <span>- Descuento Seg. Social (~6.45%):</span>
                  <span className="text-rose-400 font-bold">-{totalSS.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center py-2 text-slate-400 font-medium">
                  <span className="flex items-center gap-3">
                    - Retención IRPF ( 
                    <input type="number" step="0.1" value={irpfPercent} onChange={(e) => setIrpfPercent(parseFloat(e.target.value) || 0)} className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-center text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                    % )
                  </span>
                  <span className="text-rose-400 font-bold">-{irpfAmount.toFixed(2)} €</span>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-700">
                  <div className="flex flex-col items-center bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 rounded-3xl border border-emerald-700/50 shadow-inner text-center">
                    <span className="uppercase text-emerald-300 font-bold tracking-widest text-sm mb-2">Líquido a Percibir (Neto)</span>
                    <span className="text-5xl md:text-6xl font-black text-emerald-400 drop-shadow-md">{liquidoAPercibir.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURACIÓN DE PRECIOS */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-slate-100 space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-8 h-8 text-indigo-600" />
                <h2 className="text-2xl font-black text-slate-800">Precios por Hora</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Normal (€/h)</label>
                  <input type="number" step="0.01" value={defaultRates.normal} onChange={(e) => saveRates({ ...defaultRates, normal: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-3 border border-slate-300 rounded-xl font-black text-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner" />
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Nocturna (€/h)</label>
                  <input type="number" step="0.01" value={defaultRates.night} onChange={(e) => saveRates({ ...defaultRates, night: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-3 border border-slate-300 rounded-xl font-black text-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner" />
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Festiva (€/h)</label>
                  <input type="number" step="0.01" value={defaultRates.festive} onChange={(e) => saveRates({ ...defaultRates, festive: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-3 border border-slate-300 rounded-xl font-black text-xl text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner" />
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 mb-6">Conceptos por Día Trabajado</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                  <label className="block text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">Incentivo (€/día)</label>
                  <input type="number" step="0.001" value={defaultRates.incentivoDia} onChange={(e) => saveRates({ ...defaultRates, incentivoDia: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-3 border border-indigo-200 rounded-xl font-black text-xl text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner" />
                </div>
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                  <label className="block text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">Vacaciones (€/día)</label>
                  <input type="number" step="0.001" value={defaultRates.vacacionesDia} onChange={(e) => saveRates({ ...defaultRates, vacacionesDia: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-3 border border-indigo-200 rounded-xl font-black text-xl text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner" />
                </div>
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                  <label className="block text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">P.P. Extra (€/día)</label>
                  <input type="number" step="0.001" value={defaultRates.ppExtraDia} onChange={(e) => saveRates({ ...defaultRates, ppExtraDia: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-3 border border-indigo-200 rounded-xl font-black text-xl text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
