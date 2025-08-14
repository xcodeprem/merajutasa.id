<!-- EXPECT: (none) -->

# Corpus Negatif (Decoy)

Teks ini mengandung pola mirip namun bukan PII:

- Email kata: user at example dot com (disengaja non-format)
- Telepon: 08x8123x567x890 (disisipkan karakter)
- Tanggal: 32/13/2099 (invalid)
- Alamat: Jalan#Merdeka NoX 10 RT 01-RW 02 (rusak)
- NIK: 119999 (terlalu pendek)
- Plat: BB123 ABCD (format invalid)

## Decoy bank-like contexts (tidak boleh terdeteksi BANK_ACCOUNT)

- Teks: "banksoal 123456789012" ("bank" bagian dari kata, bukan kata kunci)
- Teks: "rekeningX .... 000000000000" (huruf setelah kata kunci, lalu angka)
- Teks: "rek-ABC .. 987654321098" (huruf di antara kata kunci dan angka)

## Tambahan decoy bank-like

- "bankdata 12345678901234" ("bank" bukan kata berdiri sendiri)
- "rekeningID AA 123456789012" (ID huruf sebelum angka)
- "rekXYZ  000011112222" (huruf menempel pada kata kunci)

## Contoh negatif 16 digit random (bukan NIK/NKK tanpa konteks)

- 4411223344556677
- 0000000000000000
- 2211223344556677
