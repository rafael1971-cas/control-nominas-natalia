"use client";
import React, { useState, useEffect } from 'react';

const NOMBRES_MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

// --- CREDENCIALES DE SUPABASE ---
const SUPABASE_URL = "https://kkgaaccxdorqumzsprjv.supabase.co/rest/v1/productividad_natalia";
const SUPABASE_KEY = "sb_publishable_lYdelNOdfdQbsejEsKjImA_cXjLkryV";

export default function AppNominas() {
  const [isClient, setIsClient] = useState(false);
  const [tab, setTab] = useState('nomina');
  const [mesActual, setMesActual] = useState(7);
  const [anioActual, setAnioActual] = useState(2026);

  const [diasData, setDiasData] = useState<Record<string, any>>({});
  const [precios, setPrecios] = useState({ ordinaria: 11.60, nocturnidad: 2.49, extDia: 18.06, extNoche: 20.55 });
  const [incentivoManual, setIncentivoManual] = useState<string>("0");
  const [ingresoBanco, setIngresoBanco] = useState<string>("");

  // --- ESTADOS NUEVOS PARA POWERBI (SUPABASE) ---
  const [semanasPowerBI, setSemanasPowerBI] = useState<any[]>([]);
  const [totalPagadoSupabase, setTotalPagadoSupabase] = useState<number>(0);
  const [inputSemana, setInputSemana] = useState("");
  const [inputGenerado, setInputGenerado] = useState("");
  const [inputPagado, setInputPagado] = useState("");

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('natalia_nomina_v2'); 
    let loadedData: Record<string, any> = {};
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.diasData) loadedData = parsed.diasData;
        if (parsed.precios) setPrecios(parsed.precios);
        if (parsed.incentivoManual !== undefined) setIncentivoManual(parsed.incentivoManual);
        if (parsed.ingresoBanco !== undefined) setIngresoBanco(parsed.ingresoBanco);
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
      localStorage.setItem('natalia_nomina_v2', JSON.stringify({ diasData, precios, incentivoManual, ingresoBanco }));
    }
  }, [diasData, precios, incentivoManual, ingresoBanco, isClient]);

  // --- LÓGICA DE CONEXIÓN A SUPABASE (NUEVO) ---
  const fetchProductividad = async () => {
    const mesStr = `${anioActual}-${mesActual}`;
    try {
      const res = await fetch(`${SUPABASE_URL}?mes_año=eq.${mesStr}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      const data = await res.json();
      let semanas: any[] = [];
      let pagado = 0;
      
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.semana === 'TOTAL_NOMINA') {
            pagado = parseFloat(item.importe_pagado) || 0;
          } else {
            semanas.push(item);
          }
        });
      }
      
      // Ordenar por nombre de semana alfabéticamente
      semanas.sort((a, b) => a.semana.localeCompare(b.semana));
      setSemanasPowerBI(semanas);
      setTotalPagadoSupabase(pagado);
    } catch (error) {
      console.error("Error al cargar Supabase:", error);
    }
  };

  useEffect(() => {
    if (isClient) {
      fetchProductividad();
    }
  }, [isClient, mesActual, anioActual]);

  const guardarSemanaSupabase = async () => {
    if (!inputSemana || !inputGenerado) return alert("Rellena el nombre de la semana y los euros generados.");
    const mesStr = `${anioActual}-${mesActual}`;
    try {
      await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          mes_año: mesStr,
          semana: inputSemana,
          importe_generado: parseFloat(inputGenerado)
        })
      });
      setInputSemana("");
      setInputGenerado("");
      fetchProductividad();
    } catch (error) {
      console.error("Error al guardar semana:", error);
      alert("Error al guardar la semana. Revisa la conexión.");
    }
  };

  const guardarPagadoSupabase = async () => {
    if (!inputPagado) return alert("Introduce la cantidad que le pagaron en nómina por productividad.");
    const mesStr = `${anioActual}-${mesActual}`;
    try {
      await fetch(`${SUPABASE_URL}?on_conflict=mes_año,semana`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal'
        },
        body: JSON.stringify({
          mes_año: mesStr,
          semana: 'TOTAL_NOMINA',
          importe_pagado: parseFloat(inputPagado)
        })
      });
      setInputPagado("");
      fetchProductividad();
    } catch (error) {
      console.error("Error al guardar el pago:", error);
      alert("Error al guardar el pago. Revisa la conexión.");
    }
  };

  const eliminarSemanaSupabase = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres borrar esta fila de PowerBI?")) return;
    try {
      await fetch(`${SUPABASE_URL}?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      fetchProductividad();
    } catch (error) {
      console.error("Error al borrar:", error);
    }
  };
  // ---------------------------------------------

  const cambiarMes = (direccion: number) => {
    let nuevoMes = mesActual + direccion;
    let nuevoAnio = anioActual;
    if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio++; }
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio--; }
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
    setIngresoBanco("");
  };

  const diasDelMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const diasRender = [];
  let totalDiasTrabajadosMes = 0;

  for (let i = 1; i <= diasDelMes; i++) {
    const diaClave = `${anioActual}-${mesActual}-${i}`;
    const datosDia = diasData[diaClave] || { h: '', n: '', ed: '', en: '' };
    
    if (Number(datosDia.h) > 0 || Number(datosDia.n) > 0) totalDiasTrabajadosMes++;

    const totalDiaEuros = (
        (Number(datosDia.h) || 0) * precios.ordinaria +
        (Number(datosDia.n) || 0) * precios.nocturnidad +
        (Number(datosDia.ed) || 0) * precios.extDia +
        (Number(datosDia.en) || 0) * precios.extNoche
    );

    diasRender.push({ diaNum: i, clave: diaClave, datos: datosDia, totalEuros: totalDiaEuros });
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
  
  const retencionIRPF = salarioBruto * 0.02;
  const retencionSS = salarioBruto * 0.0655;
  const salarioNetoCalculado = salarioBruto - retencionIRPF - retencionSS;

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
        <button onClick={() => setTab('powerbi')} className={`px-4 py-2 rounded-full font-bold text-sm shadow transition-colors ${tab === 'powerbi' ? 'bg-yellow-500 text-gray-900' : 'bg-white text-gray-500 border'}`}>📊 PowerBI</button>
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

            <div className="hidden md:grid grid-cols-6 gap-2 bg-[#111827] text-yellow-500 font-bold text-[10px] uppercase p-3 rounded-xl mb-4 text-center items-center">
              <div>Día</div>
              <div>Total Turno (H)</div>
              <div>Plus Noct. (H)</div>
              <div>Ext. Día</div>
              <div>Ext. Noche</div>
              <div>Total Día</div>
            </div>

            <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {diasRender.map((d: any) => (
                  <div key={d.diaNum} className={`grid grid-cols-2 md:grid-cols-6 gap-2 p-3 items-center border-b border-gray-50 bg-white hover:bg-yellow-50/30 transition-colors`}>
                    
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

                    <div className="col-span-2 md:col-span-1 text-center font-bold text-gray-800 text-lg mt-2 md:mt-0 bg-gray-50 md:bg-transparent rounded-xl p-2 md:p-0">
                      {d.totalEuros > 0 ? `${d.totalEuros.toFixed(2)} €` : '-'}
                    </div>
                  </div>
                ))}
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
                <span className="text-yellow-700 font-bold uppercase text-xs">Incentivo Producción</span>
                <div className="flex items-center">
                    <input type="number" value={incentivoManual} onChange={(e) => setIncentivoManual(e.target.value)} className="w-20 text-right border-2 border-yellow-300 bg-white rounded-md p-1 font-bold text-gray-800 outline-none" />
                    <span className="ml-1 font-bold text-yellow-600">€</span>
                </div>
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

            <div className="mt-6 bg-[#111827] rounded-2xl p-6 text-center shadow-lg">
              <span className="block text-yellow-500 font-bold uppercase tracking-widest text-xs mb-1">Lo que debería llegar al banco</span>
              <span className="text-4xl font-extrabold text-white">{salarioNetoCalculado.toFixed(2)} €</span>
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-center font-bold text-gray-700 mb-4 uppercase tracking-wider text-sm">¿Cuánto te han ingresado?</h3>
              <div className="flex justify-center mb-4">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={ingresoBanco} 
                  onChange={(e) => setIngresoBanco(e.target.value)}
                  className="w-40 text-center border-2 border-blue-400 bg-white rounded-xl p-3 font-black text-blue-900 text-xl outline-none shadow-inner"
                />
                <span className="ml-2 font-black text-blue-900 text-2xl self-center">€</span>
              </div>

              <div className={`p-4 rounded-xl text-center font-bold border-2 transition-colors duration-300 ${colorFondo}`}>
                <span className={colorTexto}>{mensajeComparacion}</span>
              </div>
            </div>

          </div>
        )}

        {/* === PESTAÑA 3: POWERBI (NUEVA INTEGRACIÓN SUPABASE) === */}
        {tab === 'powerbi' && (
          <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4 text-center">💰 Control PowerBI: {NOMBRES_MESES[mesActual]}</h2>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <h4 className="font-bold text-gray-700 mb-3 uppercase text-xs tracking-wider">1. Añadir bloques de PowerBI</h4>
                <div className="flex flex-col md:flex-row gap-3">
                    <input type="text" placeholder="Ej: Semana 30-34" value={inputSemana} onChange={e => setInputSemana(e.target.value)} className="flex-1 border-2 border-gray-200 rounded-xl p-2 font-bold focus:border-yellow-500 outline-none text-center md:text-left" />
                    <div className="flex justify-center">
                        <input type="number" placeholder="Euros" value={inputGenerado} onChange={e => setInputGenerado(e.target.value)} step="0.01" className="w-28 border-2 border-r-0 border-gray-200 rounded-l-xl p-2 font-bold text-center focus:border-yellow-500 outline-none" />
                        <span className="bg-gray-200 border-2 border-l-0 border-gray-200 rounded-r-xl px-3 flex items-center font-bold text-gray-600">€</span>
                    </div>
                    <button onClick={guardarSemanaSupabase} className="bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-xl shadow hover:bg-yellow-400 active:scale-95 transition">Guardar</button>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                <h4 className="font-bold text-blue-800 mb-3 uppercase text-xs tracking-wider">2. Productividad en Nómina Oficial</h4>
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex flex-1 justify-center">
                        <input type="number" placeholder="Ingresado en nómina" value={inputPagado} onChange={e => setInputPagado(e.target.value)} step="0.01" className="w-full border-2 border-r-0 border-blue-200 rounded-l-xl p-2 font-bold text-blue-900 text-center focus:border-blue-500 outline-none" />
                        <span className="bg-blue-200 border-2 border-l-0 border-blue-200 rounded-r-xl px-3 flex items-center font-bold text-blue-800">€</span>
                    </div>
                    <button onClick={guardarPagadoSupabase} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl shadow hover:bg-blue-500 active:scale-95 transition">Registrar Pago</button>
                </div>
            </div>

            <hr className="my-6 border-gray-200" />
            
            <h4 className="font-bold text-gray-700 mb-4 uppercase text-sm tracking-wider text-center">📊 Resumen del Mes de PowerBI</h4>
            
            <ul className="space-y-2 mb-6">
                {semanasPowerBI.length === 0 && <li className="text-center text-gray-400 italic text-sm py-4">No hay semanas registradas este mes en la nube</li>}
                {semanasPowerBI.map(s => (
                    <li key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm">
                        <span className="font-bold text-gray-700 uppercase text-sm">{s.semana}</span>
                        <div className="flex items-center gap-4">
                            <span className="font-black text-gray-900">{parseFloat(s.importe_generado).toFixed(2)} €</span>
                            <button onClick={() => eliminarSemanaSupabase(s.id)} className="text-red-500 hover:bg-red-500 hover:text-white font-bold px-3 py-1 border border-red-200 rounded-md text-xs transition-colors">BORRAR</button>
                        </div>
                    </li>
                ))}
            </ul>

            {(() => {
                const totalGen = semanasPowerBI.reduce((acc, curr) => acc + parseFloat(curr.importe_generado || 0), 0);
                const diferencia = totalGen - totalPagadoSupabase;
                
                let colorCaja = "bg-gray-100 border-gray-300";
                let textoDeuda = "Introduce datos para comparar";
                let colorTexto = "text-gray-600";

                if (totalGen > 0 || totalPagadoSupabase > 0) {
                    if (Math.abs(diferencia) <= 0.05) {
                        colorCaja = "bg-green-100 border-green-500";
                        textoDeuda = "✅ CUENTAS CUADRADAS";
                        colorTexto = "text-green-700";
                    } else if (diferencia > 0.05) {
                        colorCaja = "bg-red-100 border-red-500";
                        textoDeuda = `❌ FALTAN ${diferencia.toFixed(2)} €`;
                        colorTexto = "text-red-700";
                    } else {
                        colorCaja = "bg-blue-100 border-blue-500";
                        textoDeuda = `🔵 PAGARON DE MÁS: ${Math.abs(diferencia).toFixed(2)} €`;
                        colorTexto = "text-blue-700";
                    }
                }

                return (
                    <div>
                        <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg border border-gray-200 mb-2">
                            <span className="font-semibold text-gray-600 text-sm">Total Generado (App PowerBI):</span>
                            <span className="font-bold text-gray-800">{totalGen.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                            <span className="font-semibold text-blue-800 text-sm">Total Cobrado (Nómina ETT):</span>
                            <span className="font-bold text-blue-900">{totalPagadoSupabase.toFixed(2)} €</span>
                        </div>
                        
                        <div className={`p-4 rounded-xl text-center font-black text-xl border-2 shadow-inner ${colorCaja} ${colorTexto}`}>
                            {textoDeuda}
                        </div>
                    </div>
                );
            })()}
          </div>
        )}

        {/* === PESTAÑA 4: PRECIOS === */}
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
