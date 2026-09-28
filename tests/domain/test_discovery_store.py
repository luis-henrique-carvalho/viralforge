"""Unit tests for DiscoveryStore persistence, indexing, and deduplication."""
import os
import stat
import pytest
from clippyme.domain.discovery.schemas import (
    DiscoveryFilter,
    DiscoveryItem,
    DiscoverySearch,
    DiscoverySearchStatus,
    PlatformType,
)
from clippyme.domain.discovery import store
from clippyme.domain.errors import NotFoundError, ValidationError


@pytest.fixture(autouse=True)
def isolated_discovery_store(tmp_path):
    orig_dir = store.get_discovery_dir()
    store.set_discovery_dir(str(tmp_path))
    yield tmp_path
    store.reset_discovery_store()
    store.set_discovery_dir(orig_dir)


def test_save_and_get_search():
    search = DiscoverySearch(
        id="search-123",
        platform=PlatformType.TIKTOK,
        query="achadinhos",
        filter_params=DiscoveryFilter(query="achadinhos", platform=PlatformType.TIKTOK, limit=10),
        status=DiscoverySearchStatus.QUEUED,
        created_at="2026-09-24T12:00:00Z",
    )

    saved = store.save_search(search)
    assert saved.id == "search-123"

    loaded = store.get_search("search-123")
    assert loaded is not None
    assert loaded.id == "search-123"
    assert loaded.query == "achadinhos"
    assert loaded.platform == PlatformType.TIKTOK
    assert loaded.status == DiscoverySearchStatus.QUEUED

    # File permissions check (0o600)
    file_path = store.get_search_path("search-123")
    mode = stat.S_IMODE(os.stat(file_path).st_mode)
    assert mode == 0o600


def test_list_searches_ordering_and_limit():
    searches = [
        DiscoverySearch(
            id=f"s-{i}",
            platform=PlatformType.INSTAGRAM,
            query=f"query-{i}",
            filter_params=DiscoveryFilter(query=f"query-{i}"),
            created_at=f"2026-09-24T10:0{i}:00Z",
        )
        for i in range(1, 5)
    ]

    for s in searches:
        store.save_search(s)

    summaries = store.list_searches(limit=3)
    assert len(summaries) == 3
    # Descending order by created_at: s-4, s-3, s-2
    assert summaries[0].id == "s-4"
    assert summaries[1].id == "s-3"
    assert summaries[2].id == "s-2"


def test_delete_search():
    search = DiscoverySearch(
        id="delete-me",
        platform=PlatformType.YOUTUBE,
        query="promocoes",
        filter_params=DiscoveryFilter(query="promocoes"),
        created_at="2026-09-24T12:00:00Z",
    )
    store.save_search(search)
    assert store.get_search("delete-me") is not None

    deleted = store.delete_search("delete-me")
    assert deleted is True
    assert store.get_search("delete-me") is None

    # Deleting again returns False (file does not exist)
    assert store.delete_search("delete-me") is False


def test_get_search_or_raise():
    with pytest.raises(NotFoundError):
        store.get_search_or_raise("non-existent-id")


def test_invalid_search_id():
    with pytest.raises(ValidationError):
        store.get_search_path("../traversal/id")


def test_mark_imported_status(monkeypatch):
    items = [
        DiscoveryItem(
            id="v1",
            platform=PlatformType.TIKTOK,
            url="https://tiktok.com/@user/video/111",
            title="Video 1",
        ),
        DiscoveryItem(
            id="v2",
            platform=PlatformType.TIKTOK,
            url="https://tiktok.com/@user/video/222",
            title="Video 2",
        ),
    ]

    fake_batches = [
        {
            "batch_id": "batch-xyz",
            "items": [
                {"source_url": "https://tiktok.com/@user/video/111"},
            ],
        }
    ]

    import clippyme.domain.viral_studio_store as vstore
    monkeypatch.setattr(vstore, "list_batches", lambda: fake_batches)

    enriched = store.mark_imported_status(items)
    assert len(enriched) == 2
    assert enriched[0].already_imported is True
    assert enriched[0].imported_batch_id == "batch-xyz"

    assert enriched[1].already_imported is False
    assert enriched[1].imported_batch_id is None


def test_save_search_from_dict_and_corrupt_index_recovery(tmp_path):
    # Save search using raw dict
    search_dict = {
        "id": "dict-search",
        "platform": PlatformType.TIKTOK,
        "query": "promo",
        "filter_params": {"query": "promo", "platform": "tiktok"},
        "status": DiscoverySearchStatus.SEARCHING,
        "created_at": "2026-09-24T12:00:00Z",
    }
    saved = store.save_search(search_dict)
    assert saved.id == "dict-search"
    assert saved.platform == PlatformType.TIKTOK
    assert saved.status == DiscoverySearchStatus.SEARCHING

    # Corrupt the index file and ensure list_searches does not crash
    index_file = store.get_index_path()
    with open(index_file, "w") as f:
        f.write("{invalid-json")

    assert store.list_searches() == []

    # Re-saving recovers index
    store.save_search(saved)
    summaries = store.list_searches()
    assert len(summaries) == 1
    assert summaries[0].id == "dict-search"


def test_mark_imported_status_empty_or_error(monkeypatch):
    assert store.mark_imported_status([]) == []

    import clippyme.domain.viral_studio_store as vstore
    monkeypatch.setattr(vstore, "list_batches", lambda: (_ for _ in ()).throw(RuntimeError("Disk failure")))

    items = [
        DiscoveryItem(
            id="v1",
            platform=PlatformType.TIKTOK,
            url="https://tiktok.com/@user/video/111",
            title="Video 1",
        )
    ]
    # Should not crash on batch list failure
    result = store.mark_imported_status(items)
    assert len(result) == 1
    assert result[0].already_imported is False

