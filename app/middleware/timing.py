import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.logging import logger


class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.perf_counter()
        response = await call_next(request)
        elapsed = time.perf_counter() - start_time
        logger.info(
            "%s %s %s %.4fs",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
        )
        response.headers["X-Process-Time"] = f"{elapsed:.4f}"
        return response
