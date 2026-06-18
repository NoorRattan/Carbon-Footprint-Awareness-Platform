"""Rate limiter singleton for use across all route files.

Import `limiter` from this module in both main.py and route files.
Do NOT import from main.py — that causes a circular import.

Note on multi-instance behaviour: slowapi uses in-memory counters per IP.
On Cloud Run with multiple instances, rate limits are not shared across
instances. This is acceptable for this application (personal tracker,
not a high-value attack target). Pydantic validation is the primary
defence against abuse. Documented in README under Known Limitations.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
