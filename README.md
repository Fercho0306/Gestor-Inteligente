# 🧠 GestorInteligente – Tareas Dinámicas con Flujo Controlado

Gestor asincrónico de tareas con dependencias, ejecución paralela, reintentos y control de flujo lógico.  
Diseñado para flujos complejos donde el orden, la resiliencia y la adaptabilidad son clave.  
Parte del ecosistema inteligente de [BotellaControl](https://medium.com/@fernandofa0306/botellacontrol-inventario-inteligente-de-licores-con-ia-8fc8caabac18).

---

## 🚀 Características principales

- Control total del flujo de tareas con dependencias.
- Ejecución automática de tareas en paralelo cuando están listas.
- Recuperación ante errores mediante rutas alternativas (`onFallo()`).
- Detección básica de ciclos y bloqueos.
- Ideal para flujos dinámicos, backend, procesos industriales o pipelines.

---

## 📂 Contenido

| Archivo                       | Descripción                                                               |
|------------------------------|---------------------------------------------------------------------------|
| `GestorInteligenteAsync.js`  | Implementación funcional con `async/await` y ejecución paralela.          |
| `GestorInteligenteClase.js`  | Implementación OOP moderna con clase y métodos privados (ES2022).          |
| `GestorInteligenteObjeto.js` | Objeto literal reutilizable, ideal para scripts o flujos simples.         |

---

## 💻 Ejemplo básico

```js
const gestor = crearGestorInteligente();

gestor.definirTarea('validar', async () => {
  console.log("Validando...");
  return true;
});

gestor.definirTarea('procesar', async () => {
  console.log("Procesando...");
  return "OK";
}, ['validar']);

gestor.definirTarea('subir', async () => {
  console.log("Subiendo al servidor...");
  return "Hecho";
}, ['procesar']);

gestor.iniciar().then(resultados => {
  console.log("Resultados:", resultados);
});

```
## 💡 ¿Cuándo usarlo?

- Cuando necesitas ejecutar tareas con múltiples dependencias.
- Si tu flujo debe adaptarse dinámicamente a fallos o rutas alternativas.
- Para controlar procesos asincrónicos complejos sin perder claridad.
- En apps modernas que integran módulos, sensores, servicios o lógica distribuida.

```

```
## 🙋‍♂️ Autor
**Fernando Flores Alvarado**  
🔗 [LinkedIn](https://www.linkedin.com/in/fernando-flores-alvarado-2786b21b8/)  
📖 [Ver más publicaciones en Medium](https://medium.com/@fernandofa0306)

> “Un buen flujo no solo ejecuta… también decide cómo y cuándo hacerlo.” ⚙️🧠

```
