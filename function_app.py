"""
Azure Functions entry point for Tophexity Backend.

This wraps the FastAPI application for deployment on Azure Functions.
Uses httpx ASGI transport to bridge Azure Function HTTP triggers to FastAPI.
"""
import azure.functions as func
import logging

from httpx import AsyncClient, ASGITransport

from app.main import app as fastapi_app

logging.basicConfig(level=logging.INFO)

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


@app.route(route="{*path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info("Azure Function received: %s %s", req.method, req.url)

    url = str(req.url)
    from urllib.parse import urlparse
    parsed = urlparse(url)
    path = parsed.path
    if parsed.query:
        path_and_query = path + "?" + parsed.query
    else:
        path_and_query = path

    headers = dict(req.headers)
    headers.pop("host", None)
    headers.pop("x-azure-ref", None)

    body = req.get_body()

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://localhost") as client:
        try:
            response = await client.request(
                method=req.method,
                url=path_and_query,
                headers=headers,
                content=body if body else None,
                timeout=300.0,
            )
            resp_headers = dict(response.headers)
            resp_headers.pop("content-length", None)
            resp_headers.pop("content-type", None)
            return func.HttpResponse(
                body=response.content,
                status_code=response.status_code,
                headers=resp_headers,
                mimetype=response.headers.get("content-type", "application/json"),
            )
        except Exception as e:
            import traceback
            logging.error("Error bridging to FastAPI: %s\n%s", str(e), traceback.format_exc())
            return func.HttpResponse(
                body='{"detail": "Internal server error"}',
                status_code=500,
                mimetype="application/json",
            )
