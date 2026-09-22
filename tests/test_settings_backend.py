"""Unit and integration tests for Settings & Providers backend features."""
import os
import pytest
from fastapi.testclient import TestClient

import clippyme.api.app as app_module
from clippyme.domain.mock_publisher_adapter import MockPublisherAdapter
from clippyme.domain.social_publisher_port import (
    get_social_publisher,
    set_social_publisher,
)
from clippyme.domain.zernio_publisher_adapter import ZernioPublisherAdapter
from clippyme.storage.config_store import (
    load_persistent_config,
    save_persistent_config,
)

ORIGIN = {"Origin": "http://localhost:5175"}


@pytest.fixture(autouse=True)
def cleanup_state():
    set_social_publisher(None)
    yield
    set_social_publisher(None)


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A trusted-origin client whose disk writes land under a tmp dir."""
    monkeypatch.chdir(tmp_path)
    old_env = dict(os.environ)
    yield TestClient(app_module.app, headers=ORIGIN)
    os.environ.clear()
    os.environ.update(old_env)


def test_publishing_provider_config_store(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    # Default is zernio when not set
    config = load_persistent_config()
    assert config.get("PUBLISHING_PROVIDER") == "zernio"

    # Save mock provider
    ok = save_persistent_config({"PUBLISHING_PROVIDER": "mock"})
    assert ok is True
    reloaded = load_persistent_config()
    assert reloaded["PUBLISHING_PROVIDER"] == "mock"
    assert os.environ.get("PUBLISHING_PROVIDER") == "mock"

    # Save zernio provider
    ok = save_persistent_config({"PUBLISHING_PROVIDER": "zernio"})
    assert ok is True
    reloaded = load_persistent_config()
    assert reloaded["PUBLISHING_PROVIDER"] == "zernio"
    assert os.environ.get("PUBLISHING_PROVIDER") == "zernio"


def test_social_publisher_port_resolves_from_persistent_config(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("PUBLISHING_PROVIDER", raising=False)
    monkeypatch.delenv("MOCK_PUBLISHER", raising=False)
    monkeypatch.delenv("ZERNIO_API_KEY", raising=False)

    # When persistent config has PUBLISHING_PROVIDER = "mock"
    save_persistent_config({"PUBLISHING_PROVIDER": "mock"})
    pub = get_social_publisher()
    assert isinstance(pub, MockPublisherAdapter)

    # When persistent config has PUBLISHING_PROVIDER = "zernio" and key is provided
    save_persistent_config({"PUBLISHING_PROVIDER": "zernio"})
    monkeypatch.setenv("ZERNIO_API_KEY", "test_zernio_key")
    pub = get_social_publisher()
    assert isinstance(pub, ZernioPublisherAdapter)


def test_api_config_publishing_provider_endpoint(client):
    # Round-trip update via /api/config
    r = client.post(
        "/api/config",
        json={"keys": {"PUBLISHING_PROVIDER": "mock"}},
    )
    assert r.status_code == 200
    assert r.json()["success"] is True

    got = client.get("/api/config").json()
    assert got["PUBLISHING_PROVIDER"] == "mock"

    # Reject invalid provider value
    r_bad = client.post(
        "/api/config",
        json={"keys": {"PUBLISHING_PROVIDER": "invalid_provider"}},
    )
    assert r_bad.status_code == 422


def test_api_config_hardware_endpoint(client):
    r = client.get("/api/config/hardware")
    assert r.status_code == 200
    data = r.json()

    # Verify expected schema and fields
    assert "device" in data
    assert "backend" in data
    assert "cuda_available" in data
    assert "device_name" in data
    assert "vram_gb" in data
    assert "total_ram_gb" in data
    assert "whisper_device" in data
    assert "whisper_model" in data

    assert data["backend"] in ("CUDA", "ROCm/HIP", "CPU")
    assert isinstance(data["cuda_available"], bool)
    assert isinstance(data["vram_gb"], (int, float))
    assert isinstance(data["total_ram_gb"], (int, float))
    assert isinstance(data["whisper_device"], str)
    assert isinstance(data["whisper_model"], str)
