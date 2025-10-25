from __future__ import annotations
from typing import Any, Dict, Optional
import time


class MemoryCollection:
    def __init__(self, name: str, store: Dict[str, Dict[str, Any]]):
        self.name = name
        self._store = store  # key -> document

    # Simplistic filter: equality match on all provided keys
    def _match(self, doc: Dict[str, Any], flt: Dict[str, Any]) -> bool:
        return all(doc.get(k) == v for k, v in flt.items())

    def find_one(self, flt: Dict[str, Any]):
        for doc in self._store.values():
            if self._match(doc, flt):
                return doc.copy()
        return None

    def update_one(self, flt: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        # Only supports $set and $setOnInsert used in code
        found_key: Optional[str] = None
        for key, doc in self._store.items():
            if self._match(doc, flt):
                found_key = key
                break
        if found_key is None:
            if not upsert:
                return
            # create new document
            new_doc: Dict[str, Any] = dict(flt)
            if "$setOnInsert" in update:
                new_doc.update(update["$setOnInsert"])  # type: ignore[index]
            if "$set" in update:
                new_doc.update(update["$set"])  # type: ignore[index]
            # simple key based on time + length
            key = f"{int(time.time()*1000)}_{len(self._store)}"
            self._store[key] = new_doc
        else:
            doc = self._store[found_key]
            if "$set" in update:
                doc.update(update["$set"])  # type: ignore[index]
            # $setOnInsert ignored if updating existing

    def delete_one(self, flt: Dict[str, Any]):
        for key, doc in list(self._store.items()):
            if self._match(doc, flt):
                del self._store[key]
                break

    def find(self, flt: Optional[Dict[str, Any]] = None):
        flt = flt or {}
        for doc in self._store.values():
            if self._match(doc, flt):
                yield doc.copy()

    # Minimal insert_one to mimic pymongo API used in tests
    class _InsertResult:
        def __init__(self, inserted_id: str):
            self.inserted_id = inserted_id

    def insert_one(self, doc: Dict[str, Any]):  # type: ignore
        key = f"{int(time.time()*1000)}_{len(self._store)}"
        # Simulate ObjectId with hex-ish token
        doc_id = key
        stored = dict(doc)
        stored["_id"] = doc_id
        self._store[key] = stored
        return MemoryCollection._InsertResult(doc_id)


class MemoryDB:
    def __init__(self):
        self._collections: Dict[str, Dict[str, Dict[str, Any]]] = {}

    def __getitem__(self, item: str) -> MemoryCollection:  # collection access
        if item not in self._collections:
            self._collections[item] = {}
        return MemoryCollection(item, self._collections[item])


_MEMORY_DB_SINGLETON = MemoryDB()


def get_memory_db() -> MemoryDB:
    return _MEMORY_DB_SINGLETON
