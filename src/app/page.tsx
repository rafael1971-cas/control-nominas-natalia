"use client";
import React, { useState, useEffect } from 'react';

// --- Funciones de ayuda ---
function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const NOMBRES_MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const NOMBRES_DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export default function AppNominas() {
  const [isClient, setIsClient] = useState(false);
  const [tab, setTab] = useState('fichaje'); 
  const [mesActual, setMesActual] = useState(6); // 6 = Julio
  const [anioActual, setAnioActual] = useState(2026);

  const [diasData, setDiasData] = useState<Record<string, any>>({});
  const [precios, setPrecios] = useState({ ordinaria: 9.38, nocturnidad: 1.5, extDia: 12, extNoche: 14 });
  const [prodSemanal, setProdSemanal] = useState<Record<string, number>>({});
  const [incentivoManual, setIncentivoManual] = useState<string>("0");

  // --- SISTEMA DE RESCATE (CON TRADUCTOR UNIVERSAL) ---
  const [mostrarRescate, setMostrarRescate] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
    const savedV3 = localStorage.getItem('natalia_nomina_v3');
    if (savedV3) {
      try {
        const parsed = JSON.parse(savedV3);
        if (parsed.diasData) setDiasData(parsed.diasData);
        if (parsed.precios) setPrecios(parsed.precios);
        if (parsed.prodSemanal) setProdSemanal(parsed.prodSemanal);
        if (parsed.incentivoManual !== undefined) setIncentivoManual(parsed.incentivoManual);
      } catch(e){}
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('natalia_nomina_v3', JSON.stringify({ diasData, precios, prodSemanal, incentivoManual }));
    }
  }, [diasData, precios, prodSemanal, incentivoManual, isClient]);

  useEffect(() => {
    if (!isClient) return;
    let sumaTotalMes = 0;
    const prefijoMes = `${anioActual}-${mesActual}-`;
    Object.keys(prodSemanal).forEach(key => {
      if (key.startsWith(prefijoMes)) {
        sumaTotalMes += Number(prodSemanal[key]) || 0;
      }
    });
    setIncentivoManual(sumaTotalMes > 0 ? sumaTotalMes.toFixed(2) : "0");
  }, [prodSemanal, anioActual, mesActual]);

  // --- TRADUCTOR DEFINITIVO ---
  const escanearMovil = () => {
    const encontrados = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.includes('v3')) { 
        const val = localStorage.getItem(key);
        encontrados.push({ key, val });
      }
    }
    setBackups(encontrados);
    setMostrarRescate(true);
  };

  const restaurarBackup = (val: string) => {
    try {
      const parsed = JSON.parse(val);
      let newData = { ...diasData };
      let recuperadoAlgo = false;

      // Intento 1: Formatos nuevos
      if (parsed && parsed.diasData) {
        setDiasData(parsed.diasData);
        if (parsed.precios) setPrecios(parsed.precios);
        if (parsed.prodSemanal) setProdSemanal(parsed.prodSemanal);
        recuperadoAlgo = true;
      }

      // Intento 2: Traducir los archivos antiguos (hcsl_payroll_data_v2, etc.)
      if (parsed && typeof parsed === 'object') {
        Object.keys(parsed).forEach(keyMes => {
          // keyMes suele ser "2026-07"
          if (keyMes.includes('-') && !keyMes.includes(':')) {
            const partes = keyMes.split('-');
            if (partes.length >= 2) {
              const year = partes[0];
              const monthIndex = parseInt(partes[1], 10) - 1; // "07" pasa a 6 (Julio)

              const diasDelMes = parsed[keyMes];
              if (typeof diasDelMes === 'object' && diasDelMes !== null) {
                Object.keys(diasDelMes).forEach(diaNum => {
                  const d = diasDelMes[diaNum];
                  if (typeof d === 'object') {
                    const newKey = `${year}-${monthIndex}-${diaNum}`;
                    
                    // Traductor de variables viejas a nuevas
                    const h = d.horasBase || d.normalHours || d.h || '';
                    const n = d.plusNocturno || d.nightHours || d.n || '';
                    const ed = d.horasExtras || d.extraHours || d.ed || '';
                    const en = d.extrasNocturnas || d.extraNight || d.en || '';

                    if (h !== '' || n !== '') {
                      newData[newKey] = { h: String(h), n: String(n), ed: String(ed), en: String(en) };
                      recuperadoAlgo = true;
                    }
                  }
                });
              }
            }
          }
        });
      }

      if (recuperadoAlgo) {
        setDiasData(newData);
        setMostrarRescate(false);
        alert("¡BINGO! Datos antiguos traducidos y restaurados a la perfección. ¡Dile a Rafa que le quites el castigo!");
      } else {
        alert("Esa caja fuerte está vacía. Prueba con otra de la lista.");
      }

    } catch (e) {
      alert("Error al leer este archivo.");
    }
  };

  const cambiarMes = (direccion: number) => {
    let nuevoMes = mesActual + direccion;
    let nuevoAnio = anioActual;
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
  };

  const diasDelMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const semanas = [];
  let semanaActual: any = null;
  let totalDiasTrabajadosMes = 0;

  for (let i = 1; i <= diasDelMes; i++) {
    const fecha = new Date(anioActual, mesActual, i);
    const numSemana = getISOWeek(fecha);
    const diaClave = `${anioActual}-${mesActual}-${i}`;
    const datosDia = diasData[diaClave] || { h: '', n: '', ed: '', en: '' };
    
    if (Number(datosDia.h) > 0 || Number(datosDia.n) > 0) totalDiasTrabajadosMes++;

    if (!semanaActual || semanaActual.num !== numSemana) {
      semanaActual = { num: numSemana, claveSemana: `${anioActual}-${mesActual}-${numSemana}`, dias: [] };
      semanas.push(semanaActual);
    }

    const totalDiaEuros = (
        (Number(datosDia.h) || 0) * precios.ordinaria +
        (Number(datosDia.n) || 0) * precios.nocturnidad +
        (Number(datosDia.ed) || 0) * precios.extDia +
        (Number(datosDia.en) || 0) * precios.extNoche
    );

    semanaActual.dias.push({
      diaNum: i,
      nombreDia: NOMBRES_DIAS[fecha.getDay()],
      clave: diaClave,
      datos: datosDia,
      isWeekend: fecha.getDay() === 0 || fecha.getDay() === 6,
      totalEuros: totalDiaEuros
    });
  }

  const updateDia = (clave: string, campo: string, valor: string) => {
    setDiasData(prev => ({ ...prev, [clave]: { ...prev[clave], [campo]: valor } }));
  };

  const updateProdSemanal = (claveSemana: string, valor: string) => {
    setProdSemanal(prev => ({ ...prev, [claveSemana]: Number(valor) }));
  };

  if (!isClient) return null; 

  let totalSalarioMes = 0;
  Object.keys(diasData).forEach(clave => {
      if (clave.startsWith(`${anioActual}-${mesActual}-`)) {
          const d = diasData[clave];
          totalSalarioMes += (Number(d.h) || 0) * precios.ordinaria +
                             (Number(d.n) || 0) * precios.nocturnidad +
                             (Number(d.ed) || 0) * precios.extDia +
                             (Number(d.en) || 0) * precios.extNoche;
      }
  });

  const incentivoFinal = Number(incentivoManual) || 0;
  const salarioBruto = totalSalarioMes + incentivoFinal;
  const retencion = salarioBruto * 0.02; 
  const salarioNeto = salarioBruto - retencion;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* PANTALLA DE RESCATE SUPERPUESTA */}
      {mostrarRescate && (
        <div className="fixed inset-0 bg-red-900 z-50 p-6 overflow-y-auto flex flex-col items-center">
          <h2 className="text-3xl font-black text-white mb-4 text-center mt-10">🚨 MODO RESCATE 🚨</h2>
          <p className="text-white text-center mb-6 font-bold">Busca el archivo "hcsl_payroll_data_v2" y pulsa Restaurar.</p>
          
          <div className="w-full max-w-lg space-y-4">
            {backups.map((b, index) => (
              <div key={index} className="bg-white p-4 rounded-xl shadow-xl border-4 border-red-500">
                <p className="font-bold text-gray-800 border-b pb-2 mb-2">📦 Archivo encontrado: <span className="text-blue-600">{b.key}</span></p>
                <button onClick={() => restaurarBackup(b.val)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-lg shadow-lg uppercase">
                  ✅ Restaurar estos datos
                </button>
              </div>
            ))}
          </div>
          
          <button onClick={() => setMostrarRescate(false)} className="mt-8 bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-4 rounded-full border border-gray-600 shadow-xl">
            Cancelar y Volver
          </button>
        </div>
      )}

      <div className="bg-[#111827] text-white p-6 rounded-b-3xl shadow-lg max-w-2xl mx-auto">
        <div className="text-center mb-4 text-xs font-bold text-yellow-500 bg-gray-800 inline-block px-3 py-1 rounded-full border border-gray-700 uppercase tracking-widest mx-auto block w-max">
          Panel de Control
        </div>
        <h1 className="text-3xl font-bold text-center mb-6">Horas de Natalia <span className="text-yellow-500">🛡️</span></h1>
        
        <button onClick={escanearMovil} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-xl w-full mb-6 shadow-[0_0_15px_rgba(220,38,38,0.5)] border-2 border-red-400 flex justify-center items-center gap-2 animate-pulse transition-all">
          <span className="text-xl">🆘</span> ¿NO VES TUS HORAS? PULSA AQUÍ
        </button>
        
        <div className="flex justify-between items-center bg-gray-800 rounded-full px-6 py-3 border border-gray-700">
          <button onClick={() => cambiarMes(-1)} className="text-gray-400 hover:text-white text-xl p-2 font-bold px-4 bg-gray-700 rounded-full">&lt;</button>
          <span className="font-bold text-lg tracking-widest text-yellow-400">{NOMBRES_MESES[mesActual]} {anioActual}</span>
          <button onClick={() => cambiarMes(1)} className="text-gray-400 hover:text-white text-xl p-2 font-bold px-4 bg-gray-700 rounded-full">&gt;</button>
        </div>
      </div>

      <div className="flex justify-center mt-6 space-x-2 px-4 max-w-2xl mx-auto">
        <button onClick={() => setTab('fichaje')} className={`px-4 py-2 rounded-full font-bold text-sm shadow transition-colors ${tab === 'fichaje' ? 'bg-yellow-500 text-gray-900' : 'bg-white text-gray-500 border'}`}>📅 Fichaje Diario</button>
        <button onClick={() => setTab('nomina')} className={`px-4 py-2 rounded-full font-bold text-sm shadow transition-colors ${tab === 'nomina' ? 'bg-yellow-500 text-gray-900' : 'bg-white text-gray-500 border'}`}>📄 Hacer Nómina</button>
        <button onClick={() => setTab('precios')} className={`px-4 py-2 rounded-full font-bold text-sm shadow transition-colors ${tab === 'precios' ? 'bg-yellow-500 text-gray-900' : 'bg-white text-gray-500 border'}`}>⚙️ Precios</button>
      </div>

      <div className="max-w-2xl mx-auto p-4 mt-4">
        {tab === 'fichaje' && (
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">Registro Mensual</h2>
              <span className="bg-blue-100 text-blue-800 font-bold px-4 py-1 rounded-full text-sm">Días trabajados: {totalDiasTrabajadosMes}</span>
            </div>

            <div className="hidden md:grid grid-cols-6 gap-2 bg-[#111827] text-yellow-500 font-bold text-[10px] uppercase p-3 rounded-xl mb-4 text-center items-center">
              <div>Día</div>
              <div>Total Turno (H)</div>
              <div>Plus Noct. (H)</div>
              <div>Ext. Día</div>
              <div>Ext. Noche</div>
              <div>Total Día</div>
            </div>

            {semanas.map((semana) => (
              <div key={semana.num} className="mb-8 border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-gray-700">
                    <span className="font-extrabold text-sm uppercase tracking-wider">🗓️ Semana del año: <span className="text-blue-600">{semana.num}</span></span>
                </div>

                {semana.dias.map((d: any) => (
                  <div key={d.diaNum} className={`grid grid-cols-2 md:grid-cols-6 gap-2 p-3 items-center border-b border-gray-50 ${d.isWeekend ? 'bg-gray-50/50' : 'bg-white'} hover:bg-yellow-50/30 transition-colors`}>
                    
                    <div className="flex items-center space-x-3 col-span-2 md:col-span-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${d.isWeekend ? 'bg-gray-200 text-gray-500' : 'bg-yellow-400 text-gray-900 shadow-sm'}`}>
                        {d.diaNum}
                      </div>
                      <span className={`font-bold text-xs ${d.isWeekend ? 'text-gray-400' : 'text-gray-500'}`}>{d.nombreDia}</span>
                    </div>

                    <div className="flex flex-col md:block">
                        <span className="text-[10px] font-bold text-gray-400 md:hidden mb-1">Turno Base</span>
                        <input type="number" placeholder="0" value={d.datos.h} onChange={e => updateDia(d.clave, 'h', e.target.value)} className="w-full text-center border-2 border-gray-200 rounded-xl p-2 font-bold text-gray-700 focus:border-yellow-400 focus:ring-0 outline-none" />
                    </div>
                    <div className="flex flex-col md:block">
                        <span className="text-[10px] font-bold text-gray-400 md:hidden mb-1">Plus Noct.</span>
                        <input type="number" placeholder="0" value={d.datos.n} onChange={e => updateDia(d.clave, 'n', e.target.value)} className="w-full text-center border-2 border-gray-200 rounded-xl p-2 font-bold text-gray-700 focus:border-yellow-400 focus:ring-0 outline-none" />
                    </div>
                    <div className="flex flex-col md:block">
                        <span className="text-[10px] font-bold text-gray-400 md:hidden mb-1">Ext. Día</span>
                        <input type="number" placeholder="0" value={d.datos.ed} onChange={e => updateDia(d.clave, 'ed', e.target.value)} className="w-full text-center border-2 border-gray-200 rounded-xl p-2 font-bold text-gray-700 focus:border-yellow-400 focus:ring-0 outline-none" />
                    </div>
                    <div className="flex flex-col md:block">
                        <span className="text-[10px] font-bold text-gray-400 md:hidden mb-1">Ext. Noche</span>
                        <input type="number" placeholder="0" value={d.datos.en} onChange={e => updateDia(d.clave, 'en', e.target.value)} className="w-full text-center border-2 border-gray-200 rounded-xl p-2 font-bold text-gray-700 focus:border-yellow-400 focus:ring-0 outline-none" />
                    </div>

                    <div className="col-span-2 md:col-span-1 text-center font-bold text-gray-800 text-lg mt-2 md:mt-0 bg-gray-50 md:bg-transparent rounded-xl p-2 md:p-0">
                      {d.totalEuros > 0 ? `${d.totalEuros.toFixed(2)} €` : '-'}
                    </div>
                  </div>
                ))}

                <div className="bg-yellow-50 p-4 border-t-2 border-yellow-200 flex flex-col md:flex-row justify-between items-center gap-3">
                  <div className="text-yellow-800 font-bold text-sm">
                    ✨ Bono de Productividad (Semana {semana.num})
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={prodSemanal[semana.claveSemana] || ''} 
                      onChange={(e) => updateProdSemanal(semana.claveSemana, e.target.value)}
                      className="w-24 text-right border-2 border-yellow-300 rounded-lg p-2 font-bold text-gray-800 focus:border-yellow-500 focus:ring-0 outline-none shadow-inner"
                    />
                    <span className="ml-2 font-bold text-yellow-700">€</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {tab === 'nomina' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Resumen Nómina: {NOMBRES_MESES[mesActual]}</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                <span className="text-gray-500 font-semibold uppercase text-sm">Total Horas/Turnos</span>
                <span className="font-bold text-lg text-gray-800">{totalSalarioMes.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex flex-col">
                    <span className="text-yellow-700 font-bold uppercase text-sm">Incentivo Mensual</span>
                    <span className="text-[10px] text-yellow-600">(Suma automática de semanas o manual)</span>
                </div>
                <div className="flex items-center">
                    <input 
                        type="number" 
                        value={incentivoManual} 
                        onChange={(e) => setIncentivoManual(e.target.value)}
                        className="w-24 text-right border-2 border-yellow-300 bg-white rounded-lg p-2 font-bold text-gray-800 outline-none"
                    />
                    <span className="ml-2 font-bold text-yellow-600">€</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border">
                <span className="text-gray-500 font-semibold uppercase text-sm">Salario Bruto Calculado</span>
                <span className="font-bold text-xl text-gray-800">{salarioBruto.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                <span className="text-red-500 font-semibold uppercase text-sm">Retención IRPF/SS (Aprox)</span>
                <span className="font-bold text-lg text-red-600">- {retencion.toFixed(2)} €</span>
              </div>
            </div>

            <div className="mt-8 bg-[#111827] rounded-2xl p-6 text-center shadow-lg shadow-blue-900/20">
              <span className="block text-yellow-500 font-bold uppercase tracking-widest text-sm mb-2">Total Neto a Cobrar</span>
              <span className="text-5xl font-extrabold text-white">{salarioNeto.toFixed(2)} €</span>
            </div>
          </div>
        )}

        {tab === 'precios' && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Configuración de Precios ETT</h2>
            <div className="space-y-4">
              {[
                { clave: 'ordinaria', label: 'Hora Ordinaria Base (€)' },
                { clave: 'nocturnidad', label: 'Plus Nocturnidad Extra (€)' },
                { clave: 'extDia', label: 'Hora Extra (Día) (€)' },
                { clave: 'extNoche', label: 'Hora Extra (Noche) (€)' }
              ].map((item) => (
                <div key={item.clave} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-600 text-sm uppercase">{item.label}</span>
                  <input 
                    type="number" 
                    value={(precios as any)[item.clave]} 
                    onChange={e => setPrecios(prev => ({ ...prev, [item.clave]: Number(e.target.value) }))}
                    className="w-24 border-2 border-gray-200 rounded-lg p-2 text-center font-bold text-gray-800 focus:border-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
