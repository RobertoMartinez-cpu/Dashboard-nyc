const API_URL = 'http://localhost:5000/api';
let chartInstance = null;

// Cargar métricas y KPIs
async function actualizarMetricas() {
  try {
    const res = await fetch(`${API_URL}/metricas`);
    const data = await res.json();

    // Actualizar KPIs
    document.getElementById('kpi-total').textContent = data.kpis.total_viajes || 0;
    document.getElementById('kpi-promedio').textContent = `$${parseFloat(data.kpis.tarifa_promedio || 0).toFixed(2)}`;
    document.getElementById('kpi-cancelados').textContent = data.kpis.viajes_cancelados || 0;

    // Actualizar Gráfico
    renderizarGrafico(data.distribucion_zonas);
  } catch (error) {
    console.error('Error cargando métricas:', error);
  }
}

// Cargar tabla de registros
async function cargarTabla() {
  const tbody = document.getElementById('tabla-cuerpo');
  try {
    const res = await fetch(`${API_URL}/viajes`);
    const viajes = await res.json();

    tbody.innerHTML = '';
    if (viajes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros disponibles.</td></tr>';
      return;
    }

    viajes.forEach(v => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${v.id_viaje}</td>
        <td><strong>Zona ${v.zona_origen_id}</strong></td>
        <td>$${parseFloat(v.monto_tarifa).toFixed(2)}</td>
        <td><span class="badge badge-${v.estado_viaje}">${v.estado_viaje}</span></td>
        <td>${v.fecha}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">Error al cargar datos desde el backend.</td></tr>';
  }
}

// Dibujar/Actualizar Gráfico con Chart.js
function renderizarGrafico(zonas) {
  const ctx = document.getElementById('graficoZonas').getContext('2d');
  const labels = zonas.map(z => `Zona ${z.zona_origen_id}`);
  const valores = zonas.map(z => z.total);

  if (chartInstance) {
    chartInstance.destroy(); // Destruye el anterior para evitar superposiciones
  }

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cantidad de Viajes',
        data: valores,
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}

// Escuchar envío del formulario
document.getElementById('form-viaje').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const alerta = document.getElementById('alerta-form');
  const zona = document.getElementById('zona_id').value;
  const tarifa = document.getElementById('tarifa').value;
  const estado = document.getElementById('estado').value;

  try {
    const res = await fetch(`${API_URL}/viajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zona_origen_id: zona,
        monto_tarifa: tarifa,
        estado_viaje: estado
      })
    });

    const resultado = await res.json();

    if (res.ok) {
      alerta.textContent = '¡Registro insertado con éxito!';
      alerta.className = 'alerta alerta-exito';
      alerta.style.display = 'block';
      document.getElementById('form-viaje').reset();

      // Recargamos vista
      actualizarMetricas();
      cargarTabla();
    } else {
      throw new Error(resultado.error || 'Error al guardar');
    }
  } catch (err) {
    alerta.textContent = err.message;
    alerta.className = 'alerta alerta-error';
    alerta.style.display = 'block';
  }

  setTimeout(() => { alerta.style.display = 'none'; }, 4000);
});

// Botón de recargar manual
document.getElementById('btn-recargar').addEventListener('click', () => {
  actualizarMetricas();
  cargarTabla();
});

// Carga inicial al abrir el navegador
document.addEventListener('DOMContentLoaded', () => {
  actualizarMetricas();
  cargarTabla();
});