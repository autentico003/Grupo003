# AgroVision

AgroVision es una aplicación de escritorio basada en Electron diseñada como asistente agrícola para Guinea Ecuatorial. Proporciona una guía de cultivos, diagnóstico de enfermedades y plagas, predicción de rendimiento y soporte multilingüe.

## Características

- Diagnóstico visual de enfermedades y plagas con selección de imagen.
- Guía agrícola para cultivos como cacao, café, yuca y plátano.
- Cálculo de rendimiento estimado según tipo de suelo, estación y tamaño de la finca.
- Soporte de idiomas: Español, Francés, Fang y Picchi.
- Interfaz intuitiva tipo aplicación móvil, disponible como aplicación de escritorio.
-

## Estructura del proyecto

- `index.html` - Interfaz principal de la aplicación.
- `electron-main.js` - Entrada de Electron.
- `js/app.js` - Lógica de la aplicación, diagnóstico, guía y cálculo de rendimiento.
- `css/app.css` - Estilos de la aplicación.
- `data/enfermedades.json` - Datos de cultivos y enfermedades.
- `package.json` - Configuración de npm y Electron.
- `dist-out/` - Salida de compilación de la aplicación.

## Requisitos

- Node.js 18+ (recomendado)
- npm

## Instalación

1. Clona o copia el repositorio al equipo.
2. Abre la carpeta en tu terminal.
3. Instala dependencias:

```bash
npm install
```

## Ejecución en desarrollo

Para abrir la aplicación en modo desarrollo con Electron:

```bash
npm start
```

## Generar distribución portátil para Windows

```bash
npm run dist
```

El paquete generado se ubicará en `dist-out/`.

## Personalización

- La guía de cultivos y enfermedades se almacena en `data/enfermedades.json`.
- Las miniaturas de cultivos se configuran en `js/app.js` mediante `CROP_THUMB`.
- Los idiomas disponibles se definen en `js/app.js` dentro del objeto `languages`.

## Uso

1. Selecciona idioma en la pantalla de bienvenida.
2. Usa el menú principal para navegar entre:
   - Diagnóstico de plagas
   - Clima y rendimiento
   - Guía de cultivos
3. Para diagnóstico, sube una foto desde la galería o cámara.
4. Revisa el resultado de diagnóstico y recomendaciones.

## Notas importantes

- Actualmente el diagnóstico es de demostración y selecciona enfermedades de forma determinística desde los datos.
- Algunos idiomas aparecen como "PRONTO" y muestran una notificación cuando no están disponibles.
- Dado la limitaciones no hemos podido proporcionar todos los datos de entrenamiento, pero si se muestran algunos

## Licencia

Proyecto sin licencia especificada (`UNLICENSED`).
