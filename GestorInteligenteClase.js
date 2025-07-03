// GestorInteligenteClase.js
// Clase moderna para gestión de tareas asincrónicas con dependencias
// Estilo orientado a objetos (OOP) con métodos privados (ES2022)
// Incluye flujo controlado, ejecución paralela y recuperación ante fallos

/**
 * Clase que representa un gestor inteligente de tareas asincrónicas
 * con dependencias, control de flujo y recuperación ante fallos.
 * 
 * Características:
 * - Permite definir tareas con dependencias lógicas.
 * - Ejecuta tareas disponibles en paralelo automáticamente cuando están listas.
 * - Soporta la configuracion de tareas alternativas ante fallos mediante onFallo().
 * - Administra internamente el flujo de ejecución, gestionando el estado de cada tarea.
 * 
 * Recomendado para aplicaciones empresariales con estructuras complejas y reutilizables.
 */ 
class GestorInteligente {
  /**
   * Constructor del gestor inteligente.
   * 
   * Inicializa las estructuras internas para gestionar tareas,
   * sus dependencias, estados y rutas alternativas en caso de fallo.
   * 
   * No recibe parámetros. La configuración de tareas se realiza
   * posteriormente mediante métodos como definirTarea() y onFallo().
   */
  constructor() {
    this.tareas = new Map();
    this.dependencias = new Map();
    this.pendientes = new Set();
    this.estado = {};
    this.enCasoDeFallo = new Map();
  }

  /**
   * Define una tarea y sus dependencias.
   * 
   * @param {string} nombre - Nombre de la tarea.
   * @param {Function} funcion - Función asíncrona que ejecuta la tarea.
   * @param {string[]} [deps=[]] - Arreglo de nombres de tareas de las que depende.
   */
  definirTarea(nombre, funcion, deps = []) {
    this.tareas.set(nombre, funcion);
    this.dependencias.set(nombre, [...deps]);
    this.estado[nombre] = 'pendiente';
    this.pendientes.add(nombre);
  }

  /**
   * Asocia una tarea alternativa a ejecutar si la tarea original falla.
   * 
   * @param {string} tareaOriginal - Nombre de la tarea principal.
   * @param {string} tareaAlternativa - Nombre de la tarea alternativa.
   */
  onFallo(tareaOriginal, tareaAlternativa) {
    this.enCasoDeFallo.set(tareaOriginal, tareaAlternativa);
  }

  /**
   * Ejecuta una tarea y gestiona su estado y errores.
   * 
   * @param {string} nombre - Nombre de la tarea.
   * @param {Object} resultados - Objeto para almacenar resultados.
   * @returns {Promise<void>}
   */
  async #ejecutarTarea(nombre, resultados) {
    const fn = this.tareas.get(nombre);
    if (!fn) throw new Error(`Tarea '${nombre}' no definida.`);

    try {
      const res = await fn();
      resultados[nombre] = res;
      this.estado[nombre] = 'completado';
    } catch (e) {
      this.estado[nombre] = 'fallido';
      console.error(`Error en '${nombre}':`, e.message);

      const alternativa = this.enCasoDeFallo.get(nombre);
      if (alternativa && this.tareas.has(alternativa)) {
        console.warn(`Ejecutando tarea alternativa '${alternativa}'...`);
        return await this.#ejecutarTarea(alternativa, resultados);
      }
    }
  }

  /**
   * Inicia la ejecución del flujo de tareas respetando sus dependencias.
   * 
   * @returns {Promise<Object>} Resultados de las tareas ejecutadas.
   */
  async iniciar() {
    const resultados = {};
    while (this.pendientes.size > 0) {
      const tareasListas = Array.from(this.pendientes).filter(tarea => {
        const deps = this.dependencias.get(tarea);
        return deps.every(dep => this.estado[dep] === 'completado');
      });

      if (tareasListas.length === 0) {
        console.warn("Ciclo detectado o dependencia no resuelta. Abortando.");
        break;
      }

      await Promise.all(tareasListas.map(async tarea => {
        await this.#ejecutarTarea(tarea, resultados);
        this.pendientes.delete(tarea);
      }));
    }
    return resultados;
  }

  /**
   * Devuelve el estado actual de las tareas.
   * 
   * @returns {Object} Copia del estado de ejecución.
   */
  estadoActual() {
    return { ...this.estado };
  }
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

const gestor1 = new GestorInteligente();

gestor1.definirTarea('validarBotella', async () => {
  console.log('Botella validada');
  return true;
});

gestor1.definirTarea('leerEtiqueta', async () => {
  await new Promise(r => setTimeout(r, 1000));
  console.log('Etiqueta leída');
  return 'Etiqueta';
}, ['validarBotella']);

gestor1.definirTarea('leerQR', async () => {
  await new Promise(r => setTimeout(r, 800));
  console.log('QR leído');
  return 'CódigoQR';
}, ['validarBotella']);

gestor1.definirTarea('unificar', async () => {
  console.log('Datos unificados');
  return 'Resultado final';
}, ['leerEtiqueta', 'leerQR']);

gestor1.onFallo('leerQR', 'reintentarQR');

gestor1.definirTarea('reintentarQR', async () => {
  console.warn("Reintentando QR manualmente...");
  return 'QR Manual';
});

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

const gestor2 = new GestorInteligente();

gestor2.definirTarea('cargarImagen', async () => {
  throw new Error("No se pudo cargar la imagen");
});

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