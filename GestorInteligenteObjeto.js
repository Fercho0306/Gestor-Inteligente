// GestorInteligenteObjeto.js
// Implementación mediante objeto literal para gestión de tareas asincrónicas
// Control secuencial de dependencias, ejecución paralela y manejo de errores
// Alternativa simple y potente sin clases ni funciones constructoras

/**
 * Objeto literal que actúa como gestor inteligente de tareas asincrónicas con dependencias.
 * 
 * Características:
 * - Define tareas con sus dependencias de forma declarativa.
 * - Ejecuta en paralelo las tareas listas para su ejecución.
 * - Soporta la configuracion de tareas alternativas ante fallos mediante onFallo().
 * - Mantiene un control simple y efectivo del flujo.
 * 
 * Ideal para casos con enfoque funcional y directo, de uso único, scripts puntuales o como singleton reutilizable.
 * 
 * -----
 * Recomendación:
 * -----
 *     - Si vas a reutilizar muchas instancias (como en el ejemplo 2),
 *       considera usar la versión (GestorInteligenteAsync.js)
 *       o la versión basada en clase (GestorInteligenteClase.js).
 * 
 *     - Este objeto literal es perfecto para casos de uso único o como singleton.
 */
const GestorInteligente = {

  // *******************************************************
  //                    Propiedades
  // *******************************************************

  /**
   * Mapa de tareas definidas, donde cada clave es el nombre de la tarea
   * y el valor es la función asíncrona que la ejecuta.
   * 
   * @type {Map<string, Function>}
   */
  tareas: new Map(),

  /**
   * Mapa de dependencias entre tareas. Cada clave representa una tarea
   * y su valor es un arreglo de nombres de tareas de las que depende.
   * 
   * @type {Map<string, string[]>}
   */
  dependencias: new Map(),

  /**
   * Conjunto de tareas aún pendientes por ejecutar.
   * 
   * @type {Set<string>}
   */
  pendientes: new Set(),

  /**
   * Objeto que registra el estado actual de cada tarea:
   * 'pendiente', 'completado' o 'fallido'.
   * 
   * @type {Record<string, 'pendiente' | 'completado' | 'fallido'>}
   */
  estado: {},

  /**
   * Mapa que define qué tarea alternativa ejecutar si una falla.
   * La clave es el nombre de la tarea original, el valor es la alternativa.
   * 
   * @type {Map<string, string>}
   */
  enCasoDeFallo: new Map(),

  // *******************************************************
  //                    Métodos
  // *******************************************************

  /**
   * Define una nueva tarea con su lógica y dependencias.
   * 
   * @param {string} nombre - Nombre de la tarea.
   * @param {Function} funcion - Función asíncrona a ejecutar.
   * @param {Array<string>} [deps=[]] - Lista de tareas de las que depende.
   */
  definirTarea(nombre, funcion, deps = []) {
    this.tareas.set(nombre, funcion);
    this.dependencias.set(nombre, [...deps]);
    this.estado[nombre] = 'pendiente';
    this.pendientes.add(nombre);
  },

 /**
   * Define una tarea alternativa que se ejecutará si otra falla.
   * 
   * @param {string} tareaOriginal - Nombre de la tarea que puede fallar.
   * @param {string} tareaAlternativa - Nombre de la tarea que actuará como respaldo.
   */
  onFallo(tareaOriginal, tareaAlternativa) {
    this.enCasoDeFallo.set(tareaOriginal, tareaAlternativa);
  },

 /**
   * Ejecuta una tarea y maneja errores mediante tareas alternativas.
   * 
   * @param {string} nombre - Nombre de la tarea a ejecutar.
   * @param {Object} resultados - Objeto para almacenar resultados.
   */
  async ejecutarTarea(nombre, resultados) {
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
        return await this.ejecutarTarea(alternativa, resultados);
      }
    }
  },

 /**
   * Inicia la ejecución del gestor, resolviendo tareas según dependencias.
   * 
   * @returns {Promise<Object>} Resultados de todas las tareas completadas.
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
        await this.ejecutarTarea(tarea, resultados);
        this.pendientes.delete(tarea);
      }));
    }
    return resultados;
  },

 /**
   * Devuelve una copia del estado actual de todas las tareas.
   * 
   * @returns {Object} Estados: 'pendiente', 'completado', 'fallido'
   */
  estadoActual() {
    return { ...this.estado };
  }
};


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

GestorInteligente.definirTarea('validarBotella', async () => {
  console.log('Botella validada');
  return true;
});

GestorInteligente.definirTarea('leerEtiqueta', async () => {
  await new Promise(r => setTimeout(r, 1000)); // Simula retraso
  console.log('Etiqueta leída');
  return 'Etiqueta';
}, ['validarBotella']);

GestorInteligente.definirTarea('leerQR', async () => {
  await new Promise(r => setTimeout(r, 800)); // Simula retraso diferente
  console.log('QR leído');
  return 'CódigoQR';
}, ['validarBotella']);

GestorInteligente.definirTarea('unificar', async () => {
  console.log('Datos unificados');
  return 'Resultado final';
}, ['leerEtiqueta', 'leerQR']);

GestorInteligente.onFallo('leerQR', 'reintentarQR');

GestorInteligente.definirTarea('reintentarQR', async () => {
  console.warn("Reintentando QR manualmente...");
  return 'QR Manual';
});

(async () => {
  const resultados1 = await GestorInteligente.iniciar();
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

const gestorBackup = Object.create(GestorInteligente);
gestorBackup.tareas = new Map();
gestorBackup.dependencias = new Map();
gestorBackup.pendientes = new Set();
gestorBackup.estado = {};
gestorBackup.enCasoDeFallo = new Map();

gestorBackup.definirTarea('cargarImagen', async () => {
  throw new Error("No se pudo cargar la imagen");
});

gestorBackup.definirTarea('modoManual', async () => {
  console.log("Carga manual iniciada tras error");
  return 'ManualOK';
});

gestorBackup.onFallo('cargarImagen', 'modoManual');

gestorBackup.definirTarea('procesar', async () => {
  console.log("Procesando imagen");
  return 'Procesado';
}, ['cargarImagen']);

(async () => {
  const resultados2 = await gestorBackup.iniciar();
  console.log("Resultados finales (gestor2):", resultados2);
})();