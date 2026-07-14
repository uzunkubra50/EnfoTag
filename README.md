# EnfoTag — Barkod Yönetim Sistemi

![CI](https://github.com/uzunkubra50/EnfoTag/actions/workflows/ci.yml/badge.svg)

Kurum birimlerine özel barkod (`PREFIX-0000001`) üretip QR veya Code128 şerit olarak
görselleştiren, ayarlanabilir etiket düzeniyle yazdıran tam yığın (Django + React) bir
arşiv barkod modülü. Detaylı iş kuralları ve mimari kararlar için [CLAUDE.md](CLAUDE.md)'ye bakın.

## Mimari

```mermaid
flowchart LR
    B["Tarayıcı"] -->|"HTTP :5173"| F["React SPA<br/>(Vite dev server)"]
    F -->|"axios + JWT<br/>/api/..."| A["Django REST API<br/>(runserver)"]
    B -->|"/admin"| A
    A -->|"ORM"| D[("PostgreSQL<br/>(dev: SQLite seçeneği)")]
```

- Kimlik doğrulama: simplejwt (access + refresh); axios interceptor token'ı her isteğe
  ekler, süresi dolunca sessizce yeniler.
- Giriş denemeleri IP başına dakikada 10 ile sınırlıdır (DRF `ScopedRateThrottle`),
  brute-force koruması amaçlı.
- Barkod numaraları `select_for_update` kilidiyle çakışmasız, sıralı üretilir.
- Silme yoktur: kayıtlar yalnızca pasife alınır (`is_active`).
- Liste endpoint'leri sayfalanır (DRF `PageNumberPagination`, 50 kayıt/sayfa);
  frontend tüm sayfaları arka planda toplayıp düz bir liste olarak kullanır.

## Ekran Görüntüleri

| Giriş | Barkod Oluşturma |
|---|---|
| ![Giriş ekranı](docs/screens/login.png) | ![Barkod oluşturma ve önizleme](docs/screens/barcode-create.png) |
| **Birimler** | **Barkod Listesi** |
| ![Birim tanımlama](docs/screens/units.png) | ![Barkod listesi](docs/screens/barcode-list.png) |

**Yazdırma ekranı** — mm bazlı gerçek boyut önizleme, preset yönetimi ve `@media print` ile
yalnızca etiketlerin bastırılması:

![Yazdırma ekranı](docs/screens/print.png)

## Teknoloji Yığını

- **Backend:** Django + Django REST Framework, JWT (simplejwt), django-cors-headers
- **Veritabanı:** PostgreSQL (Docker) / SQLite (yerel geliştirme)
- **Frontend:** React + Vite, axios, react-router-dom
- **Barkod çizimi:** jsbarcode (Code128) + qrcode.react (QR)

## Dizin Yapısı

```
/backend
  /core                  # Django project (settings, urls)
  /barcodes              # modeller, serializer'lar, view'lar, servis fonksiyonları, testler
  Dockerfile
/frontend
  /src
    /pages               # Login, Units, BarcodeCreate, BarcodePrint, BarcodeList (+ testler)
    /components          # Layout, ProtectedRoute, BarcodePreview, BrandMark (+ testler)
    /api                 # axios instance + endpoint fonksiyonları
  Dockerfile
.github/workflows/ci.yml # her push'ta testler + build
docker-compose.yml       # geliştirme stack'i
.env.example             # ortam değişkenleri şablonu
```

## Çalıştırma — Docker (önerilen)

İlk kurulumda ortam değişkeni şablonunu kopyala (varsayılanlarla da çalışır, ama
`DJANGO_SECRET_KEY` üretmen önerilir):

```bash
cp .env.example .env
```

Tek komutla PostgreSQL + Django + React'i ayağa kaldırır:

```bash
docker compose up --build
```

- Backend: http://localhost:8000 (migration'lar konteyner açılışında otomatik uygulanır)
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432 (db: `barkod`, kullanıcı: `barkod`, şifre: `barkod`)

İlk çalıştırmada superuser oluşturmak için (backend ayaktayken, başka bir terminalde):

```bash
docker compose exec backend python manage.py createsuperuser
```

Durdurmak için `Ctrl+C`, ardından `docker compose down` (veritabanını da silmek isterseniz `docker compose down -v`).

### Veritabanını tarayıcıdan görüntüleme (Adminer)

Geliştirme kolaylığı için stack'e [Adminer](https://www.adminer.org/) eklendi — masaüstü bir
istemci kurmadan, tarayıcıdan veritabanına bakabilirsiniz:

- http://localhost:8080 → System: `PostgreSQL`, Server: `db`, Username: `barkod`,
  Password: `barkod`, Database: `barkod`

Uygulamanın bir parçası değildir, sadece geliştirici aracıdır.

## Çalıştırma — Yerel Geliştirme (Docker'sız)

Backend ve frontend'i ayrı terminallerde, SQLite ile çalıştırır (`POSTGRES_DB` ortam
değişkeni tanımlı değilse `settings.py` otomatik SQLite'a düşer):

```bash
# Backend
cd backend
python -m venv venv && venv\Scripts\activate      # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (yeni terminal)
cd frontend
npm install
npm run dev
```

## Testler

Her push'ta GitHub Actions üzerinde otomatik çalışır: backend testleri + `pip-audit`
bağımlılık taraması, frontend testleri + `npm audit` + production build. Yerelde:

```bash
# Backend — barkod numarası üretimi, auth, soft delete, filtreler, sayfalama,
# giriş rate limiting (14 test)
cd backend
venv\Scripts\python.exe manage.py test barcodes

# Backend — coverage raporu ile
venv\Scripts\python.exe -m coverage run --source=barcodes manage.py test barcodes
venv\Scripts\python.exe -m coverage report -m

# Frontend — login hataları, korumalı route, barkod çizimi, sığma uyarıları (10 test)
cd frontend
npm test
```

## API Dokümantasyonu

Backend çalışırken etkileşimli Swagger arayüzü: **http://localhost:8000/api/docs/**
(OpenAPI şeması: `/api/schema/`). Tüm endpoint'leri tarayıcıdan inceleyip
deneyebilirsiniz.

## API Endpoint'leri

```
POST  /api/token/            → login (username, password) → access + refresh
POST  /api/token/refresh/    → token yenileme
GET   /api/units/            → birim listesi
POST  /api/units/            → birim oluştur {name, barcode_prefix, fields}
GET   /api/units/{id}/       → tek birim (fields listesi barkod ekranı için)
GET   /api/barcodes/         → aktif barkodlar (?include_inactive=true opsiyonel)
POST  /api/barcodes/         → {unit_id, field_values} → barkod üret, name döndür
PATCH /api/barcodes/{id}/    → güncelleme VE pasife alma ({"is_active": false})
GET   /api/presets/          → preset listesi
POST  /api/presets/          → preset kaydet
```

Tüm endpoint'ler `Authorization: Bearer <access_token>` başlığı gerektirir (login/refresh hariç).

## Ekranlar

1. **Giriş** — JWT al/sakla, axios interceptor her isteğe otomatik ekler, token
   süresi dolunca refresh token ile sessizce yeniler.
2. **Birimler** — ad, barkod ön eki (otomatik büyük harf), dinamik indeks alanı listesi.
3. **Barkod Oluştur** — birim seçilince alanları dinamik form olarak render eder,
   üretilen barkodu QR veya şerit olarak çizer (tercih `localStorage`'da saklanır).
4. **Barkod Yazdır** — kağıt/etiket boyutu, satır başına adet, boşluk ve kenar payı
   ayarlarıyla mm bazlı CSS Grid önizleme + `window.print()`; ayarlar preset olarak
   backend'e kaydedilip tekrar seçilebilir. QR/şerit tipi yazdırma anında da
   değiştirilebilir; etiketler kağıda sığmıyorsa uyarı gösterilir.
5. **Barkod Listesi** — ada veya alan değerine göre arama, birim filtresi,
   düzenleme, pasife alma/aktifleştirme (gerçek silme yok), herhangi bir barkodu
   seçip yeniden yazdırma ekranına gönderme.

## Bilinen Kısıtlar

- Kullanıcı yönetimi (kayıt, şifre sıfırlama, roller) kapsam dışıdır; kullanıcılar
  Django admin/`createsuperuser` ile oluşturulur.
- Preset silme/düzenleme ve birim düzenleme ekranları task kapsamında olmadığı için
  bilinçli olarak eklenmemiştir.
- HTTPS/sertifika yönetimi ve gerçek bir alan adına dağıtım bu demonun kapsamı dışındadır.
