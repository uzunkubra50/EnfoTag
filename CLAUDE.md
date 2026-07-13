# CLAUDE.md — Barkod Yönetim Sistemi (Barcode Task)

## Proje Özeti

Dijital arşiv yazılımı (EnfoNova benzeri) için **barkod üretim, yazdırma ve yönetim modülü**.
Kurum birimleri (Unit) tanımlanır; her birimin bir barkod ön eki (ör. `PTYD`) ve dinamik
indeks alanları (ör. Ada, Parsel) vardır. Kullanıcı birim seçip alanları doldurarak
`PTYD-0000001` formatında barkod üretir, QR veya şerit (Code128) olarak görselleştirir
ve ayarlanabilir etiket düzeniyle yazdırır. Tam yığın (backend + frontend) tek kişilik
stajyer projesidir.

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Backend | Django + Django REST Framework (DRF) |
| Auth | djangorestframework-simplejwt (JWT) |
| Veritabanı | PostgreSQL (Docker), geliştirmede SQLite kabul edilebilir |
| Frontend | React + Vite (JavaScript) |
| HTTP istemci | axios (JWT interceptor ile) |
| Routing | react-router-dom |
| Barkod çizimi | jsbarcode (CODE128 şerit) + qrcode.react (QR) |
| Kullanıcı tercihi | localStorage (QR/şerit seçimi — ekip kararı) |
| Paketleme | Docker + docker-compose (db, backend, frontend — 3 servis) |

## Dizin Yapısı (hedef)

```
/backend
  /core          # Django project (settings, urls)
  /barcodes      # tek app: modeller, serializer'lar, view'lar
  Dockerfile
/frontend
  /src
    /pages       # Login, Units, BarcodeCreate, BarcodePrint, BarcodeList
    /components  # BarcodePreview, LabelGrid, PresetForm...
    /api         # axios instance + endpoint fonksiyonları
  Dockerfile
docker-compose.yml
README.md
```

## Veri Modelleri

**User:** Django'nun yerleşik `django.contrib.auth.models.User` modeli kullanılır
(id, username, password hazır gelir). Özel user modeli YAZMA.

```python
class Unit(models.Model):
    name = models.CharField(max_length=200)            # "Proje Tasdik ve Yapı Denetim Şefliği"
    barcode_prefix = models.CharField(max_length=10)   # "PTYD"
    fields = models.JSONField(default=list)            # ["Ada", "Parsel"]

class Barcode(models.Model):
    name = models.CharField(max_length=20, unique=True)  # "PTYD-0000001"
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT)
    field_values = models.JSONField(default=dict)        # {"Ada": "4", "Parsel": "238"}
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, related_name="+", on_delete=models.PROTECT)
    updated_by = models.ForeignKey(User, related_name="+", null=True, blank=True, on_delete=models.PROTECT)
    is_active = models.BooleanField(default=True)

class PrintPreset(models.Model):
    name = models.CharField(max_length=100)
    paper_w = models.FloatField();  paper_h = models.FloatField()   # mm
    per_row = models.IntegerField()                                  # 1-4 arası
    count = models.IntegerField()                                    # basılacak adet
    barcode_w = models.FloatField(); barcode_h = models.FloatField() # mm
    gap = models.FloatField()                                        # barkodlar arası boşluk (mm)
    margin_top = models.FloatField();  margin_bottom = models.FloatField()
    margin_left = models.FloatField(); margin_right = models.FloatField()
```

Not: `unit` FK ve `field_values` orijinal task dokümanında yoktu; **yeniden yazdırma**
özelliği için eklendi (ekiple teyit edildi/edilecek).

## İş Kuralları (KRİTİK)

1. **Barkod adı formatı:** `{unit.barcode_prefix}-{7 haneli sayı}` → `PTYD-0000001`.
   Numara üretiminde çakışma OLMAMALI. Tercih edilen strateji: o prefix'e ait son
   numarayı bulup +1 artırmak (race condition için `select_for_update` veya
   unique constraint + retry). Rastgele sayı kullanılacaksa unique kontrolü şart.
2. **Soft delete:** Barkod asla gerçekten silinmez. "Silme" = `is_active = False`
   (PATCH). Listeler varsayılan olarak sadece `is_active=True` gösterir.
   DELETE endpoint'i gerçek silme YAPMAMALI.
3. **created_by / updated_by:** her yazma işleminde `request.user`'dan otomatik atanır;
   frontend'den gönderilmez.
4. **Sadece dolu indeks alanları etikete basılır.** Boş bırakılan alan etikette görünmez.
5. **QR / şerit tercihi localStorage'da saklanır** (`barcodeType` anahtarı),
   sayfa açılışında geri yüklenir. Backend'e kaydedilmez (ekip kararı).
6. **Print preset'leri backend'de saklanır** ve frontend'de dropdown'dan seçilip
   formu doldurur.
7. Tüm API endpoint'leri JWT korumalıdır (login/refresh hariç).

## API Endpoint'leri

```
POST  /api/token/            → login (username, password) → access + refresh
POST  /api/token/refresh/    → token yenileme
GET   /api/units/            → birim listesi
POST  /api/units/            → birim oluştur {name, barcode_prefix, fields}
GET   /api/units/{id}/       → tek birim (fields listesi barkod ekranı için buradan)
GET   /api/barcodes/         → aktif barkodlar (?include_inactive=true opsiyonel)
POST  /api/barcodes/         → {unit_id, field_values} → barkod üret, name döndür
PATCH /api/barcodes/{id}/    → güncelleme VE pasife alma (is_active:false)
GET   /api/presets/          → preset listesi
POST  /api/presets/          → preset kaydet
```

## Ekranlar

1. **Login** — token al, sakla; axios interceptor her isteğe `Authorization: Bearer` ekler.
   Korumalı route yapısı (token yoksa login'e yönlendir).
2. **Unit Oluşturma** — ad, ön ek, dinamik indeks alanı listesi ("alan ekle +" butonu).
3. **Barkod Oluşturma** —
   a) Unit dropdown → seçilince o unit'in `fields` dizisi çekilir,
   b) alanlar dinamik textbox olarak render edilir (kullanıcı doldurabilir),
   c) "Oluştur" → POST → dönen `name` frontend'de görselleştirilir,
   d) QR / şerit radio seçimi (localStorage'a yazılır/okunur).
4. **Barkod Yazdırma** — 7 ayar: kağıt boyutu, satır başına barkod (1-4), adet,
   barkod boyutu, barkodlar arası boşluk, üst/alt kenar payı, sağ/sol kenar payı.
   CSS Grid önizleme + `window.print()`. Ayarlar preset olarak kaydedilebilir/seçilebilir.
5. **Barkod Düzenleme** — liste, güncelleme, pasife alma, "yeniden yazdır"
   (seçili barkodla yazdırma ekranına yönlendirir, kullanıcı orada preset seçer).

## Etiket Düzeni (task'taki görsele birebir uy)

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   kesikli kesim çizgisi
         PTYD-0000001      ← barkod adı üstte, kalın, sağa yaslı
  [QR/şerit]  Ada: 4
  [görsel  ]  Parsel: 238  ← görsel solda, dolu alanlar sağda alt alta
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

## Bilinen Tuzaklar (bunlara dikkat)

- **CORS:** React (5173) ↔ Django (8000). `django-cors-headers` İLK GÜNDEN kurulmalı,
  yoksa frontend istekleri patlar.
- **JWT ömrü:** simplejwt access token varsayılanı kısa; geliştirmede süreyi uzat
  veya refresh akışını kur.
- **Print CSS:** ölçüler `mm` cinsinden olmalı (px değil). `@media print` ile sadece
  etiket alanı basılır; `@page { size; margin }` kullan. Ekran önizlemesi ile yazıcı
  çıktısı farklı olabilir — gerçek print preview ile test et.
- **Pasife alma PATCH ile yapılır**, DELETE ile değil.
- Django `JSONField` PostgreSQL'de doğal çalışır; SQLite'ta da desteklenir (Django 3.1+).

## Komutlar

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate    # Win: venv\Scripts\activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary
python manage.py makemigrations && python manage.py migrate
python manage.py createsuperuser
python manage.py runserver           # http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev                          # http://localhost:5173

# Docker (son aşama)
docker compose up --build            # db + backend + frontend
```

## Yol Haritası / Durum

- [ ] **Aşama 1:** Kurulum, modeller, migration, admin kaydı, superuser (1-2 gün)
- [ ] **Aşama 2:** JWT + CORS + Unit/Barcode/Preset endpoint'leri + Postman testi (3 gün)
- [ ] **Aşama 3:** Login → Unit ekranı → Barkod oluşturma (dinamik alanlar + görselleştirme)
      → Yazdırma (grid + print CSS + preset) → Düzenleme listesi (3-4 gün)
- [ ] **Aşama 4:** Docker compose, uçtan uca test, README, demo (1-2 gün)

## Kurallar / Konvansiyonlar

- Arayüz dili **Türkçe** (buton, etiket, hata mesajları).
- Kod ve değişken adları İngilizce.
- Her mantıklı adımda git commit; mesajlar kısa ve İngilizce ("add barcode model").
- Karmaşık çözüm yerine basit çözüm: bu bir stajyer projesi, okunabilirlik > zekice kod.
- Emin olunmayan tasarım kararları kod yazılmadan önce ekibe sorulur
  (şu ana kadarki kararlar: field_values saklanacak ✓, tercih localStorage'da ✓).
