package com.swifter.fraudshield.binding

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * KeystoreTokenStore
 *
 * Stores and retrieves device tokens using the Android Keystore system.
 * Tokens are AES-256-GCM encrypted — the key never leaves the secure hardware.
 *
 * Storage strategy:
 *  - EncryptedSharedPreferences holds the ciphertext + IV
 *  - Android Keystore holds the AES key (never extractable)
 */
class KeystoreTokenStore(private val context: Context) {

    companion object {
        private const val KEYSTORE_ALIAS = "PayGuardDeviceTokenKey"
        private const val PREFS_NAME     = "pg_secure_token_store"
        private const val PREF_TOKEN_CT  = "device_token_ct"   // base64 ciphertext
        private const val PREF_TOKEN_IV  = "device_token_iv"   // base64 IV
        private const val AES_GCM_NO_PADDING = "AES/GCM/NoPadding"
        private const val GCM_TAG_LENGTH = 128
    }

    /** Encrypt and persist the device token. */
    fun storeToken(rawToken: String) {
        val key = getOrCreateKey()
        val cipher = Cipher.getInstance(AES_GCM_NO_PADDING)
        cipher.init(Cipher.ENCRYPT_MODE, key)

        val iv         = cipher.iv
        val ciphertext = cipher.doFinal(rawToken.toByteArray(Charsets.UTF_8))

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(PREF_TOKEN_CT, Base64.encodeToString(ciphertext, Base64.NO_WRAP))
            .putString(PREF_TOKEN_IV, Base64.encodeToString(iv, Base64.NO_WRAP))
            .apply()
    }

    /** Decrypt and return the device token. Returns null if none stored or decryption fails. */
    fun retrieveToken(): String? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val ctB64 = prefs.getString(PREF_TOKEN_CT, null) ?: return null
        val ivB64 = prefs.getString(PREF_TOKEN_IV, null) ?: return null

        return try {
            val key        = getOrCreateKey()
            val ciphertext = Base64.decode(ctB64, Base64.NO_WRAP)
            val iv         = Base64.decode(ivB64, Base64.NO_WRAP)

            val cipher = Cipher.getInstance(AES_GCM_NO_PADDING)
            val spec   = GCMParameterSpec(GCM_TAG_LENGTH, iv)
            cipher.init(Cipher.DECRYPT_MODE, key, spec)
            String(cipher.doFinal(ciphertext), Charsets.UTF_8)
        } catch (_: Exception) {
            null  // token corrupted or key rotated — treat as no token
        }
    }

    /** Remove the stored token (e.g. on logout or blacklist event). */
    fun clearToken() {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().remove(PREF_TOKEN_CT).remove(PREF_TOKEN_IV).apply()
    }

    /** Returns true if a token is currently stored. */
    fun hasToken(): Boolean =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .contains(PREF_TOKEN_CT)

    // ── Key management ────────────────────────────────────────────────────────

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

        if (!keyStore.containsAlias(KEYSTORE_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                "AndroidKeyStore"
            )
            val spec = KeyGenParameterSpec.Builder(
                KEYSTORE_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setUserAuthenticationRequired(false)  // Background binding allowed
                .build()
            keyGenerator.init(spec)
            keyGenerator.generateKey()
        }

        return (keyStore.getEntry(KEYSTORE_ALIAS, null) as KeyStore.SecretKeyEntry).secretKey
    }
}
