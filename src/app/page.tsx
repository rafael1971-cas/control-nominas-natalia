'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Moon, Sun, Award, FileText, 
  Settings, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, Heart,
  Lock, AlertCircle, FileSpreadsheet, Eye, EyeOff, Delete
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

  // Estados de navegación: 'splash' -> 'login' -> 'app'
  const [appState, setAppState] = useState<'splash' | 'login' | 'app'>('splash');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false); // Para el ojito

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

  // ================= PORTADA (FOTO 1) =================
  if (appState === 'splash') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex flex-col items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-md p-10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col items-center text-center max-w-md w-full">
          
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 tracking-tight mb-6 drop-shadow-lg">
            Mis Nóminas
          </h1>
          
          <div className="bg-white/10 p-6 rounded-3xl mb-8 shadow-inner border border-white/5 transform hover:scale-105 transition-all">
            <FileSpreadsheet className="w-24 h-24 text-amber-400" strokeWidth={1.5} />
          </div>
          
          <div className="space-y-4 mb-10 w-full">
            <div className="bg-black/40 p-4 rounded-xl border border-white/10">
              <p className="text-amber-100/70 font-mono text-xs tracking-[0.2em] leading-relaxed">
                DISEÑO - DESARROLLO - POGRAMACION<br/>
                <span className="text-amber-400 font-bold text-sm mt-2 block">RAFAEL CASTAÑEDA RODRIGUEZ</span>
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center pt-2">
              <p className="text-white font-bold text-lg tracking-wide mb-3">
                TU ESPOSO QUE TE QUIERE
              </p>
              <Heart className="w-14 h-14 text-red-500 fill-red-500 animate-[pulse_1s_ease-in-out_infinite] drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            </div>
          </div>
          
          <button
            onClick={() => setAppState('login')}
            className="w-full bg-[#39ff14] text-black font-black py-5 px-8 rounded-full shadow-[0_0_20px_#39ff14] hover:shadow-[0_0_40px_#39ff14] border border-[#39ff14] transition-all transform hover:-translate-y-1 text-xl uppercase tracking-widest active:scale-95"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // ================= PANTALLA DE PIN (FOTO 2) =================
  if (appState === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-sm w-full border-4 border-amber-300 animate-fade-in relative">
          
          <div className="bg-amber-100 p-5 rounded-full mb-6 shadow-inner border border-amber-200">
            <Lock className="w-10 h-10 text-amber-600" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-800 mb-2">Acceso Privado</h2>
          <p className="text-slate-500 mb-8 font-medium">Introduce tu código de seguridad</p>

          <form onSubmit={handlePinSubmit} className="w-full flex flex-col items-center">
            
            <div className="relative w-full mb-2">
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value);
                  setPinError(false);
                }}
                className={`w-full text-center text-4xl tracking-[0.4em] font-black p-4 rounded-xl border-2 outline-none transition-all pr-12 ${pinError ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50 text-indigo-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-100'}`}
                placeholder="••••"
                autoFocus
              />
              
              {/* Ojito para ver contraseña */}
              <button 
                type="button" 
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
              >
                {showPin ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
              </button>
            </div>

            {/* Botón Borrar código si se equivoca */}
            <div className="w-full flex justify-end mb-2">
              <button 
                type="button" 
                onClick={() => { setPinCode(''); setPinError(false); }}
                className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1"
              >
                <Delete className="w-4 h-4" /> Borrar
              </button>
            </div>
            
            <div className={`h-6 flex items-center justify-center text-rose-500 font-bold text-sm transition-opacity ${pinError ? 'opacity-100' : 'opacity-0'}`}>
              <AlertCircle className="w-4 h-4 mr-1.5" /> Código incorrecto
            </div>

            <button
              type="submit"
              className="mt-6 w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-900 font-black py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-lg active:scale-95 uppercase tracking-wide border border-yellow-300"
            >
              Acceder
            </button>
            
            <button 
              type="button" 
              onClick={() => setAppState('splash')}
              className="mt-6 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a la portada
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= APLICACIÓN PRINCIPAL (FOTO 3) =================
  return (
    <div className="min-h-screen bg-sky-50 py-6 md:py-12 px-2 md:px-6 animate-fade-in flex flex-col items-center">
      
      {/* CAJA PRINCIPAL CON CONTORNO DORADO */}
      <div className="w-full max-w-5xl bg-white border-4 border-amber-400 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-4 md:p-8">
        
        {/* Cabecera Totalmente Centrada */}
        <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-lg mb-8 text-center border-b-4 border-amber-400">
          <div className="inline-flex items-center justify-center bg-amber-400 text-slate-900 text-xs font-black px-5 py-2 rounded-full uppercase tracking-widest mb-4 shadow-sm">
            Panel de Control
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black flex items-center justify-center gap-3 mb-8 drop-shadow-sm">
            Horas de Natalia
            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
          </h1>
          
          {/* Selector de Meses Centrado */}
          <div className="flex items-center justify-center gap-6 bg-white/10 p-2 rounded-full backdrop-blur-md mx-auto w-fit border border-white/20 shadow-inner">
            <button onClick={() => { if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(selectedYear - 1); } else { setSelectedMonth(selectedMonth - 1); } }} className="p-3 bg-white/10 hover:bg-amber-400 hover:text-slate-900 rounded-full transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="font-black text-2xl min-w-[180px] tracking-wide text-amber-300 uppercase">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <button onClick={() => { if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(selectedYear + 1); } else { setSelectedMonth(selectedMonth + 1); } }} className="p-3 bg-white/10 hover:bg-amber-400 hover:text-slate-900 rounded-full transition-all">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Botones de Pestañas Centrados y Hermosos */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          <button onClick={() => setActiveTab('daily')} className={`flex items-center gap-2 px-6 py-4 rounded-full font-black text-sm md:text-base transition-all shadow-md border-2 ${activeTab === 'daily' ? 'bg-amber-400 text-slate-900 border-amber-400 scale-105 shadow-amber-400/40' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}>
            <Calendar className="w-5 h-5" /> Fichaje Diario
          </button>
          <button onClick={() => setActiveTab('summary')} className={`flex items-center gap-2 px-6 py-4 rounded-full font-black text-sm md:text-base transition-all shadow-md border-2 ${activeTab === 'summary' ? 'bg-amber-400 text-slate-900 border-amber-400 scale-105 shadow-amber-400/40' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}>
            <FileText className="w-5 h-5" /> Hacer Nómina
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-6 py-4 rounded-full font-black text-sm md:text-base transition-all shadow-md border-2 ${activeTab === 'settings' ? 'bg-amber-400 text-slate-900 border-amber-400 scale-105 shadow-amber-400/40' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}>
            <Settings className="w-5 h-5" /> Precios Fijos
          </button>
        </div>

        {savedMessage && (
          <div className="mb-8 max-w-md mx-auto bg-emerald-100 border-2 border-emerald-400 text-emerald-800 px-6 py-4 rounded-full flex items-center justify-center gap-3 shadow-md animate-bounce">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <span className="font-bold text-emerald-900">¡Guardado en este móvil!</span>
          </div>
        )}

        {/* TAB 1: FICHAJE DIARIO */}
        {activeTab === 'daily' && (
          <div className="bg-slate-50 p-4 md:p-8 rounded-3xl border border-slate-200">
            <div className="flex flex-col md:flex-row justify-center items-center mb-8 gap-4 text-center">
              <h2 className="text-3xl font-black text-slate-800">Registro Mensual</h2>
              <div className="bg-sky-100 px-6 py-3 rounded-full text-sky-800 font-bold shadow-sm border border-sky-200">
                Días trabajados: <span className="text-2xl ml-2 text-sky-900">{totalDaysWorked}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-2xl shadow-lg border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-800 text-white text-xs uppercase tracking-widest text-center">
                    <th className="py-5 px-4 font-bold border-b border-slate-700">Día</th>
                    <th className="py-5 px-2 font-bold border-b border-slate-700">Normales</th>
                    <th className="py-5 px-2 font-bold border-b border-slate-700 text-amber-300">Precio N.</th>
                    <th className="py-5 px-2 font-bold border-b border-slate-700">Nocturnas</th>
                    <th className="py-5 px-2 font-bold border-b border-slate-700 text-amber-300">Precio Noct.</th>
                    <th className="py-5 px-2 font-bold border-b border-slate-700">Festivas</th>
                    <th className="py-5 px-2 font-bold border-b border-slate-700 text-amber-300">Precio Fest.</th>
                    <th className="py-5 px-4 font-bold border-b border-slate-700 bg-slate-900">Total Día</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                    const entry = getDayEntry(day);
                    const dayTotal = (entry.normalHours * entry.normalRate) + (entry.nightHours * entry.nightRate) + (entry.festiveHours * entry.festiveRate);
                    const isWeekend = new Date(selectedYear, selectedMonth - 1, day).getDay() === 0 || new Date(selectedYear, selectedMonth - 1, day).getDay() === 6;
                    
                    return (
                      <tr key={day} className={`hover:bg-amber-50 transition-colors text-center ${isWeekend ? 'bg-slate-50' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-3">
                            <span className={`w-10 h-10 inline-flex items-center justify-center rounded-full text-base font-black shadow-sm ${entry.worked ? 'bg-amber-400 text-slate-900 border-2 border-amber-500' : 'bg-slate-200 text-slate-500'}`}>
                              {day}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase w-8">
                              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(selectedYear, selectedMonth - 1, day).getDay()]}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2"><input type="number" step="0.5" value={entry.normalHours || ''} onChange={(e) => updateDayEntry(day, 'normalHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-3 py-2 border-2 border-slate-200 rounded-xl text-center font-black text-slate-800 focus:border-amber-400 focus:ring-0 outline-none transition-all shadow-inner" /></td>
                        <td className="py-3 px-2"><input type="number" step="0.01" value={entry.normalRate} onChange={(e) => updateDayEntry(day, 'normalRate', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 font-bold focus:border-amber-400 outline-none" /></td>
                        <td className="py-3 px-2"><input type="number" step="0.5" value={entry.nightHours || ''} onChange={(e) => updateDayEntry(day, 'nightHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-3 py-2 border-2 border-slate-200 rounded-xl text-center font-black text-slate-800 focus:border-amber-400 focus:ring-0 outline-none transition-all shadow-inner" /></td>
                        <td className="py-3 px-2"><input type="number" step="0.01" value={entry.nightRate} onChange={(e) => updateDayEntry(day, 'nightRate', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 font-bold focus:border-amber-400 outline-none" /></td>
                        <td className="py-3 px-2"><input type="number" step="0.5" value={entry.festiveHours || ''} onChange={(e) => updateDayEntry(day, 'festiveHours', parseFloat(e.target.value) || 0)} placeholder="0" className="w-20 px-3 py-2 border-2 border-slate-200 rounded-xl text-center font-black text-slate-800 focus:border-amber-400 focus:ring-0 outline-none transition-all shadow-inner" /></td>
                        <td className="py-3 px-2"><input type="number" step="0.01" value={entry.festiveRate} onChange={(e) => updateDayEntry(day, 'festiveRate', parseFloat(e.target.value) || 0)} className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 font-bold focus:border-amber-400 outline-none" /></td>
                        <td className="py-3 px-4 font-black text-slate-800 text-lg bg-slate-50/50">
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
          <div className="bg-slate-50 p-6 md:p-10 rounded-3xl border border-slate-200 space-y-8">
            <h2 className="text-4xl font-black text-center text-slate-800 mb-8 pb-6 border-b-2 border-slate-200">
              Cálculo de <span className="text-amber-500">{monthNames[selectedMonth - 1]}</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border-2 border-sky-100 shadow-md text-center">
                <div className="inline-flex items-center justify-center bg-sky-100 p-4 rounded-full mb-4">
                  <Sun className="w-8 h-8 text-sky-600" />
                </div>
                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Normales</div>
                <div className="text-4xl font-black text-slate-800">{totalNormalHours.toFixed(1)} <span className="text-xl text-slate-400">h</span></div>
                <div className="text-xl font-black text-sky-600 mt-3">{totalNormalAmount.toFixed(2)} €</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border-2 border-indigo-100 shadow-md text-center">
                <div className="inline-flex items-center justify-center bg-indigo-100 p-4 rounded-full mb-4">
                  <Moon className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Nocturnas</div>
                <div className="text-4xl font-black text-slate-800">{totalNightHours.toFixed(1)} <span className="text-xl text-slate-400">h</span></div>
                <div className="text-xl font-black text-indigo-600 mt-3">{totalNightAmount.toFixed(2)} €</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border-2 border-purple-100 shadow-md text-center">
                <div className="inline-flex items-center justify-center bg-purple-100 p-4 rounded-full mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Festivas</div>
                <div className="text-4xl font-black text-slate-800">{totalFestiveHours.toFixed(1)} <span className="text-xl text-slate-400">h</span></div>
                <div className="text-xl font-black text-purple-600 mt-3">{totalFestiveAmount.toFixed(2)} €</div>
              </div>
            </div>

            <div className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200 shadow-sm mt-8">
              <h3 className="text-center font-black text-amber-900 mb-6 uppercase tracking-widest">Extras generados (por {totalDaysWorked} días)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">Incentivo</div>
                  <div className="text-2xl font-black text-slate-800">{totalIncentivo.toFixed(2)} €</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">Vacaciones</div>
                  <div className="text-2xl font-black text-slate-800">{totalVacaciones.toFixed(2)} €</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-2">P.P. Extra</div>
                  <div className="text-2xl font-black text-slate-800">{totalPPExtra.toFixed(2)} €</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden mt-8 border-4 border-slate-800">
              <div className="relative z-10 space-y-5">
                <div className="flex justify-between items-end border-b-2 border-slate-700 pb-5">
                  <span className="text-xl text-slate-300 font-bold">TOTAL BRUTO:</span>
                  <span className="text-4xl font-black text-amber-400">{grossTotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center py-2 text-slate-300 font-medium text-lg">
                  <span>Seguridad Social (~6.45%):</span>
                  <span className="text-rose-400 font-bold">-{totalSS.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center py-2 text-slate-300 font-medium text-lg">
                  <span className="flex items-center gap-3">
                    Retención IRPF ( 
                    <input type="number" step="0.1" value={irpfPercent} onChange={(e) => setIrpfPercent(parseFloat(e.target.value) || 0)} className="w-20 bg-slate-800 border-2 border-slate-600 rounded-xl px-2 py-1 text-center text-white font-black focus:border-amber-400 outline-none" />
                    % )
                  </span>
                  <span className="text-rose-400 font-bold">-{irpfAmount.toFixed(2)} €</span>
                </div>
                <div className="mt-10 pt-8 border-t-2 border-slate-700">
                  <div className="flex flex-col items-center bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-3xl shadow-lg border-2 border-emerald-400 text-center transform scale-105">
                    <span className="uppercase text-emerald-100 font-black tracking-widest text-lg mb-2 text-shadow">NETO A COBRAR</span>
                    <span className="text-6xl md:text-7xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)]">{liquidoAPercibir.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURACIÓN DE PRECIOS */}
        {activeTab === 'settings' && (
          <div className="bg-slate-50 p-6 md:p-10 rounded-3xl border border-slate-200 space-y-12">
            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-8 text-center border-b-2 border-slate-200 pb-6">Precios por Hora</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Normal (€/h)</label>
                  <input type="number" step="0.01" value={defaultRates.normal} onChange={(e) => saveRates({ ...defaultRates, normal: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl font-black text-3xl text-slate-800 text-center focus:border-amber-400 outline-none shadow-inner" />
                </div>
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Nocturna (€/h)</label>
                  <input type="number" step="0.01" value={defaultRates.night} onChange={(e) => saveRates({ ...defaultRates, night: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl font-black text-3xl text-slate-800 text-center focus:border-amber-400 outline-none shadow-inner" />
                </div>
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Festiva (€/h)</label>
                  <input type="number" step="0.01" value={defaultRates.festive} onChange={(e) => saveRates({ ...defaultRates, festive: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl font-black text-3xl text-slate-800 text-center focus:border-amber-400 outline-none shadow-inner" />
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-8 text-center border-b-2 border-slate-200 pb-6">Conceptos por Día Trabajado</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-amber-700 uppercase tracking-widest mb-4">Incentivo (€/día)</label>
                  <input type="number" step="0.001" value={defaultRates.incentivoDia} onChange={(e) => saveRates({ ...defaultRates, incentivoDia: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-amber-300 rounded-2xl font-black text-3xl text-amber-900 text-center focus:border-amber-500 outline-none shadow-inner bg-white" />
                </div>
                <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-amber-700 uppercase tracking-widest mb-4">Vacaciones (€/día)</label>
                  <input type="number" step="0.001" value={defaultRates.vacacionesDia} onChange={(e) => saveRates({ ...defaultRates, vacacionesDia: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-amber-300 rounded-2xl font-black text-3xl text-amber-900 text-center focus:border-amber-500 outline-none shadow-inner bg-white" />
                </div>
                <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-amber-700 uppercase tracking-widest mb-4">P.P. Extra (€/día)</label>
                  <input type="number" step="0.001" value={defaultRates.ppExtraDia} onChange={(e) => saveRates({ ...defaultRates, ppExtraDia: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-amber-300 rounded-2xl font-black text-3xl text-amber-900 text-center focus:border-amber-500 outline-none shadow-inner bg-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
