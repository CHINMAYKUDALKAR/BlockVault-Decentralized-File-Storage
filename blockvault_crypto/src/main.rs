use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;

use aes_gcm::{Aes256Gcm, Key, KeyInit, Nonce};
use aes_gcm::aead::{Aead, Payload};
use anyhow::{anyhow, Result};
use clap::{Parser, Subcommand};
use pbkdf2::pbkdf2_hmac_array;
use rand::RngCore;
use sha2::Sha256;
use zeroize::Zeroize;

const MAGIC: &[u8; 8] = b"BVENC001"; // format version marker
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12; // AES-GCM standard nonce
const PBKDF2_ITERS: u32 = 120_000; // balance between security & speed

#[derive(Parser, Debug)]
#[command(name = "blockvault_crypto", version, about = "BlockVault encryption engine (AES-256-GCM)")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Encrypt a file
    Encrypt {
        #[arg(long)] input: PathBuf,
        #[arg(long)] output: PathBuf,
        /// Passphrase (will be used to derive key via PBKDF2)
        #[arg(long, env = "BLOCKVAULT_KEY")] key: String,
        /// Optional associated data for AEAD (e.g. file name)
        #[arg(long)] aad: Option<String>,
    },
    /// Decrypt a file
    Decrypt {
        #[arg(long)] input: PathBuf,
        #[arg(long)] output: PathBuf,
        #[arg(long, env = "BLOCKVAULT_KEY")] key: String,
        #[arg(long)] aad: Option<String>,
    },
}

fn derive_key(passphrase: &str, salt: &[u8]) -> Key<Aes256Gcm> {
    // pbkdf2_hmac_array returns a [u8; 32]
    let key_material = pbkdf2_hmac_array::<Sha256, 32>(passphrase.as_bytes(), salt, PBKDF2_ITERS);
    Key::<Aes256Gcm>::from_slice(&key_material).to_owned()
}

fn encrypt_file(input: &PathBuf, output: &PathBuf, passphrase: &str, aad: Option<&str>) -> Result<()> {
    let mut data = fs::read(input)?;
    let mut salt = [0u8; SALT_LEN];
    rand::thread_rng().fill_bytes(&mut salt);
    let key = derive_key(passphrase, &salt);
    let cipher = Aes256Gcm::new(&key);
    let mut nonce_bytes = [0u8; NONCE_LEN];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let aad_bytes = aad.unwrap_or("").as_bytes();
    let ciphertext = cipher
        .encrypt(nonce, Payload { msg: &data, aad: aad_bytes })
        .map_err(|e| anyhow!("encryption failed: {e}"))?;

    // Zero sensitive in-memory content (best effort)
    data.zeroize();

    let mut out = Vec::new();
    out.extend_from_slice(MAGIC);      // 8 bytes
    out.extend_from_slice(&salt);      // 16 bytes
    out.extend_from_slice(&nonce_bytes); // 12 bytes
    out.extend_from_slice(&ciphertext);

    let mut file = fs::File::create(output)?;
    file.write_all(&out)?;
    file.flush()?;
    Ok(())
}

fn decrypt_file(input: &PathBuf, output: &PathBuf, passphrase: &str, aad: Option<&str>) -> Result<()> {
    let mut file = fs::File::open(input)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;
    if buffer.len() < MAGIC.len() + SALT_LEN + NONCE_LEN {
        return Err(anyhow!("file too short or corrupt"));
    }
    let (magic, rest) = buffer.split_at(MAGIC.len());
    if magic != MAGIC {
        return Err(anyhow!("invalid magic header"));
    }
    let (salt, rest) = rest.split_at(SALT_LEN);
    let (nonce_bytes, ciphertext) = rest.split_at(NONCE_LEN);

    let key = derive_key(passphrase, salt);
    let cipher = Aes256Gcm::new(&key);
    let nonce = Nonce::from_slice(nonce_bytes);
    let aad_bytes = aad.unwrap_or("").as_bytes();
    let plaintext = cipher
        .decrypt(nonce, Payload { msg: ciphertext, aad: aad_bytes })
        .map_err(|e| anyhow!("decryption failed: {e}"))?;

    fs::write(output, &plaintext)?;
    Ok(())
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    match cli.command {
        Commands::Encrypt { input, output, key, aad } => {
            encrypt_file(&input, &output, &key, aad.as_deref())?;
            println!("encrypted -> {}", output.display());
        }
        Commands::Decrypt { input, output, key, aad } => {
            decrypt_file(&input, &output, &key, aad.as_deref())?;
            println!("decrypted -> {}", output.display());
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn round_trip_encryption() {
        let mut input = NamedTempFile::new().unwrap();
        write!(input, "Test secret data ☃").unwrap();
        let input_path = input.path().to_path_buf();
        let output_path = std::env::temp_dir().join("enc_test.bin");
        let decrypted_path = std::env::temp_dir().join("dec_test.txt");
        let pass = "example-passphrase";
        encrypt_file(&input_path, &output_path, pass, Some("meta")).unwrap();
        decrypt_file(&output_path, &decrypted_path, pass, Some("meta")).unwrap();
        let orig = std::fs::read(input_path).unwrap();
        let dec = std::fs::read(decrypted_path).unwrap();
        assert_eq!(orig, dec);
    }
}
