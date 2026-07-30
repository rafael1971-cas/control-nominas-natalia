'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Moon, Sun, Award, FileText, 
  Settings, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, Heart,
  Lock, AlertCircle, FileSpreadsheet, Eye, EyeOff, Delete, Calculator, Clock,
  Scale
} from 'lucide-react';

interface DayEntry {
  horasBase: number;
  plusNocturno: number;
  horasExtras: number;
  extrasNocturnas: number;
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

  const [appState, setAppState] = useState<'splash' | 'login' | 'app'>('splash');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // PRECIOS EXACTOS EXTRAÍDOS DE LA NÓMINA DE JUNIO
  const [defaultRates, setDefaultRates] = useState({
    salarioBase: 9.1133,
    vacaciones: 0.8270,
    ppExtra: 1.6575,
    plusNocturnidad: 2.4900,
    precioExtra: 18.0600,
  });

  const [incentivoMensual, setIncentivoMensual] = useState<number>(0);
  const [irpfPercent, setIrpfPercent] = useState<number>(2.0);
  const [allData, setAllData] = useState<AllMonthsData>({});
  
  // NUEVO: Estado para guardar lo que pone en el papel físico cada mes
  const [nominasFisicas, setNominasFisicas] = useState<Record<string, number>>({});

  const [activeTab, setActiveTab] = useState<'daily' | 'summary' | 'settings'>('daily');
  const [savedMessage, setSavedMessage] = useState<boolean>(false);

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  useEffect(() => {
    const saved = localStorage.getItem('hcsl_payroll_data_v2');
    if (saved) {
      try { setAllData(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedRates = localStorage.getItem('hcsl_payroll_rates_v2');
    if (savedRates) {
      try { setDefaultRates(JSON.parse(savedRates)); } catch (e) { console.error(e); }
    }
    const savedFisicas = localStorage.getItem('hcsl_payroll_fisicas_v2');
    if (savedFisicas) {
      try { setNominasFisicas(JSON.parse(savedFisicas)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveData = (newData: AllMonthsData) => {
    setAllData(newData);
    localStorage.setItem('hcsl_payroll_data_v2', JSON.stringify(newData));
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const saveRates = (newRates: typeof defaultRates) => {
    setDefaultRates(newRates);
    localStorage.setItem('hcsl_payroll_rates_v2', JSON.stringify(newRates));
  };

  const handleNominaFisicaChange = (value: number) => {
    const newFisicas = { ...nominasFisicas, [monthKey]: value };
    setNominasFisicas(newFisicas);
    localStorage.setItem('hcsl_payroll_fisicas_v2', JSON.stringify(newFisicas));
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const daysInCurrentMonth = getDaysInMonth(selectedYear, selectedMonth);
  const currentMonthData: MonthData = allData[monthKey] || {};

  const getDayEntry = (day: number): DayEntry => {
    const dayStr = String(day);
    if (currentMonthData[dayStr]) return currentMonthData[dayStr];
    return {
      horasBase: 0,
      plusNocturno: 0,
      horasExtras: 0,
      extrasNocturnas: 0,
      worked: false,
    };
  };

  const updateDayEntry = (day: number, field: keyof DayEntry, value: any) => {
    const dayStr = String(day);
    const existing = getDayEntry(day);
    const updatedDay = { ...existing, [field]: value };
    if (Number(value) > 0) {
      updatedDay.worked = true;
    }
    saveData({ ...allData, [monthKey]: { ...currentMonthData, [dayStr]: updatedDay } });
  };

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

  // ================= MOTOR MATEMÁTICO PERFECTO =================
  let totalDaysWorked = 0;
  let totalHorasBase = 0;
  let totalPlusNocturno = 0;
  let totalExtras = 0;
  let totalExtrasNocturnas = 0;

  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const entry = getDayEntry(d);
    if (entry.worked || entry.horasBase > 0 || entry.plusNocturno > 0 || entry.horasExtras > 0 || entry.extrasNocturnas > 0) {
      totalDaysWorked++;
      totalHorasBase += Number(entry.horasBase) || 0;
      totalPlusNocturno += Number(entry.plusNocturno) || 0;
      totalExtras += Number(entry.horasExtras) || 0;
      totalExtrasNocturnas += Number(entry.extrasNocturnas) || 0;
    }
  }

  const round2 = (num: number) => Math.round(num * 100) / 100;

  const salarioBaseAmount = round2(totalHorasBase * defaultRates.salarioBase);
  const vacacionesAmount = round2(totalHorasBase * defaultRates.vacaciones);
  const ppExtraAmount = round2(totalHorasBase * defaultRates.ppExtra);
  
  const nocturnidadPura = round2(totalPlusNocturno * defaultRates.plusNocturnidad);
  const nocturnidadDeLasExtras = round2(totalExtrasNocturnas * defaultRates.plusNocturnidad);
  const nocturnidadTotalAmount = round2(nocturnidadPura + nocturnidadDeLasExtras);
  
  const extrasDiaAmount = round2(totalExtras * defaultRates.precioExtra);
  const extrasNocheBaseAmount = round2(totalExtrasNocturnas * defaultRates.precioExtra);
  const totalDineroExtrasParaSS = round2(extrasDiaAmount + extrasNocheBaseAmount);

  const grossTotal = round2(salarioBaseAmount + vacacionesAmount + ppExtraAmount + nocturnidadTotalAmount + totalDineroExtrasParaSS + Number(incentivoMensual));

  const baseSS = round2(grossTotal - totalDineroExtrasParaSS); 
  const baseDesempleo = grossTotal; 

  const cc = round2(baseSS * 0.047);
  const mei = round2(baseSS * 0.0015);
  const desempleo = round2(baseDesempleo * 0.016);
  const fp = round2(baseDesempleo * 0.001);
  const heSS = round2(totalDineroExtrasParaSS * 0.047); 

  const irpf = round2(grossTotal * (irpfPercent / 100));

  const totalSS = round2(cc + mei + desempleo + fp + heSS);
  const totalDeducir = round2(totalSS + irpf);
  const liquidoAPercibir = round2(grossTotal - totalDeducir);

  const precioHoraBaseTotal = round2(defaultRates.salarioBase + defaultRates.vacaciones + defaultRates.ppExtra);
  const precioExtraNoche = round2(defaultRates.precioExtra + defaultRates.plusNocturnidad);

  // LOGICA DEL VERIFICADOR
  const nominaPapel = nominasFisicas[monthKey] || 0;
  const diferenciaNomina = round2(liquidoAPercibir - nominaPapel);
  const diferenciaAbsoluta = Math.abs(diferenciaNomina);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // ================= PORTADA =================
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
                DISEÑO - DESARROLLO - PROGRAMACION<br/>
                <span className="text-amber-400 font-bold text-sm mt-2 block">RAFAEL CASTAÑEDA RODRIGUEZ</span>
              </p>
            </div>
            <div className="flex flex-col items-center justify-center pt-2">
              <p className="text-white font-bold text-lg tracking-wide mb-3">TU ESPOSO QUE TE QUIERE</p>
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

  // ================= PANTALLA DE PIN =================
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
              <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1">
                {showPin ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
              </button>
            </div>
            <div className="w-full flex justify-end mb-2">
              <button type="button" onClick={() => { setPinCode(''); setPinError(false); }} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1">
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
            <button type="button" onClick={() => setAppState('splash')} className="mt-6 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" /> Volver a la portada
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= APLICACIÓN PRINCIPAL =================
  return (
    <div className="min-h-screen bg-sky-50 py-6 md:py-12 px-2 md:px-6 animate-fade-in flex flex-col items-center">
      <div className="w-full max-w-5xl bg-white border-4 border-amber-400 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-4 md:p-8">
        
        <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-3xl shadow-lg mb-8 text-center border-b-4 border-amber-400">
          <div className="inline-flex items-center justify-center bg-amber-400 text-slate-900 text-xs font-black px-5 py-2 rounded-full uppercase tracking-widest mb-4 shadow-sm">
            Panel de Control
          </div>
          <h1 className="text-3xl md:text-5xl font-black flex items-center justify-center gap-3 mb-8 drop-shadow-sm">
            Horas de Natalia
            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
          </h1>
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
                    <th className="py-5 px-3 font-bold border-b border-slate-700">Día</th>
                    <th className="py-5 px-3 font-bold border-b border-slate-700 text-sky-300">Total Turno (h)</th>
                    <th className="py-5 px-3 font-bold border-b border-slate-700 text-indigo-300">Plus Noct. (h)</th>
                    <th className="py-5 px-3 font-bold border-b border-slate-700 text-purple-300">Ext. Día</th>
                    <th className="py-5 px-3 font-bold border-b border-slate-700 text-fuchsia-300">Ext. Noche</th>
                    <th className="py-5 px-4 font-bold border-b border-slate-700 bg-slate-900 text-amber-400">Total Día</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((day) => {
                    const entry = getDayEntry(day);
                    
                    const hBase = Number(entry.horasBase) || 0;
                    const hNoct = Number(entry.plusNocturno) || 0;
                    const hExtrDia = Number(entry.horasExtras) || 0;
                    const hExtrNoche = Number(entry.extrasNocturnas) || 0;
                    
                    const diaBase = hBase * precioHoraBaseTotal;
                    const diaNoct = hNoct * defaultRates.plusNocturnidad;
                    const diaExtrDia = hExtrDia * defaultRates.precioExtra;
                    const diaExtrNoche = hExtrNoche * precioExtraNoche;
                    
                    const dayTotal = diaBase + diaNoct + diaExtrDia + diaExtrNoche;
                    const isWeekend = new Date(selectedYear, selectedMonth - 1, day).getDay() === 0 || new Date(selectedYear, selectedMonth - 1, day).getDay() === 6;
                    
                    return (
                      <tr key={day} className={`hover:bg-amber-50 transition-colors text-center ${isWeekend ? 'bg-slate-50' : ''}`}>
                        <td className="py-4 px-3">
                          <div className="flex items-center justify-center gap-3">
                            <span className={`w-10 h-10 inline-flex items-center justify-center rounded-full text-base font-black shadow-sm ${entry.worked ? 'bg-amber-400 text-slate-900 border-2 border-amber-500' : 'bg-slate-200 text-slate-500'}`}>
                              {day}
                            </span>
                            <span className="text-xs font-bold text-slate-400 uppercase w-8">
                              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][new Date(selectedYear, selectedMonth - 1, day).getDay()]}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2"><input type="number" step="0.5" value={entry.horasBase || ''} onChange={(e) => updateDayEntry(day, 'horasBase', parseFloat(e.target.value) || 0)} placeholder="0" className="w-16 md:w-20 px-2 py-3 border-2 border-slate-200 rounded-xl text-center font-black text-slate-800 focus:border-amber-400 focus:ring-0 outline-none transition-all shadow-inner" /></td>
                        <td className="py-4 px-2"><input type="number" step="0.5" value={entry.plusNocturno || ''} onChange={(e) => updateDayEntry(day, 'plusNocturno', parseFloat(e.target.value) || 0)} placeholder="0" className="w-16 md:w-20 px-2 py-3 border-2 border-slate-200 rounded-xl text-center font-black text-slate-800 focus:border-amber-400 focus:ring-0 outline-none transition-all shadow-inner" /></td>
                        <td className="py-4 px-2"><input type="number" step="0.5" value={entry.horasExtras || ''} onChange={(e) => updateDayEntry(day, 'horasExtras', parseFloat(e.target.value) || 0)} placeholder="0" className="w-16 md:w-20 px-2 py-3 border-2 border-slate-200 rounded-xl text-center font-black text-slate-800 focus:border-amber-400 focus:ring-0 outline-none transition-all shadow-inner" /></td>
                        <td className="py-4 px-2"><input type="number" step="0.5" value={entry.extrasNocturnas || ''} onChange={(e) => updateDayEntry(day, 'extrasNocturnas', parseFloat(e.target.value) || 0)} placeholder="0" className="w-16 md:w-20 px-2 py-3 border-2 border-slate-200 rounded-xl text-center font-black text-slate-800 focus:border-amber-400 focus:ring-0 outline-none transition-all shadow-inner" /></td>
                        <td className="py-4 px-4 font-black text-slate-800 text-xl bg-slate-50/50">
                          {dayTotal > 0 ? `${dayTotal.toFixed(2)} €` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 bg-sky-100/50 border border-sky-200 rounded-2xl p-4 text-sm text-sky-900">
              <span className="font-bold block mb-1">💡 ¿Cómo rellenar las horas?</span>
              Si trabajas 8 horas y 2 caen de madrugada: Escribe <b>8</b> en "Total Turno" y <b>2</b> en "Plus Noct.". 
            </div>
          </div>
        )}

        {/* TAB 2: RESUMEN EXACTO CON COMPROBADOR */}
        {activeTab === 'summary' && (
          <div className="bg-slate-50 p-6 md:p-10 rounded-3xl border border-slate-200 space-y-8">
            <h2 className="text-4xl font-black text-center text-slate-800 mb-8 pb-6 border-b-2 border-slate-200">
              Nómina Exacta de <span className="text-amber-500">{monthNames[selectedMonth - 1]}</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <div className="bg-white p-4 rounded-2xl border-2 border-sky-100 shadow-sm text-center">
                <Sun className="w-6 h-6 text-sky-500 mx-auto mb-2" />
                <div className="text-xs text-slate-400 font-bold uppercase">Total Turno</div>
                <div className="text-2xl font-black text-slate-800">{totalHorasBase.toFixed(1)}h</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-indigo-100 shadow-sm text-center">
                <Moon className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                <div className="text-xs text-slate-400 font-bold uppercase">Plus Noct.</div>
                <div className="text-2xl font-black text-slate-800">{totalPlusNocturno.toFixed(1)}h</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-purple-100 shadow-sm text-center">
                <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-xs text-slate-400 font-bold uppercase">Ext. Día</div>
                <div className="text-2xl font-black text-slate-800">{totalExtras.toFixed(1)}h</div>
              </div>
              <div className="bg-white p-4 rounded-2xl border-2 border-fuchsia-100 shadow-sm text-center">
                <Award className="w-6 h-6 text-fuchsia-500 mx-auto mb-2" />
                <div className="text-xs text-slate-400 font-bold uppercase">Ext. Noche</div>
                <div className="text-2xl font-black text-slate-800">{totalExtrasNocturnas.toFixed(1)}h</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2"><Calculator className="w-6 h-6 text-amber-500"/> Desglose Económico</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                  <div className="text-xs font-bold text-slate-500 uppercase">Salario Base</div>
                  <div className="text-2xl font-black text-slate-800">{salarioBaseAmount.toFixed(2)} €</div>
                </div>
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                  <div className="text-xs font-bold text-slate-500 uppercase">Vacaciones</div>
                  <div className="text-2xl font-black text-slate-800">{vacacionesAmount.toFixed(2)} €</div>
                </div>
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
                  <div className="text-xs font-bold text-slate-500 uppercase">P.P. Extra</div>
                  <div className="text-2xl font-black text-slate-800">{ppExtraAmount.toFixed(2)} €</div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <div className="text-xs font-bold text-slate-500 uppercase">Total Nocturnidad</div>
                  <div className="text-2xl font-black text-slate-800">{nocturnidadTotalAmount.toFixed(2)} €</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <div className="text-xs font-bold text-slate-500 uppercase">Total H. Extras</div>
                  <div className="text-2xl font-black text-slate-800">{totalDineroExtrasParaSS.toFixed(2)} €</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 shadow-inner flex flex-col justify-center">
                  <div className="text-xs font-bold text-amber-700 uppercase mb-1">Incentivo Manual (Si hay)</div>
                  <input type="number" step="0.01" value={incentivoMensual || ''} onChange={(e) => setIncentivoMensual(parseFloat(e.target.value) || 0)} placeholder="0.00" className="w-full bg-white border-2 border-amber-300 rounded-lg px-2 py-1 font-black text-xl text-slate-800 focus:outline-none focus:border-amber-500 text-center" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[2rem] shadow-2xl relative overflow-hidden mt-8 border-4 border-slate-800">
              <div className="relative z-10 space-y-5">
                <div className="flex justify-between items-end border-b-2 border-slate-700 pb-5">
                  <span className="text-xl text-slate-300 font-bold">TOTAL BRUTO:</span>
                  <span className="text-4xl font-black text-amber-400">{grossTotal.toFixed(2)} €</span>
                </div>
                
                <div className="py-4 space-y-2 border-b border-slate-700/50">
                  <span className="text-sm text-slate-500 font-bold uppercase tracking-widest block mb-2">Desglose Seguridad Social</span>
                  <div className="flex justify-between text-slate-400 font-medium text-sm"><span>Contingencias Comunes (4.70%):</span><span>-{cc.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-slate-400 font-medium text-sm"><span>Desempleo (1.60%):</span><span>-{desempleo.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-slate-400 font-medium text-sm"><span>Formación Prof. (0.10%):</span><span>-{fp.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-slate-400 font-medium text-sm"><span>H. Extras (4.70%):</span><span>-{heSS.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-slate-400 font-medium text-sm"><span>Mecanismo Equidad (0.15%):</span><span>-{mei.toFixed(2)} €</span></div>
                </div>

                <div className="flex justify-between items-center py-4 text-slate-300 font-medium text-lg">
                  <span className="flex items-center gap-3">
                    Retención IRPF ( 
                    <input type="number" step="0.1" value={irpfPercent} onChange={(e) => setIrpfPercent(parseFloat(e.target.value) || 0)} className="w-20 bg-slate-800 border-2 border-slate-600 rounded-xl px-2 py-1 text-center text-white font-black focus:border-amber-400 outline-none" />
                    % )
                  </span>
                  <span className="text-rose-400 font-bold">-{irpf.toFixed(2)} €</span>
                </div>
                
                <div className="mt-8 pt-8 border-t-2 border-slate-700">
                  <div className="flex flex-col items-center bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 rounded-3xl shadow-lg border-2 border-emerald-400 text-center transform scale-105 relative">
                    <span className="uppercase text-emerald-100 font-black tracking-widest text-lg mb-2 text-shadow">Cálculo de la App (Neto)</span>
                    <span className="text-6xl md:text-7xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)]">{liquidoAPercibir.toFixed(2)} €</span>
                  </div>
                </div>

                {/* EL NUEVO VERIFICADOR DE NÓMINAS */}
                <div className="mt-12 bg-slate-800 p-8 rounded-3xl border-2 border-slate-700 shadow-inner">
                  <div className="flex flex-col items-center text-center">
                    <Scale className="w-12 h-12 text-sky-400 mb-4" />
                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">Comprobador de Nómina</h3>
                    <p className="text-slate-400 font-medium mb-8">Escribe el dinero que te ingresó la ETT en el banco y mira si cuadra.</p>
                    
                    <div className="w-full max-w-sm relative mb-8">
                      <input 
                        type="number" 
                        step="0.01" 
                        value={nominaPapel || ''} 
                        onChange={(e) => handleNominaFisicaChange(parseFloat(e.target.value) || 0)}
                        placeholder="Ej. 2079.46" 
                        className="w-full bg-slate-900 border-4 border-sky-500/50 rounded-2xl px-6 py-5 font-black text-4xl text-white text-center focus:outline-none focus:border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]" 
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-600">€</span>
                    </div>

                    {nominaPapel > 0 && (
                      <div className="w-full animate-fade-in">
                        {diferenciaAbsoluta <= 0.05 ? (
                          <div className="bg-emerald-500/20 border-2 border-emerald-500 p-6 rounded-2xl flex flex-col items-center">
                            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2" />
                            <span className="text-2xl font-black text-emerald-400">¡TODO CUADRA A LA PERFECCIÓN!</span>
                            <span className="text-emerald-200 mt-2 font-medium">La nómina de la empresa es correcta.</span>
                          </div>
                        ) : diferenciaNomina > 0.05 ? (
                          <div className="bg-rose-500/20 border-2 border-rose-500 p-6 rounded-2xl flex flex-col items-center">
                            <AlertCircle className="w-16 h-16 text-rose-400 mb-2" />
                            <span className="text-2xl font-black text-rose-400 uppercase">¡Cuidado! Faltan {diferenciaAbsoluta.toFixed(2)} €</span>
                            <span className="text-rose-200 mt-2 font-medium">Te han pagado de menos. Toca reclamar.</span>
                          </div>
                        ) : (
                          <div className="bg-sky-500/20 border-2 border-sky-500 p-6 rounded-2xl flex flex-col items-center">
                            <CheckCircle2 className="w-16 h-16 text-sky-400 mb-2" />
                            <span className="text-2xl font-black text-sky-400">Te han pagado {diferenciaAbsoluta.toFixed(2)} € de más</span>
                            <span className="text-sky-200 mt-2 font-medium">Shhh... ¡Guarda el secreto! 😉</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONFIGURACIÓN DE PRECIOS EXACTOS */}
        {activeTab === 'settings' && (
          <div className="bg-slate-50 p-6 md:p-10 rounded-3xl border border-slate-200 space-y-12">
            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-4 text-center">Precios Oficiales ETT</h2>
              <p className="text-center text-slate-500 font-medium mb-8">Extraídos al céntimo de la nómina. No modificar a menos que haya subida salarial.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Salario Base (€/h)</label>
                  <input type="number" step="0.0001" value={defaultRates.salarioBase} onChange={(e) => saveRates({ ...defaultRates, salarioBase: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl font-black text-2xl text-slate-800 text-center focus:border-amber-400 outline-none shadow-inner" />
                </div>
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Vacaciones (€/h)</label>
                  <input type="number" step="0.0001" value={defaultRates.vacaciones} onChange={(e) => saveRates({ ...defaultRates, vacaciones: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl font-black text-2xl text-slate-800 text-center focus:border-amber-400 outline-none shadow-inner" />
                </div>
                <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm text-center">
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">P.P. Extra (€/h)</label>
                  <input type="number" step="0.0001" value={defaultRates.ppExtra} onChange={(e) => saveRates({ ...defaultRates, ppExtra: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl font-black text-2xl text-slate-800 text-center focus:border-amber-400 outline-none shadow-inner" />
                </div>
                <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100 shadow-sm text-center">
                  <label className="block text-sm font-black text-indigo-400 uppercase tracking-widest mb-4">Plus Nocturno (€/h)</label>
                  <input type="number" step="0.0001" value={defaultRates.plusNocturnidad} onChange={(e) => saveRates({ ...defaultRates, plusNocturnidad: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 border-2 border-indigo-200 rounded-2xl font-black text-2xl text-indigo-900 text-center focus:border-indigo-400 outline-none shadow-inner bg-white" />
                </div>
                <div className="bg-purple-50 p-6 rounded-3xl border-2 border-purple-100 shadow-sm text-center lg:col-span-2">
                  <label className="block text-sm font-black text-purple-400 uppercase tracking-widest mb-4">Horas Extras / Festivas (€/h)</label>
                  <input type="number" step="0.0001" value={defaultRates.precioExtra} onChange={(e) => saveRates({ ...defaultRates, precioExtra: parseFloat(e.target.value) || 0 })} className="w-full lg:w-1/2 mx-auto px-5 py-4 border-2 border-purple-200 rounded-2xl font-black text-2xl text-purple-900 text-center focus:border-purple-400 outline-none shadow-inner bg-white block" />
                </div>
              </div>

              <div className="mt-12 bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                <span className="text-amber-800 font-bold mb-4 uppercase tracking-widest text-sm">Resumen de precios calculados</span>
                <div className="flex flex-wrap justify-center gap-6">
                  <div className="text-xl bg-white px-4 py-2 rounded-xl shadow-sm"><span className="font-bold text-slate-500">Hora Normal:</span> <span className="font-black text-slate-800">{precioHoraBaseTotal.toFixed(2)} €</span></div>
                  <div className="text-xl bg-white px-4 py-2 rounded-xl shadow-sm"><span className="font-bold text-slate-500">Hora Nocturna:</span> <span className="font-black text-slate-800">{(precioHoraBaseTotal + defaultRates.plusNocturnidad).toFixed(2)} €</span></div>
                  <div className="text-xl bg-white px-4 py-2 rounded-xl shadow-sm"><span className="font-bold text-slate-500">Extra Noche:</span> <span className="font-black text-slate-800">{precioExtraNoche.toFixed(2)} €</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
