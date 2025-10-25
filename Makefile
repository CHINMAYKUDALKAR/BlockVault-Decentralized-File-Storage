PY=python
VENV=.venv
PIP=$(VENV)/bin/pip
PYTHON=$(VENV)/bin/python

.PHONY: help venv install dev run run-mem test lint format clean

help:
	@echo "Targets:"
	@echo "  venv        - create virtual environment"
	@echo "  install     - install runtime dependencies"
	@echo "  dev         - install dev dependencies (editable)"
	@echo "  run         - run app with current .env"
	@echo "  run-mem     - run app with in-memory DB"
	@echo "  run-stable  - run app (no reloader) stable single process"
	@echo "  test        - run pytest"
	@echo "  lint        - run flake8 and mypy"
	@echo "  format      - run black"
	@echo "  clean       - remove venv and caches"

venv:
	@test -d $(VENV) || $(PY) -m venv $(VENV)

install: venv
	$(PIP) install -r requirements.txt

dev: venv
	$(PIP) install -e .[dev]

run: venv
	$(PYTHON) app.py

run-mem: venv
	MONGO_URI=memory://dev $(PYTHON) app.py

run-stable: venv
	$(PYTHON) scripts/run_backend.py

test: venv
	$(PYTHON) -m pytest -q

lint: venv
	$(VENV)/bin/flake8 blockvault
	$(VENV)/bin/mypy blockvault || true

format: venv
	$(VENV)/bin/black blockvault tests

clean:
	rm -rf $(VENV) .pytest_cache *.egg-info
	find . -name '__pycache__' -type d -exec rm -rf {} +
