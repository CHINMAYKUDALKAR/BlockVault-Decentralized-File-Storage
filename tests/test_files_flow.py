import io
import time
import pytest
from blockvault import create_app
from blockvault.core.security import generate_jwt


@pytest.fixture()
def app(tmp_path):
    app = create_app()
    app.config.update(TESTING=True, MONGO_URI="memory://test", FILE_STORAGE_DIR=str(tmp_path))
    return app


@pytest.fixture()
def client(app):
    return app.test_client()


def _auth_header(app):
    with app.app_context():
        token = generate_jwt({"sub": "0x1234567890abcdef000000000000000000000000"})
    return {"Authorization": f"Bearer {token}"}


def test_file_upload_download_roundtrip(app, client):
    content = b"Hello Encrypted World!"
    data = {
        'key': 'pass-phrase',
        'file': (io.BytesIO(content), 'hello.txt'),
        'aad': 'greeting'
    }
    resp = client.post('/files', data=data, headers=_auth_header(app), content_type='multipart/form-data')
    assert resp.status_code == 200, resp.data
    payload = resp.get_json()
    file_id = payload['file_id']
    assert 'sha256' in payload and len(payload['sha256']) == 64
    assert 'cid' in payload  # will be None when IPFS disabled
    assert 'gateway_url' in payload  # may be None if cid is None

    d_resp = client.get(f'/files/{file_id}?key=pass-phrase', headers=_auth_header(app))
    assert d_resp.status_code == 200
    assert d_resp.data == content

    # list files
    list_resp = client.get('/files', headers=_auth_header(app))
    assert list_resp.status_code == 200, list_resp.data
    listing = list_resp.get_json()
    assert 'items' in listing
    assert any(it['file_id'] == file_id for it in listing['items'])
    # ensure gateway_url key exists in listing items
    for it in listing['items']:
        assert 'gateway_url' in it

    # delete file
    del_resp = client.delete(f'/files/{file_id}', headers=_auth_header(app))
    assert del_resp.status_code == 200, del_resp.data
    assert del_resp.get_json()['status'] == 'deleted'

    # ensure deleted
    d2_resp = client.get(f'/files/{file_id}?key=pass-phrase', headers=_auth_header(app))
    assert d2_resp.status_code == 404


def test_file_list_pagination(app, client):
    headers = _auth_header(app)
    # create several files
    for i in range(7):
        data = {
            'key': 'k',
            'file': (io.BytesIO(f'data-{i}'.encode()), f'f{i}.txt'),
        }
        r = client.post('/files', data=data, headers=headers, content_type='multipart/form-data')
        assert r.status_code == 200
        time_created = r.get_json()['sha256']  # just to ensure creation; not used
    # first page
    page1 = client.get('/files?limit=3', headers=headers)
    assert page1.status_code == 200
    p1 = page1.get_json()
    assert len(p1['items']) == 3
    assert p1['has_more'] is True
    assert p1['next_after'] is not None
    # second page
    page2 = client.get(f"/files?limit=3&after={p1['next_after']}", headers=headers)
    assert page2.status_code == 200
    p2 = page2.get_json()
    assert len(p2['items']) >= 3  # could be 3 or remaining
    # third page (if still more)
    if p2['has_more']:
        page3 = client.get(f"/files?limit=3&after={p2['next_after']}", headers=headers)
        assert page3.status_code == 200
        p3 = page3.get_json()
        assert p3['has_more'] in (False, True)


def test_verify_endpoint(app, client):
    content = b'verify-bytes'
    data = {
        'key': 'pass-phrase',
        'file': (io.BytesIO(content), 'v.txt'),
    }
    resp = client.post('/files', data=data, headers=_auth_header(app), content_type='multipart/form-data')
    assert resp.status_code == 200
    file_id = resp.get_json()['file_id']
    v_resp = client.get(f'/files/{file_id}/verify', headers=_auth_header(app))
    assert v_resp.status_code == 200
    body = v_resp.get_json()
    assert body['file_id'] == file_id
    assert body['has_encrypted_blob'] is True
    assert len(body['sha256']) == 64
    # delete then verify returns 404
    d_resp = client.delete(f'/files/{file_id}', headers=_auth_header(app))
    assert d_resp.status_code == 200
    v2 = client.get(f'/files/{file_id}/verify', headers=_auth_header(app))
    assert v2.status_code == 404