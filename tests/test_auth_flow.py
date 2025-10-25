import pytest
from blockvault import create_app
from blockvault.core.security import generate_jwt
from eth_account import Account
from eth_account.messages import encode_defunct

@pytest.fixture()
def app():
    app = create_app()
    app.config.update(TESTING=True, MONGO_URI="memory://test")
    return app

@pytest.fixture()
def client(app):
    return app.test_client()

def test_get_nonce_requires_address(client):
    resp = client.post('/auth/get_nonce', json={})
    assert resp.status_code == 400


def test_get_nonce_success(client):
    resp = client.post('/auth/get_nonce', json={'address': '0x0000000000000000000000000000000000000000'})
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'nonce' in data
    assert data['address'].startswith('0x')


def test_me_requires_auth(client):
    resp = client.get('/auth/me')
    assert resp.status_code == 401


def test_me_with_valid_token(client):
    # Directly generate token (bypassing signature flow) for unit test
    with client.application.app_context():
        token = generate_jwt({"sub": "0xabcDEF0000000000000000000000000000000000"})
    resp = client.get('/auth/me', headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['address'].lower() == '0xabcdef0000000000000000000000000000000000'


def test_full_signature_login_flow(client):
    # Create ephemeral account
    acct = Account.create()
    address = acct.address.lower()

    # Step 1: request nonce
    resp = client.post('/auth/get_nonce', json={'address': address})
    assert resp.status_code == 200
    nonce_payload = resp.get_json()
    nonce = nonce_payload['nonce']
    message_text = f"BlockVault login nonce: {nonce}"

    # Step 2: sign message with private key
    msg = encode_defunct(text=message_text)
    signed = Account.sign_message(msg, private_key=acct.key)
    signature = signed.signature.hex()

    # Step 3: login
    login_resp = client.post('/auth/login', json={'address': address, 'signature': signature})
    assert login_resp.status_code == 200
    login_data = login_resp.get_json()
    assert 'token' in login_data
    token = login_data['token']

    # Step 4: access /auth/me
    me_resp = client.get('/auth/me', headers={'Authorization': f'Bearer {token}'})
    assert me_resp.status_code == 200
    me_data = me_resp.get_json()
    assert me_data['address'].lower() == address.lower()
