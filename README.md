# Falco App

Sistema POS y de gestion para cafeteria de especialidad, construido con Tauri v2.

## Stack

- Frontend: React 19 + TypeScript + Vite
- Backend: Node.js + Express + SQLite (`better-sqlite3`)
- Desktop: Tauri v2 (Rust)

## Requisitos (primera vez en Windows)

1. Node.js y npm instalados.
2. Rust instalado con `rustup`.
3. Toolchain Rust en `msvc` (no `gnu`).
4. Visual Studio 2022 Build Tools con workload de C++.
5. Microsoft Edge WebView2 Runtime.

## Setup inicial recomendado

```powershell
# 1) Dependencias JS (root)
npm install

# 2) Confirmar toolchain Rust para Tauri
rustup toolchain install stable-x86_64-pc-windows-msvc
rustup default stable-x86_64-pc-windows-msvc
rustup target add x86_64-pc-windows-msvc
```

Si venis con target `gnu` y aparece error de `dlltool.exe`:

```powershell
rustup target remove x86_64-pc-windows-gnu
```

Instalar Build Tools y WebView2 con `winget`:

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.Windows11SDK.22621 --includeRecommended"
winget install Microsoft.EdgeWebView2Runtime
```

## Ejecutar en desarrollo

```powershell
npm run develop
```

Este comando levanta backend + frontend + Tauri.

## Scripts utiles

- `npm run develop`: stack completo (backend + frontend + tauri).
- `npm run dev`: frontend (Vite).
- `npm run dev:backend`: backend (Express).
- `npm run dev:tauri`: Tauri.
- `npm run lint`: lint de frontend.
- `npm run build`: build de produccion.

## Troubleshooting rapido

- Error `dlltool.exe: program not found`:
  Rust esta en target `windows-gnu`. Cambiar a `windows-msvc` (ver setup inicial).
- `cargo` / `rustup` no se reconocen:
  agregar `C:\Users\<tu-usuario>\.cargo\bin` al PATH y abrir una terminal nueva.
- `npm` bloqueado en PowerShell por policy:
  usar `npm.cmd` en esa terminal.
