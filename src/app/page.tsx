"use client";
import React, { useState, useEffect } from 'react';

const NOMBRES_MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

// --- FUNCIÓN PARA CALCULAR EL NÚMERO DE SEMANA REAL (ISO 8601) ---
const getNumeroSemana = (fecha: Date) => {
  const date = new Date(fecha.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export default function AppNominas() {
  const [isClient, setIsClient] = useState(false);
  const [tab, setTab] = useState('nomina');
  
  // Arranca automáticamente en el mes y año actuales reales
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anioActual, setAnioActual] = useState(new Date().getFullYear());

  const [diasData, setDiasData] = useState<Record<string, any>>({});
  const [precios, setPrecios] = useState({ ordinaria: 11.60, nocturnidad: 2.49, extDia: 18.06, extNoche: 20.55 });
  
  const [ingresoBanco, setIngresoBanco] = useState<string>("");
  const [ingresoProductividad, setIngresoProductividad] = useState<string>(""); // Nuevo estado para la ETT

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('natalia_nomina_v2'); 
    let loadedData: Record<string, any> = {};
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.diasData) loadedData = parsed.diasData;
        if (parsed.precios) setPrecios(parsed.precios);
        if (parsed.ingresoBanco !== undefined) setIngresoBanco(parsed.ingresoBanco);
        if (parsed.ingresoProductividad !== undefined) setIngresoProductividad(parsed.ingresoProductividad);
      } catch(e){}
    }

    // INYECCIÓN DE JULIO
    const julioRescate: Record<string, any> = {
      "2026-6-1": { h: "8", n: "0.5" }, "2026-6-2": { h: "8", n: "0.5" }, "2026-6-3": { h: "8", n: "0.5" },
      "2026-6-6": { h: "8", n: "1" }, "2026-6-7": { h: "8", n: "1" }, "2026-6-8": { h: "8", n: "1" }, "2026-6-9": { h: "8", n: "1" }, "2026-6-10": { h: "8", n: "1" },
      "2026-6-13": { h: "8", n: "0.5" }, "2026-6-14": { h: "8", n: "0.5" }, "2026-6-15": { h: "8", n: "0.5" }, "2026-6-16": { h: "8", n: "0.5" }, "2026-6-17": { h: "8", n: "0.5" },
      "2026-6-20": { h: "8", n: "1" }, "2026-6-21": { h: "8", n: "1" }, "2026-6-22": { h: "8", n: "1" }, "2026-6-23": { h: "8", n: "1", en: "1" }, "2026-6-24": { h: "8", n: "1", en: "1" },
      "2026-6-27": { h: "8", n: "0.5", en: "1" }, "2026-6-28": { h: "8", n: "0.5", en: "1" }, "2026-6-30": { h: "8", n: "0.5" }, "2026-6-31": { h: "6" }
    };

    // INYECCIÓN EXACTA DE AGOSTO
    const agostoRescate: Record<string, any> = {
      "2026-7-3": { h: "8", n: "1.76" }, "2026-7-4": { h: "8", n: "1.76" }, "2026-7-5": { h: "8", n: "1.76" }, "2026-7-6": { h: "8", n: "1.76" }, "2026-7-7": { h: "8", n: "1.76" },
      "2026-7-10": { h: "8", n: "1.76" }, "2026-7-11": { h: "8", n: "1.76" }, "2026-7-12": { h: "8", n: "1.76" }, "2026-7-13": { h: "8", n: "1.76" }, "2026-7-14": { h: "8", n: "1.83" },
      "2026-7-17": { h: "8", ed: "2" }, "2026-7-18": { h: "8", ed: "2" }, "2026-7-19": { h: "8" }, "2026-7-20": { h: "8" }, "2026-7-21": { h: "0.83" }, 
      "2026-7-24": { h: "8" }, "2026-7-25": { h: "8" }, "2026-7-26": { h: "8" }, "2026-7-27": { h: "8" }, "2026-7-28": { h: "8" }, "2026-7-31": { h: "8" }
    };

    const finalData = { ...loadedData };
    
    Object.keys(finalData).forEach(key => {
      if (key.startsWith("2026-7-")) delete finalData[key];
    });

    Object.keys(julioRescate).forEach(key => { if (!finalData[key]) finalData[key] = julioRescate[key]; });
    Object.keys(agostoRescate).forEach(key => { finalData[key] = agostoRescate[key]; });

    setDiasData(finalData);
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('natalia_nomina_v2', JSON.stringify({ diasData, precios, ingresoBanco, ingresoProductividad }));
    }
  }, [diasData, precios, ingresoBanco, ingresoProductividad, isClient]);

  const cambiarMes = (direccion: number) => {
    let nuevoMes = mesActual + direccion;
    let nuevoAnio = anioActual;
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
    setIngresoBanco("");
    setIngresoProductividad("");
  };

  const diasDelMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const diasRender = [];
  let totalDiasTrabajadosMes = 0;

  for (let i = 1; i <= diasDelMes; i++) {
    const diaClave = `${anioActual}-${mesActual}-${i}`;
    const datosDia = diasData[diaClave] || { h: '', n: '', ed: '', en: '', p: '' };
    
    if (Number(datosDia.h) > 0 || Number(datosDia.n) > 0) totalDiasTrabajadosMes++;

    // Se suma la columna de productividad diaria (p) al total del día
    const totalDiaEuros = (
        (Number(datosDia.h) || 0) * precios.ordinaria +
        (Number(datosDia.n) || 0) * precios.nocturnidad +
        (Number(datosDia.ed) || 0) * precios.extDia +
        (Number(datosDia.en) || 0) * precios.extNoche +
        (Number(datosDia.p) || 0)
    );

    // Calculamos la semana real a la que pertenece este día
    const fechaActual = new Date(anioActual, mesActual, i);
    const numeroSemana = getNumeroSemana(fechaActual);

    diasRender.push({ diaNum: i, clave: diaClave, datos: datosDia, totalEuros: totalDiaEuros, semana: numeroSemana });
  }

  const updateDia = (clave: string, campo: string, valor: string) => {
    setDiasData(prev => ({ ...prev, [clave]: { ...prev[clave], [campo]: valor } }));
  };

  const resetearPrecios = () => {
      setPrecios({ ordinaria: 11.60, nocturnidad: 2.49, extDia: 18.06, extNoche: 20.55 });
      alert("Precios restaurados a la nómina de CRIT.");
  };

  if (!isClient) return null; 

  let totalSalarioMes = 0;
  let totalProductividadMes = 0;
  
  Object.keys(diasData).forEach(clave => {
      if (clave.startsWith(`${anioActual}-${mesActual}-`)) {
          const d = diasData[clave];
          totalSalarioMes += (Number(d.h) || 0) * precios.ordinaria +
                             (Number(d.n) || 0) * precios.nocturnidad +
                             (Number(d.ed) || 0) * precios.extDia +
                             (Number(d.en) || 0) * precios.extNoche;
          
          totalProductividadMes += (Number(d.p) || 0); // Suma automática de la productividad
      }
  });

  const salarioBruto = totalSalarioMes + totalProductividadMes;
  const retencionIRPF = salarioBruto * 0.02;
  const retencionSS = salarioBruto * 0.0655;
  const salarioNetoCalculado = salarioBruto - retencionIRPF - retencionSS;

  // Cálculos desglosados (Neto solo de horas y Neto solo de productividad)
  const TASA_DESCUENTOS = 0.0855; // 2% IRPF + 6.55% SS
  const netoSoloHoras = totalSalarioMes - (totalSalarioMes * TASA_DESCUENTOS);
  const netoProductividad = totalProductividadMes - (totalProductividadMes * TASA_DESCUENTOS);

  // --- COMPROBADOR GLOBAL DE BANCO ---
  const ingresoNum = Number(ingresoBanco) || 0;
  const diferencia = ingresoNum - salarioNetoCalculado;
  
  let colorFondo = "bg-gray-100";
  let colorTexto = "text-gray-500";
  let mensajeComparacion = "Introduce arriba lo cobrado para comprobar";

  if (ingresoBanco !== "") {
    if (Math.abs(diferencia) <= 1.00) { 
      colorFondo = "bg-green-100 border-green-500";
      colorTexto = "text-green-700";
      mensajeComparacion = "✅ ¡TODO CORRECTO! Te han pagado lo que tocaba.";
    } else if (diferencia < -1.00) {
      colorFondo = "bg-red-100 border-red-500";
      colorTexto = "text-red-700";
      mensajeComparacion = `❌ ¡FALTAN ${Math.abs(diferencia).toFixed(2)} €! Reclama a la ETT.`;
    } else if (diferencia > 1.00) {
      colorFondo = "bg-blue-100 border-blue-500";
      colorTexto = "text-blue-700";
      mensajeComparacion = `🔵 ¡TE SOBRAN ${Math.abs(diferencia).toFixed(2)} €! Has cobrado de más.`;
    }
  }

  // --- COMPROBADOR ESPECÍFICO DE PRODUCTIVIDAD ---
  const prodNum = Number(ingresoProductividad) || 0;
  const diferenciaProd = prodNum - totalProductividadMes;
  
  let colorFondoProd = "bg-gray-100";
  let colorTextoProd = "text-gray-500";
  let mensajeComparacionProd = "Introduce la gratificación de la nómina";

  if (ingresoProductividad !== "") {
    if (Math.abs(diferenciaProd) <= 0.50) { 
      colorFondoProd = "bg-green-100 border-green-500";
      colorTextoProd = "text-green-700";
      mensajeComparacionProd = "✅ PRODUCTIVIDAD CORRECTA.";
    } else if (diferenciaProd < -0.50) {
      colorFondoProd = "bg-red-100 border-red-500";
      colorTextoProd = "text-red-700";
      mensajeComparacionProd = `❌ TE HAN ROBADO ${Math.abs(diferenciaProd).toFixed(2)} € DE PRODUCTIVIDAD.`;
    } else if (diferenciaProd > 0.50) {
      colorFondoProd = "bg-blue-100 border-blue-500";
      colorTextoProd = "text-blue-700";
      mensajeComparacionProd = `🔵 TE SOBRAN ${Math.abs(diferenciaProd).toFixed(2)} €.`;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="bg-[#111827] text-white p-6 rounded-b-3xl shadow-lg max-w-2xl mx-auto">
        <div className="text-center mb-4 text-xs font-bold text-yellow-500 bg-gray-800 inline-block px-3 py-1 rounded-full border border-gray-700 uppercase tracking-widest mx-auto block w-max">
          Panel de Control
        </div>
        <h1 className="text-3xl font-bold text-center mb-6">Horas de Natalia <span className="text-yellow-500">🛡️</span></h1>
        
        <div className="flex justify-between items-center bg-gray-800 rounded-full px-6 py-3 border border-gray-700 mt-6">
          <button onClick={() => cambiarMes(-1)} className="text-gray-400 hover:text-white text-xl p-2 font-bold px-4 bg-gray-700 rounded-full active:scale-90">&lt;</button>
          <span className="font-bold text-lg tracking-widest text-yellow-400">{NOMBRES_MESES[mesActual]} {anioActual}</span>
          <button onClick={() => cambiarMes(1)} className="text-gray-400 hover:text-white text-xl p-2 font-bold px-4 bg-gray-700 rounded-full active:scale-90">&gt;</button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center mt-6 gap-2 px-4 max-w-2xl mx-auto">
        <button onClick={() => setTab('fichaje')} className={`px-4 py-2 rounded-full font-bold text-sm shadow transition-colors ${tab === 'fichaje' ? 'bg-yellow-500 text-gray-900' : 'bg-white text-gray-500 border'}`}>📅 Fichaje Diario</button>
        <button onClick={() => setTab('nomina')} className={`px-4 py-2 rounded-full font-bold text-sm shadow transition-colors ${tab === 'nomina' ? 'bg-yellow-500 text-gray-900' : 'bg-white text-gray-500 border'}`}>📄 Hacer Nómina</button>
        <button onClick={() => setTab('precios')} className={`px-4 py-2 rounded-full font-bold text-sm shadow transition-colors ${tab === 'precios' ? 'bg-yellow-500 text-gray-900' : 'bg-white text-gray-500 border'}`}>⚙️ Precios</button>
      </div>

      <div className="max-w-2xl mx-auto p-4 mt-4">
        
        {/* === PESTAÑA 1: FICHAJE === */}
        {tab === 'fichaje' && (
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800">Registro Mensual</h2>
              <span className="bg-blue-100 text-blue-800 font-bold px-4 py-1 rounded-full text-sm">Días trabajados: {totalDiasTrabajadosMes}</span>
            </div>

            <div className="hidden md:grid grid-cols-7 gap-2 bg-[#111827] text-yellow-500 font-bold text-[10px] uppercase p-3 rounded-xl mb-4 text-center items-center">
              <div>Día</div>
              <div>Total Turno (H)</div>
              <div>Plus Noct. (H)</div>
              <div>Ext. Día</div>
              <div>Ext. Noche</div>
              <div>Prod. (€)</div>
              <div>Total Día</div>
            </div>

            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {diasRender.map((d: any, index: number) => {
                  const mostrarCartel = index === 0 || d.semana !== diasRender[index - 1].semana;
                  
                  return (
                    <React.Fragment key={d.diaNum}>
                      {mostrarCartel && (
                        <div className="bg-yellow-100 border-y border-yellow-300 p-2 text-center text-yellow-800 font-black uppercase text-sm tracking-widest shadow-inner">
                          Semana {d.semana}
                        </div>
                      )}
                      <div className={`grid grid-cols-2 md:grid-cols-7 gap-2 p-3 items-center border-b border-gray-50 bg-white hover:bg-yellow-50/30 transition-colors`}>
                        
                        <div className="flex items-center space-x-3 col-span-2 md:col-span-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-yellow-400 text-gray-900 shadow-sm`}>
                            {d.diaNum}
                          </div>
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

                        {/* NUEVA COLUMNA: PRODUCTIVIDAD DIARIA */}
                        <div className="flex flex-col md:block">
                            <span className="text-[10px] font-bold text-yellow-600 md:hidden mb-1">Prod. (€)</span>
                            <input type="number" placeholder="0" value={d.datos.p || ''} onChange={e => updateDia(d.clave, 'p', e.target.value)} className="w-full text-center border-2 border-yellow-200 bg-yellow-50 rounded-xl p-2 font-bold text-yellow-800 focus:border-yellow-500 focus:ring-0 outline-none" />
                        </div>

                        <div className="col-span-2 md:col-span-1 text-center font-bold text-gray-800 text-lg mt-2 md:mt-0 bg-gray-50 md:bg-transparent rounded-xl p-2 md:p-0">
                          {d.totalEuros > 0 ? `${d.totalEuros.toFixed(2)} €` : '-'}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
            </div>
          </div>
        )}

        {/* === PESTAÑA 2: NÓMINA === */}
        {tab === 'nomina' && (
          <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Resumen Nómina: {NOMBRES_MESES[mesActual]}</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <span className="text-gray-500 font-semibold uppercase text-xs">Total Horas Trabajadas</span>
                <span className="font-bold text-md text-gray-800">{totalSalarioMes.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-yellow-700 font-bold uppercase text-xs">Incentivo Producción (Suma del mes)</span>
                <span className="font-black text-lg text-yellow-800">{totalProductividadMes.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-100 rounded-xl border-2 border-gray-300 shadow-sm">
                <span className="text-gray-800 font-black uppercase text-sm">Salario Bruto (Antes imp.)</span>
                <span className="font-black text-xl text-gray-900">{salarioBruto.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100 mt-4">
                <span className="text-red-500 font-semibold uppercase text-xs">Retención IRPF (2%)</span>
                <span className="font-bold text-sm text-red-600">- {retencionIRPF.toFixed(2)} €</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-red-500 font-semibold uppercase text-xs">Seg. Social (Aprox 6.55%)</span>
                <span className="font-bold text-sm text-red-600">- {retencionSS.toFixed(2)} €</span>
              </div>
            </div>

            {/* RECUADROS INFORMATIVOS DESGLOSADOS */}
            <div className="flex flex-col md:flex-row gap-3 mt-6">
              <div className="flex-1 bg-gray-100 p-4 rounded-xl border border-gray-300 text-center shadow-sm">
                <span className="block text-gray-500 font-bold uppercase text-[10px] mb-1 tracking-wider">Neto (Solo Horas)</span>
                <span className="text-xl font-black text-gray-800">{netoSoloHoras.toFixed(2)} €</span>
              </div>
              <div className="flex-1 bg-yellow-50 p-4 rounded-xl border border-yellow-300 text-center shadow-sm">
                <span className="block text-yellow-600 font-bold uppercase text-[10px] mb-1 tracking-wider">Neto (Productividad)</span>
                <span className="text-xl font-black text-yellow-800">{netoProductividad.toFixed(2)} €</span>
              </div>
            </div>

            <div className="mt-6 bg-[#111827] rounded-2xl p-6 text-center shadow-lg">
              <span className="block text-yellow-500 font-bold uppercase tracking-widest text-xs mb-1">Lo que debería llegar al banco</span>
              <span className="text-4xl font-extrabold text-white">{salarioNetoCalculado.toFixed(2)} €</span>
            </div>

            {/* ZONAS DE COMPROBACIÓN DOBLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t pt-6">
              
              {/* Comprobador 1: Banco */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <h3 className="text-center font-bold text-blue-800 mb-4 uppercase tracking-wider text-xs">1. Comprobar Total Banco</h3>
                <div className="flex justify-center mb-4">
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={ingresoBanco} 
                    onChange={(e) => setIngresoBanco(e.target.value)}
                    className="w-full max-w-[120px] text-center border-2 border-blue-300 bg-white rounded-xl p-2 font-black text-blue-900 text-lg outline-none shadow-inner"
                  />
                  <span className="ml-2 font-black text-blue-900 text-xl self-center">€</span>
                </div>
                <div className={`p-3 rounded-xl text-center font-bold text-sm border-2 transition-colors duration-300 ${colorFondo}`}>
                  <span className={colorTexto}>{mensajeComparacion}</span>
                </div>
              </div>

              {/* Comprobador 2: Productividad */}
              <div className="bg-yellow-50/50 p-4 rounded-2xl border border-yellow-200">
                <h3 className="text-center font-bold text-yellow-800 mb-4 uppercase tracking-wider text-xs">2. Comprobar Productividad</h3>
                <div className="flex justify-center mb-4">
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={ingresoProductividad} 
                    onChange={(e) => setIngresoProductividad(e.target.value)}
                    className="w-full max-w-[120px] text-center border-2 border-yellow-400 bg-white rounded-xl p-2 font-black text-yellow-900 text-lg outline-none shadow-inner"
                  />
                  <span className="ml-2 font-black text-yellow-900 text-xl self-center">€</span>
                </div>
                <div className={`p-3 rounded-xl text-center font-bold text-sm border-2 transition-colors duration-300 ${colorFondoProd}`}>
                  <span className={colorTextoProd}>{mensajeComparacionProd}</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* === PESTAÑA 3: PRECIOS === */}
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
            <button onClick={resetearPrecios} className="mt-6 w-full text-blue-600 font-bold p-3 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl transition">
              🔄 Restaurar precios oficiales de la nómina
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
