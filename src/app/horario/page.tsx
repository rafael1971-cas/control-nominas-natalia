import React from 'react';

export default function HorarioPDF() {
  const dias = [
    { d: 1, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 2, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 3, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 4, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 5, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 6, e: '05:00', s: '13:45', h: 8, n: 1, ext: 0, obs: '' },
    { d: 7, e: '05:00', s: '13:45', h: 8, n: 1, ext: 0, obs: '' },
    { d: 8, e: '05:00', s: '13:45', h: 8, n: 1, ext: 0, obs: '' },
    { d: 9, e: '05:00', s: '13:45', h: 8, n: 1, ext: 0, obs: '' },
    { d: 10, e: '05:00', s: '13:45', h: 8, n: 1, ext: 0, obs: '' },
    { d: 11, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 12, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 13, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 14, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 15, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 16, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 17, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 18, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 19, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 20, e: '05:00', s: '13:45', h: 8, n: 1, ext: 0, obs: '' },
    { d: 21, e: '05:00', s: '13:45', h: 8, n: 1, ext: 0, obs: '' },
    { d: 22, e: '05:00', s: '13:45', h: 8, n: 1, ext: 0, obs: '' },
    { d: 23, e: '05:00', s: '14:45', h: 9, n: 1, ext: 1, obs: '1h Extra' },
    { d: 24, e: '05:00', s: '14:45', h: 9, n: 1, ext: 1, obs: '1h Extra' },
    { d: 25, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 26, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 27, e: '13:45', s: '23:30', h: 9, n: 0.5, ext: 1, obs: '1h Extra' },
    { d: 28, e: '13:45', s: '23:30', h: 9, n: 0.5, ext: 1, obs: '1h Extra' },
    { d: 29, e: '-', s: '-', h: 0, n: 0, ext: 0, obs: 'Descanso' },
    { d: 30, e: '13:45', s: '22:30', h: 8, n: 0.5, ext: 0, obs: '' },
    { d: 31, e: '13:45', s: '20:30', h: 6, n: 0, ext: 0, obs: '' },
  ];

  return (
    <div style={{ backgroundColor: 'white', color: 'black', padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '10px' }}>
        Registro de Jornada Laboral - Julio 2026
      </h2>
      <p><strong>Trabajadora:</strong> Natalia Kukushkina<br/>
      <strong>Empresa:</strong> CRIT INTERIM ESPAÑA ETT SL</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', textAlign: 'center', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid black' }}>
            <th style={{ padding: '6px', border: '1px solid #ccc' }}>Día</th>
            <th style={{ padding: '6px', border: '1px solid #ccc' }}>Entrada</th>
            <th style={{ padding: '6px', border: '1px solid #ccc' }}>Salida</th>
            <th style={{ padding: '6px', border: '1px solid #ccc' }}>Descanso</th>
            <th style={{ padding: '6px', border: '1px solid #ccc' }}>Horas Efectivas</th>
            <th style={{ padding: '6px', border: '1px solid #ccc' }}>Nocturnas</th>
            <th style={{ padding: '6px', border: '1px solid #ccc' }}>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {dias.map((dia) => (
            <tr key={dia.d} style={{ backgroundColor: dia.h === 0 ? '#f9fafb' : 'white' }}>
              <td style={{ padding: '6px', border: '1px solid #ccc', fontWeight: 'bold' }}>{dia.d}</td>
              <td style={{ padding: '6px', border: '1px solid #ccc' }}>{dia.e}</td>
              <td style={{ padding: '6px', border: '1px solid #ccc' }}>{dia.s}</td>
              <td style={{ padding: '6px', border: '1px solid #ccc' }}>{dia.h > 0 ? '45 min' : '-'}</td>
              <td style={{ padding: '6px', border: '1px solid #ccc', fontWeight: 'bold' }}>{dia.h > 0 ? `${dia.h} h` : '-'}</td>
              <td style={{ padding: '6px', border: '1px solid #ccc' }}>{dia.n > 0 ? `${dia.n} h` : '-'}</td>
              <td style={{ padding: '6px', border: '1px solid #ccc', color: dia.ext > 0 ? '#dc2626' : 'black', fontWeight: dia.ext > 0 ? 'bold' : 'normal' }}>
                {dia.obs}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px', padding: '15px', border: '2px solid black', backgroundColor: '#f8fafc' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>RESUMEN TOTAL DEL MES</h3>
        <ul style={{ margin: 0 }}>
          <li><strong>Días trabajados:</strong> 22 días</li>
          <li><strong>Total Horas Ordinarias:</strong> 174 horas</li>
          <li><strong>Total Horas Extras:</strong> 4 horas</li>
          <li><strong>Total Horas Plus Nocturnidad:</strong> 15,5 horas</li>
        </ul>
      </div>
    </div>
  );
}
