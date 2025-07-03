// GestorInteligenteAsync.js
// Componente para gestionar tareas asincrónicas con dependencias
// Implementación funcional basada en async/await
// Soporta ejecución paralela y lógica de recuperación con onFallo

/**
 * Crea un gestor inteligente de tareas asincrónicas con dependencias y flujo controlado.
 * 
 * Características:
 * - Ejecuta tareas automáticamente cuando sus dependencias han finalizado.
 * - Soporta ejecución paralela (Promise.all). Las tareas se ejecutan solo cuando sus dependencias han finalizado.
 * - Permite definir tareas alternativas en caso de fallo y redirigirse automáticamente (onFallo).
 * - Incluye detección básica de ciclos o bloqueos.
 * 
 * Ideal para flujos dinámicos de validación, lectura, procesamiento y envío en aplicaciones modernas..
 *
 * @returns {Object} Objeto con métodos para definir tareas, asignar alternativas en caso de fallo e iniciar el flujo.
 */
 
function crearGestorInteligente() {
  const tareas = new Map();
  const dependencias = new Map();
  const pendientes = new Set();
  const estado = {};
  const enCasoDeFallo = new Map();

  /**
   * Define una nueva tarea y sus dependencias.
   * 
   * @param {string} nombre - Identificador único de la tarea.
   * @param {Function} funcion - Función asíncrona que representa la tarea.
   * @param {string[]} [deps=[]] - Arreglo de nombres de tareas de las que depende.
   */
  function definirTarea(nombre, funcion, deps = []) {
    tareas.set(nombre, funcion);
    dependencias.set(nombre, [...deps]);
    estado[nombre] = 'pendiente';
    pendientes.add(nombre);
  }

  /**
   * Asocia una tarea alternativa que se ejecutará si la original falla.
   * 
   * @param {string} tareaOriginal - Nombre de la tarea principal.
   * @param {string} tareaAlternativa - Nombre de la tarea alternativa a ejecutar si falla la original.
   */
  function onFallo(tareaOriginal, tareaAlternativa) {
    enCasoDeFallo.set(tareaOriginal, tareaAlternativa);
  }

  /**
   * Ejecuta una tarea y gestiona su éxito o falla, incluyendo la lógica de recuperación si existe una alternativa.
   * 
   * @param {string} nombre - Nombre de la tarea a ejecutar.
   * @param {Object} resultados - Objeto donde se almacenan los resultados de cada tarea.
   * @returns {Promise<void>}
   */
  async function ejecutarTarea(nombre, resultados) {
    const fn = tareas.get(nombre);
    if (!fn) throw new Error(`Tarea '${nombre}' no definida.`);

    try {
      const res = await fn();
      resultados[nombre] = res;
      estado[nombre] = 'completado';
    } catch (e) {
      estado[nombre] = 'fallido';
      console.error(`Error en '${nombre}':`, e.message);

      const alternativa = enCasoDeFallo.get(nombre);
      if (alternativa && tareas.has(alternativa)) {
        console.warn(`Ejecutando tarea alternativa '${alternativa}'...`);
        return await ejecutarTarea(alternativa, resultados);
      }
    }
  }

  /**
   * Inicia la ejecución del gestor, resolviendo dependencias y ejecutando tareas listas en paralelo.
   * 
   * @returns {Promise<Object>} Objeto con los resultados de cada tarea ejecutada.
   */
  async function iniciar() {
    const resultados = {};
    while (pendientes.size > 0) {
      const tareasListas = Array.from(pendientes).filter(tarea => {
        const deps = dependencias.get(tarea);
        return deps.every(dep => estado[dep] === 'completado');
      });

      if (tareasListas.length === 0) {
        console.warn("Ciclo detectado o dependencia no resuelta. Abortando.");
        break;
      }

      await Promise.all(tareasListas.map(async tarea => {
        await ejecutarTarea(tarea, resultados);
        pendientes.delete(tarea);
      }));
    }
    return resultados;
  }

  return {
    definirTarea,
    onFallo,
    iniciar,
    estadoActual: () => ({ ...estado }) // Devuelve una copia del estado actual
  };
}


// ---------------------------------------------------------------------------
// Ejemplos de uso de GestorTareasInteligente


/**
 * Ejemplo 1:
 * 
 * - Flujo normal con tareas en paralelo
 *   Muestra cómo varias tareas se ejecutan en paralelo
 *   cuando ya están listas (sus dependencias se han cumplido).
 * 
 */
const gestor1 = crearGestorInteligente();

gestor1.definirTarea('validarBotella', async () => {
  console.log('Botella validada');
  return true;
});

gestor1.definirTarea('leerEtiqueta', async () => {
  await new Promise(r => setTimeout(r, 1000)); // Simula retraso
  console.log('Etiqueta leída');
  return 'Etiqueta';
}, ['validarBotella']);

gestor1.definirTarea('leerQR', async () => {
  await new Promise(r => setTimeout(r, 800)); // Simula retraso diferente
  console.log('QR leído');
  return 'CódigoQR';
}, ['validarBotella']);

gestor1.definirTarea('unificar', async () => {
  console.log('Datos unificados');
  return 'Resultado final';
}, ['leerEtiqueta', 'leerQR']);

(async () => {
  const resultados1 = await gestor1.iniciar();
  console.log("Resultados finales (gestor1):", resultados1);
})();


/**
 * Ejemplo 2:
 * 
 * - Manejo de errores con tarea alternativa (onFallo)
 *   Demuestra cómo una tarea fallida activa una ruta alternativa
 *   definida por el programador.
 * 
 */

const gestor2 = crearGestorInteligente();

gestor2.definirTarea('cargarImagen', async () => {
  throw new Error("No se pudo cargar la imagen");
}, []);

gestor2.definirTarea('modoManual', async () => {
  console.log("Carga manual iniciada tras error");
  return 'ManualOK';
});

gestor2.onFallo('cargarImagen', 'modoManual');

gestor2.definirTarea('procesar', async () => {
  console.log("Procesando imagen");
  return 'Procesado';
}, ['cargarImagen']);

(async () => {
  const resultados2 = await gestor2.iniciar();
  console.log("Resultados finales (gestor2):", resultados2);
})();
 