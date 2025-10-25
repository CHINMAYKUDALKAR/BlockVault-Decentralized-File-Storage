#!/usr/bin/env python
"""Stable backend runner without reloader for Codespaces/containers.
Falls back to in-memory DB quickly if Mongo unreachable.
"""
from blockvault import create_app
from werkzeug.serving import run_simple

app = create_app()

if __name__ == "__main__":
    run_simple("0.0.0.0", 5000, app, use_reloader=False, use_debugger=False)
