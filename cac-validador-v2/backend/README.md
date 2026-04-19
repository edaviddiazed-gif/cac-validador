# CAC-Validador v2 - Backend

Motor de validacion de reportes de cancer (Resolucion 0247/2014).
Expuesto como API REST con FastAPI.

## Requisitos

- Python 3.11+
- pip

## Instalacion rapida

```bash
cd cac-validador-v2/backend
pip install -r requirements.txt
```

## Correr en desarrollo

```bash
uvicorn app.main:app --reload --port 8000
```

Abre http://localhost:8000/docs para ver la documentacion interactiva.

## Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /salud | Healthcheck |
| GET | /info | Metadata del motor |
| POST | /validar-registro | Valida 1 reporte JSON |
| POST | /validar-archivo | Valida CSV con multiples registros |

## Ejemplo de uso

```bash
curl -X POST http://localhost:8000/validar-registro \
  -H "Content-Type: application/json" \
  -d @sample_payload.json
```

## Tests

```bash
pytest tests/test_api.py -v
```

## Docker

```bash
docker build -t cac-backend .
docker run -p 8000:8000 cac-backend
```
