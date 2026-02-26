# 🎬 HLS to MP4 Converter

Web app para converter streams HLS/M3U8 para MP4 com player integrado e interface criativa.

## Stack
- **Backend**: Python / FastAPI + ffmpeg
- **Frontend**: React + Vite + TailwindCSS
- **Deploy**: Docker Compose

## Funcionalidades
- Upload de arquivo `.m3u8` / `.m3u` ou link de URL
- Conversão para MP4 via ffmpeg
- Player de vídeo integrado (HLS.js)
- Histórico de arquivos convertidos
- Interface com tema dark criativo

## Rodar localmente

```bash
docker compose up --build
```

Frontend: http://localhost:5173  
Backend: http://localhost:8000

## Estrutura

```
├── backend/          # FastAPI + ffmpeg
├── frontend/         # React + Vite
├── docker-compose.yml
└── README.md
```
