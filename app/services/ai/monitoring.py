"""Enhanced health monitoring for the AI platform."""

from __future__ import annotations

import os
import sys
import time
from typing import Any

try:
    import psutil
    _HAS_PSUTIL = True
except ImportError:
    psutil = None  # type: ignore[assignment]
    _HAS_PSUTIL = False

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import logger
from app.services.ai.circuit_breaker import circuit_breaker
from app.services.ai.client import get_ai_client
from app.services.ai.prompt_cache import prompt_cache

# Module-level startup timestamp
_START_TIME: float = time.monotonic()


class HealthMonitor:
    """Comprehensive health monitoring for the AI platform."""

    async def deep_health_check(self, db: AsyncSession) -> dict[str, Any]:
        ai_status = await self._check_ai_service()
        db_status = await self.check_database(db)
        memory = self.get_system_info()
        config = self._get_config_summary()

        # Overall status
        all_healthy = (
            ai_status.get("azure_connected", False)
            and db_status.get("connected", False)
            and memory.get("available", False)
        )

        return {
            "status": "healthy" if all_healthy else "degraded",
            "ai_status": ai_status,
            "db_status": db_status,
            "prompt_cache": prompt_cache.get_stats(),
            "circuit_breaker": circuit_breaker.get_stats(),
            "memory_usage": memory,
            "uptime_seconds": round(time.monotonic() - _START_TIME, 1),
            "config_status": config,
        }

    async def check_database(self, db: AsyncSession) -> dict[str, Any]:
        start = time.monotonic()
        try:
            await db.execute(text("SELECT 1"))
            latency_ms = (time.monotonic() - start) * 1000
            return {
                "connected": True,
                "latency_ms": round(latency_ms, 2),
                "error": None,
            }
        except Exception as e:
            latency_ms = (time.monotonic() - start) * 1000
            logger.error("Database health check failed: %s", str(e)[:200])
            return {
                "connected": False,
                "latency_ms": round(latency_ms, 2),
                "error": str(e)[:300],
            }

    def get_system_info(self) -> dict[str, Any]:
        if _HAS_PSUTIL:
            return self._get_system_info_psutil()
        return self._get_system_info_builtin()

    def _get_system_info_psutil(self) -> dict[str, Any]:
        try:
            process = psutil.Process(os.getpid())
            mem = process.memory_info()
            vm = psutil.virtual_memory()
            return {
                "process_rss_mb": round(mem.rss / (1024 * 1024), 2),
                "process_vms_mb": round(mem.vms / (1024 * 1024), 2),
                "system_total_mb": round(vm.total / (1024 * 1024), 2),
                "system_available_mb": round(vm.available / (1024 * 1024), 2),
                "system_used_pct": vm.percent,
                "cpu_count": psutil.cpu_count(),
                "cpu_percent": psutil.cpu_percent(interval=0.1),
                "pid": os.getpid(),
                "available": True,
            }
        except Exception as e:
            logger.warning("Failed to get system info (psutil): %s", str(e)[:200])
            return {"available": False, "error": str(e)[:200]}

    def _get_system_info_builtin(self) -> dict[str, Any]:
        try:
            info: dict[str, Any] = {
                "pid": os.getpid(),
                "available": True,
                "psutil_available": False,
            }

            if sys.platform == "win32":
                try:
                    import ctypes
                    kernel32 = ctypes.windll.kernel32
                    # MEMORYSTATUSEX
                    class MEMORYSTATUSEX(ctypes.Structure):
                        _fields_ = [
                            ("dwLength", ctypes.c_ulong),
                            ("dwMemoryLoad", ctypes.c_ulong),
                            ("ullTotalPhys", ctypes.c_ulonglong),
                            ("ullAvailPhys", ctypes.c_ulonglong),
                            ("ullTotalPageFile", ctypes.c_ulonglong),
                            ("ullAvailPageFile", ctypes.c_ulonglong),
                            ("ullTotalVirtual", ctypes.c_ulonglong),
                            ("ullAvailVirtual", ctypes.c_ulonglong),
                            ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
                        ]
                    stat = MEMORYSTATUSEX()
                    stat.dwLength = ctypes.sizeof(stat)
                    kernel32.GlobalMemoryStatusEx(ctypes.byref(stat))
                    total_mb = round(stat.ullTotalPhys / (1024 * 1024), 2)
                    avail_mb = round(stat.ullAvailPhys / (1024 * 1024), 2)
                    info["system_total_mb"] = total_mb
                    info["system_available_mb"] = avail_mb
                    info["system_used_pct"] = round(
                        stat.dwMemoryLoad / 100 * 100, 1
                    )
                except Exception:
                    info["system_total_mb"] = "unknown"
                    info["system_available_mb"] = "unknown"
            else:
                try:
                    with open("/proc/meminfo") as f:
                        mem_data = {}
                        for line in f:
                            parts = line.split(":")
                            if len(parts) == 2:
                                key = parts[0].strip()
                                val = parts[1].strip().split()[0]
                                mem_data[key] = int(val)
                    total_mb = round(mem_data.get("MemTotal", 0) / 1024, 2)
                    avail_mb = round(mem_data.get("MemAvailable", 0) / 1024, 2)
                    info["system_total_mb"] = total_mb
                    info["system_available_mb"] = avail_mb
                    info["system_used_pct"] = round(
                        (1 - avail_mb / total_mb) * 100, 1
                    ) if total_mb > 0 else 0.0
                except Exception:
                    info["system_total_mb"] = "unknown"
                    info["system_available_mb"] = "unknown"

            return info
        except Exception as e:
            logger.warning("Failed to get system info (builtin): %s", str(e)[:200])
            return {"available": False, "error": str(e)[:200]}

    async def _check_ai_service(self) -> dict[str, Any]:
        client = get_ai_client()
        try:
            result = await client.health()
            return result
        except Exception as e:
            logger.warning("AI service health check failed: %s", str(e)[:200])
            return {
                "status": "error",
                "azure_connected": False,
                "deployment_available": False,
                "authentication_valid": False,
                "latency_ms": None,
                "model": get_settings().AI_DEPLOYMENT_NAME,
                "endpoint": get_settings().AI_ENDPOINT,
                "error": str(e)[:300],
            }

    def _get_config_summary(self) -> dict[str, Any]:
        settings = get_settings()
        return {
            "debug": settings.DEBUG,
            "ai_endpoint": _mask_url(settings.AI_ENDPOINT),
            "ai_api_key_configured": bool(settings.AI_API_KEY),
            "ai_deployment": settings.AI_DEPLOYMENT_NAME,
            "ai_max_tokens": settings.AI_MAX_TOKENS,
            "ai_temperature": settings.AI_TEMPERATURE,
            "ai_prompt_cache_ttl": settings.AI_PROMPT_CACHE_TTL,
            "rate_limit_per_user_min": settings.AI_RATE_LIMIT_PER_USER_PER_MINUTE,
            "rate_limit_per_hour": settings.AI_RATE_LIMIT_PER_HOUR,
            "rate_limit_per_day": settings.AI_RATE_LIMIT_PER_USER_PER_DAY,
            "circuit_breaker_threshold": settings.AI_CIRCUIT_BREAKER_THRESHOLD,
            "circuit_breaker_timeout": settings.AI_CIRCUIT_BREAKER_TIMEOUT,
            "admin_api_enabled": settings.ADMIN_API_ENABLED,
            "security_injection_detection": settings.AI_PROMPT_INJECTION_ENABLED,
            "security_jailbreak_detection": settings.AI_JAILBREAK_DETECTION_ENABLED,
        }


def _mask_url(url: str) -> str:
    """Mask a URL so only the domain/path pattern is visible, keys are hidden."""
    if not url:
        return ""
    from urllib.parse import urlparse
    try:
        parsed = urlparse(url)
        return f"{parsed.scheme}://***{parsed.path}"
    except Exception:
        return "***"


health_monitor = HealthMonitor()
