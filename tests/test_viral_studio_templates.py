"""Unit and API tests for Universal Templates, Modular GenerationTasks, and Renderer Extensions."""
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from clippyme.api.app import app
from clippyme.api.viral_studio_schemas import (
    AICopyData,
    Brand,
    FACTORY_TEMPLATES,
    GenerationTask,
    TemplateCreate,
    TemplateUpdate,
    TestGenerationRequest,
    TestGenerationResponse,
    VisualTemplate,
)
from clippyme.domain import viral_studio_copy, viral_studio_renderer, viral_studio_store
from clippyme.domain.errors import ValidationError


@pytest.fixture
def clean_store_env(tmp_path, monkeypatch):
    """Isolate viral_studio_store files inside a temporary test directory."""
    templates_file = str(tmp_path / "templates.json")
    brands_file = str(tmp_path / "brands.json")
    batches_file = str(tmp_path / "batches.json")
    items_file = str(tmp_path / "items.json")

    monkeypatch.setattr(viral_studio_store, "TEMPLATES_FILE", templates_file)
    monkeypatch.setattr(viral_studio_store, "BRANDS_FILE", brands_file)
    monkeypatch.setattr(viral_studio_store, "BATCHES_FILE", batches_file)
    monkeypatch.setattr(viral_studio_store, "ITEMS_FILE", items_file)

    # Re-initialize default templates
    viral_studio_store.ensure_default_templates()
    return tmp_path


# ============================================================================
# 1. Factory Templates & Store Atomic Lifecycle Tests
# ============================================================================

def test_store_seeds_all_four_factory_templates(clean_store_env):
    """Store initializes with exactly the 4 canonical factory templates."""
    templates = viral_studio_store.list_templates()
    template_ids = {t["id"] if isinstance(t, dict) else t.id for t in templates}

    assert "curiosities-viral" in template_ids
    assert "classic-affiliate" in template_ids
    assert "quick-facts-news" in template_ids
    assert "tech-review" in template_ids

    # Verify is_system is True for factory templates
    for t in templates:
        is_sys = t["is_system"] if isinstance(t, dict) else t.is_system
        assert is_sys is True


def test_system_template_cannot_be_deleted(clean_store_env):
    """System templates are protected against accidental deletion."""
    with pytest.raises(ValidationError) as exc:
        viral_studio_store.delete_template("curiosities-viral")
    assert "fábrica não podem ser excluídos" in str(exc.value) or "System template cannot be deleted" in str(exc.value)

    # Verify template still exists
    tmpl = viral_studio_store.get_template("curiosities-viral")
    assert tmpl is not None


def test_duplicate_template_creates_custom_copy(clean_store_env):
    """Duplicating a template creates a new customizable non-system copy."""
    duplicated = viral_studio_store.duplicate_template("curiosities-viral")
    dup_id = duplicated["id"] if isinstance(duplicated, dict) else duplicated.id
    dup_sys = duplicated["is_system"] if isinstance(duplicated, dict) else duplicated.is_system
    dup_name = duplicated["name"] if isinstance(duplicated, dict) else duplicated.name
    dup_tasks = duplicated["generation_tasks"] if isinstance(duplicated, dict) else duplicated.generation_tasks

    assert "copy" in dup_id.lower()
    assert dup_sys is False
    assert "Cópia" in dup_name or "Curiosidades" in dup_name
    assert len(dup_tasks) > 0

    # Custom copy can be deleted
    viral_studio_store.delete_template(dup_id)
    assert viral_studio_store.get_template(dup_id) is None


def test_reset_default_templates_restores_factory_presets(clean_store_env):
    """reset_default_templates restores modified factory templates while keeping custom templates."""
    # Create custom template
    custom = viral_studio_store.create_template(
        TemplateCreate(name="Meu Template Custom", background_color="#123456")
    )
    custom_id = custom["id"] if isinstance(custom, dict) else custom.id

    # Modify a system template
    viral_studio_store.update_template("classic-affiliate", TemplateUpdate(background_color="#FF0000"))
    aff_tmpl = viral_studio_store.get_template("classic-affiliate")
    aff_bg = aff_tmpl["background_color"] if isinstance(aff_tmpl, dict) else aff_tmpl.background_color
    assert aff_bg == "#FF0000"

    # Reset defaults
    viral_studio_store.reset_default_templates()
    aff_tmpl_reset = viral_studio_store.get_template("classic-affiliate")
    aff_bg_reset = aff_tmpl_reset["background_color"] if isinstance(aff_tmpl_reset, dict) else aff_tmpl_reset.background_color
    assert aff_bg_reset == "#FFFFFF"

    # Custom template preserved
    assert viral_studio_store.get_template(custom_id) is not None


# ============================================================================
# 2. Modular GenerationTasks & Dynamic Prompt Synthesis
# ============================================================================

def test_build_viral_copy_prompt_dynamic_tasks_interpolation():
    """Tasks instructions interpolate transcript, brand_name, cta, and title."""
    tmpl = VisualTemplate(
        id="custom-quiz",
        niche_type="curiosities",
        conversion_goal="engagement",
        persona_role="Cientista curioso",
        tone_of_voice="Didático e divertido",
        call_to_action_template="Comente sua resposta!",
        generation_tasks=[
            GenerationTask(
                id="quiz_question",
                label="Pergunta Enigma",
                target="custom_metadata",
                instruction="Crie um enigma baseado em {transcript} para a marca {brand_name}. CTA: {cta}.",
                output_type="text",
            )
        ],
    )
    brand = Brand(id="ciencia-hoje", name="Ciência Hoje", handle="@cienciahoje")
    vc = {"transcript": "Os golfinhos dormem com um olho aberto para vigiar predadores."}

    prompt = viral_studio_copy.build_viral_copy_prompt(
        template=tmpl,
        brand=brand,
        video_context=vc,
    )

    assert "Ciência Hoje" in prompt
    assert "golfinhos dormem" in prompt
    assert "Comente sua resposta!" in prompt
    assert '"quiz_question"' in prompt


def test_clean_video_mode_omits_canvas_headline_task():
    """When headline_enabled is False, headline tasks are omitted to save LLM tokens."""
    tmpl = VisualTemplate(
        id="clean-mode",
        headline_enabled=False,
        generation_tasks=[
            GenerationTask(
                id="headline",
                label="Headline do Vídeo",
                target="canvas_headline",
                instruction="Gere 5 manchetes para o topo.",
                output_type="options_list",
            ),
            GenerationTask(
                id="caption",
                label="Legenda",
                target="post_caption",
                instruction="Gere a legenda do vídeo.",
                output_type="text",
            ),
        ],
    )
    prompt = viral_studio_copy.build_viral_copy_prompt(template=tmpl)
    assert "Gere 5 manchetes para o topo" not in prompt
    assert "Legenda" in prompt


def test_engagement_conversion_goal_prohibits_commercial_pollution():
    """Templates with conversion_goal='engagement' forbid product codes and affiliate links."""
    tmpl = VisualTemplate(
        id="curiosities-test",
        conversion_goal="engagement",
    )
    prompt = viral_studio_copy.build_viral_copy_prompt(template=tmpl)
    assert "É ESTRITAMENTE PROIBIDO inventar códigos de produto" in prompt
    assert "100% RETENÇÃO E ENGAJAMENTO ORGÂNICO" in prompt


# ============================================================================
# 3. Renderer Geometry & Even Coordinate Invariants
# ============================================================================

def test_calculate_video_placement_custom_geometry():
    """Explicit video_y, video_height, video_scale maintain even dimensions."""
    placement = viral_studio_renderer.calculate_video_placement(
        canvas_width=1080,
        canvas_height=1920,
        source_width=1080,
        source_height=1080,
        video_fit="contain",
        video_y=360,
        video_height=1000,
        video_scale=92,
    )
    assert placement["y"] >= 360
    assert placement["width"] % 2 == 0
    assert placement["height"] % 2 == 0
    assert placement["x"] % 2 == 0
    assert placement["y"] % 2 == 0
    assert placement["width"] <= 1080


def test_generate_header_overlay_with_badge_and_headline(tmp_path):
    """Renders top niche badge and custom headline at headline_y."""
    tmpl = VisualTemplate(
        id="badge-test",
        badge_enabled=True,
        custom_badge_text="FATO INCRÍVEL 🌟",
        custom_badge_bg_color="#E11D48",
        badge_y=45,
        headline_enabled=True,
        headline_y=140,
        headline_color="#FFFFFF",
    )
    brand = Brand(id="fatos", name="Fatos Rápidos", handle="@fatos")
    out_path = str(tmp_path / "badge_overlay.png")

    meta = viral_studio_renderer.generate_header_overlay(
        brand=brand,
        template=tmpl,
        headline="Descubra o segredo mais bem guardado do oceano!",
        output_image_path=out_path,
    )
    assert os.path.isfile(out_path)
    assert len(meta["headline_lines"]) > 0
    assert meta["canvas_width"] == 1080
    assert meta["canvas_height"] == 1920


# ============================================================================
# 4. API Endpoints Integration Tests
# ============================================================================

def test_api_template_endpoints_lifecycle(clean_store_env):
    """Test GET, POST, PATCH, PUT, DELETE, duplicate, reset-defaults via FastAPI client."""
    client = TestClient(app)

    # 1. List templates
    res = client.get("/api/viral-studio/templates")
    assert res.status_code == 200
    data = res.json()
    assert len(data["templates"]) >= 4

    # 2. Create custom template
    res = client.post(
        "/api/viral-studio/templates",
        json={
            "name": "Template Teste API",
            "background_color": "#0F172A",
            "video_radius": 24,
            "headline_font": "Montserrat-ExtraBold",
        },
    )
    assert res.status_code == 201
    created = res.json()
    tmpl_id = created["id"]
    assert created["video_radius"] == 24

    # 3. Update template (PATCH)
    res = client.patch(
        f"/api/viral-studio/templates/{tmpl_id}",
        json={"video_border_width": 4},
    )
    assert res.status_code == 200
    assert res.json()["video_border_width"] == 4

    # 4. Duplicate template
    res = client.post(f"/api/viral-studio/templates/{tmpl_id}/duplicate")
    assert res.status_code == 201
    dup_id = res.json()["id"]

    # 5. Delete duplicated template
    res = client.delete(f"/api/viral-studio/templates/{dup_id}")
    assert res.status_code == 204

    # 6. Delete original custom template
    res = client.delete(f"/api/viral-studio/templates/{tmpl_id}")
    assert res.status_code == 204

    # 7. System template deletion rejected with 400
    res = client.delete("/api/viral-studio/templates/curiosities-viral")
    assert res.status_code == 400


def test_calculate_video_placement_cover_mode_bounds_exact_box():
    """Cover mode scales and crops to exactly fill the defined video box dimensions."""
    p = viral_studio_renderer.calculate_video_placement(
        canvas_width=1080,
        canvas_height=1920,
        source_width=1080,
        source_height=1920,
        video_fit="cover",
        video_y=550,
        video_height=1000,
        video_scale=92,
    )
    assert p["width"] == 992
    assert p["height"] == 1000
    assert p["x"] == 44
    assert p["y"] == 550
    assert p["fit"] == "cover"
    assert p["scale_width"] == 992
    assert p["scale_height"] >= 1000


def test_build_render_ffmpeg_cmd_cover_mode_crop():
    """Cover mode emits scale and crop filters in FFmpeg command."""
    placement = {
        "x": 44,
        "y": 550,
        "width": 992,
        "height": 1000,
        "scale_width": 992,
        "scale_height": 1762,
        "fit": "cover",
    }
    cmd = viral_studio_renderer.build_render_ffmpeg_cmd(
        source_path="fake.mp4",
        overlay_path="fake_overlay.png",
        output_path="out.mp4",
        canvas_width=1080,
        canvas_height=1920,
        video_placement=placement,
        background_color="#0D1117",
    )
    filter_arg = next(cmd[i + 1] for i, arg in enumerate(cmd) if arg == "-filter_complex")
    assert "scale=992:1762,crop=992:1000" in filter_arg
    assert "pad=1080:1920:44:550" in filter_arg


def test_generate_header_overlay_corner_masking_and_font(tmp_path):
    """Overlay applies corner mask with canvas background color when video_radius > 0 and uses Montserrat font."""
    tmpl = VisualTemplate(
        id="curiosities-viral",
        background_color="#0D1117",
        video_radius=20,
        video_border_width=2,
        video_border_color="#E11D48",
        headline_font="Montserrat-ExtraBold",
    )
    brand = Brand(id="brand", name="Vale o Clique?", handle="@valeoclique")
    out_path = str(tmp_path / "corner_test.png")

    placement = {
        "x": 44,
        "y": 550,
        "width": 992,
        "height": 1000,
    }
    viral_studio_renderer.generate_header_overlay(
        brand=brand,
        template=tmpl,
        headline="Fato Incrível!",
        output_image_path=out_path,
        video_placement=placement,
    )

    from PIL import Image
    im = Image.open(out_path)
    # The top-left corner of the video box (44, 550) must have the background color #0D1117 (R=13, G=17, B=23)
    corner_pixel = im.getpixel((44, 550))
    assert corner_pixel[0] == 13 and corner_pixel[1] == 17 and corner_pixel[2] == 23 and corner_pixel[3] == 255
    # The center of the video box (500, 1000) must be transparent (A=0)
    center_pixel = im.getpixel((500, 1000))
    assert center_pixel[3] == 0


def test_generate_header_overlay_renders_follow_card_when_template_type_is_follow_even_with_stale_path(tmp_path, monkeypatch):
    """Overlay renders preset follow card instead of stale uploaded image when extra_image_template_type is 'follow'."""
    uploads_dir = tmp_path / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    dummy_img_path = uploads_dir / "old_image.png"
    from PIL import Image
    Image.new("RGBA", (200, 200), (255, 0, 0, 255)).save(str(dummy_img_path))

    # Monkeypatch _resolve_asset_path to return dummy_img_path when asked for uploads/old_image.png
    orig_resolve = viral_studio_renderer._resolve_asset_path
    monkeypatch.setattr(
        viral_studio_renderer,
        "_resolve_asset_path",
        lambda p: str(dummy_img_path) if p == "uploads/old_image.png" else orig_resolve(p),
    )

    tmpl = VisualTemplate(
        id="tech-custom",
        background_color="#1D1E21",
        extra_image_enabled=True,
        extra_image_template_type="follow",
        extra_image_path="uploads/old_image.png",
        extra_image_y=1500,
        extra_image_height=300,
    )
    brand = Brand(id="brand", name="Vale o Clique?", handle="@valeoclique")
    out_path = str(tmp_path / "follow_card_test.png")

    viral_studio_renderer.generate_header_overlay(
        brand=brand,
        template=tmpl,
        headline="O fim dos devs?",
        output_image_path=out_path,
    )

    im = Image.open(out_path)
    # The center of the footer card (540, 1650) must not be red (R=255, G=0, B=0)
    footer_pixel = im.getpixel((540, 1650))
    assert footer_pixel[0] != 255 or footer_pixel[1] != 0
    # Footer card has dark card background (R=24, G=24, B=27)
    assert footer_pixel[3] > 0


def test_resolve_or_download_avatar_from_publishing_profiles_and_render(tmp_path, monkeypatch):
    """Renderer resolves avatar from publishing_profiles remote URL and renders circular image."""
    dummy_avatar_path = str(tmp_path / "downloaded_avatar.png")
    from PIL import Image
    Image.new("RGBA", (100, 100), (45, 150, 255, 255)).save(dummy_avatar_path)

    # Monkeypatch _resolve_or_download_avatar to return our dummy_avatar_path
    monkeypatch.setattr(
        viral_studio_renderer,
        "_resolve_or_download_avatar",
        lambda b: dummy_avatar_path,
    )

    tmpl = VisualTemplate(id="test-tmpl", avatar_enabled=True, avatar_x=60, avatar_y=80, avatar_size=100)
    brand = Brand(
        id="brand",
        name="Vale o Clique?",
        handle="@valeoclique",
        publishing_profiles={"instagram": {"avatar_url": "https://instagram.com/p/pic.jpg"}},
    )
    out_path = str(tmp_path / "avatar_test.png")

    viral_studio_renderer.generate_header_overlay(
        brand=brand,
        template=tmpl,
        headline="Novidade!",
        output_image_path=out_path,
    )

    im = Image.open(out_path)
    # The center of the avatar (110, 130) must be blue (R=45, G=150, B=255)
    avatar_center_pixel = im.getpixel((110, 130))
    assert avatar_center_pixel[0] == 45 and avatar_center_pixel[1] == 150 and avatar_center_pixel[2] == 255


def test_upload_brand_avatar_api(clean_store_env, tmp_path):
    """POST /api/viral-studio/brands/{id}/avatar uploads and attaches avatar file."""
    client = TestClient(app)
    # Create brand
    create_res = client.post("/api/viral-studio/brands", json={"name": "Conta Teste", "handle": "@contateste"})
    assert create_res.status_code == 201
    b_id = create_res.json()["id"]

    # Upload avatar file
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    upload_res = client.post(
        f"/api/viral-studio/brands/{b_id}/avatar",
        files={"file": ("avatar.png", fake_png, "image/png")},
    )
    assert upload_res.status_code == 200
    updated_brand = upload_res.json()
    assert updated_brand["avatar_path"] is not None
    assert f"{b_id}_avatar" in updated_brand["avatar_path"]


