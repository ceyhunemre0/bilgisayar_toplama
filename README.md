## Bilgisayar Toplama (PC Builder)

Modern bir Next.js (App Router) projesi ile adım adım bilgisayar toplama sihirbazı. Anakart → İşlemci → RAM → GPU → Soğutucu → Depolama → Kasa → PSU → Monitör → Klavye → Fare sıralamasıyla ilerler, uyumluluk kurallarına göre seçenekleri sunar ve toplam fiyatı hesaplar.

Öne çıkanlar:
- Adım adım (wizard) akış ve ilerleme çubuğu
- Uyumluluk filtreleri (soket, nesil, bellek tipi, kasa ölçüleri, güç gereksinimleri vb.)
- Stokta olmayan ürünler tıklanamaz ve “Tükendi” olarak gösterilir
- Seçimler sağdaki özet panelde görüntülenir; toplam fiyat otomatik hesaplanır
- Şık ve kompakt kart tasarımı (Tailwind CSS v4)

## Teknoloji Yığını

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS v4 (`@tailwindcss/postcss`)
- ESLint (Next.js yapılandırması)

## Projeyi Çalıştırma

Gereksinimler: Node.js 18+ (önerilen), bir paket yöneticisi (pnpm, npm veya yarn)

Kurulum ve geliştirme sunucusu (zsh):

```bash
pnpm install
pnpm dev
# veya
npm install
npm run dev
# veya
yarn
yarn dev
```

Tarayıcıdan şu adrese gidin: http://localhost:3000/topla

### Build ve Prod Çalıştırma

```bash
pnpm build
pnpm start
```

## Nasıl Çalışır? (Akış)

Uygulamanın kalbi `app/topla/PartSelectorWizard.tsx` dosyasıdır. Adımlar `steps` dizisinde tanımlıdır ve seçilen adıma göre ürünler listelenir. Kullanıcı bir karta tıklayınca o adımın seçimi güncellenir (aynı karta tekrar tıklanırsa seçim kaldırılır).

Uyumluluk kuralları özetle:
- İşlemci (CPU):
	- Anakart soketi ile aynı soket olmalı (örn. AM5 ↔ AM5)
	- Anakartın desteklediği nesillerde olmalı (örn. `ryzen_7000`)
- RAM:
	- Anakartın bellek tipiyle eşleşmeli (DDR4/DDR5)
- GPU:
	- Seçili kasa varsa: GPU uzunluğu kasa limitini aşmamalı
	- Seçili PSU varsa: PSU’nun gücü, GPU’nun önerdiği değerden düşük olmamalı
- Soğutucu:
	- Anakart soketini desteklemeli
	- CPU TDP’sini karşılayabilmeli (max TDP ≥ CPU TDP)
- Kasa:
	- Anakart form faktörünü (ATX/Micro-ATX/Mini-ITX) desteklemeli
	- Seçili GPU ve soğutucu ölçülerine izin vermeli
- PSU:
	- CPU TDP ve GPU önerilen güç toplamına yaklaşık %20 pay eklenerek hesaplanan gereksinimi karşılamalı
	- GPU’nun istediği ek güç konnektörleri (8pin/12pin) bulunmalı

Stok durumu:
- Ürün `stok.durum !== 'in_stock'` ise kart gri/opacity azaltılmış görünür, tıklanamaz ve klavye ile seçilemez; sağ altta “✗ Tükendi” etiketi gösterilir.

Toplam fiyat:
- Seçilen tüm parçaların `fiyat_try` değerleri toplanır ve yan panelde “Toplam” alanında gösterilir.

## Dizin Yapısı (Önemli Dosyalar)

```
app/
	globals.css            # Tailwind v4 ve temel stiller
	layout.tsx             # App Router layout
	page.tsx               # Ana sayfa
	topla/
		page.tsx             # Toplama sayfası (wizard burada render edilir)
		PartSelectorWizard.tsx  # Sihirbazın kendisi (durum, filtreler, UI)
	types/
		parts.ts             # Parça tipleri (CPU, Motherboard, RAM, GPU, ...)
data/
	*.json                 # Ürün veri kaynakları (anakart, islemci, ram, ...)
```

## Önemli Tipler ve Veri Kaynakları

- Tipler: `app/types/parts.ts`
	- `CPU`, `Motherboard`, `RAM`, `GPU`, `Cooler`, `Storage`, `Case`, `PSU` ve `SelectedParts` gibi arayüzler
- Veriler: `data/*.json`
	- Örnek: `islemci.json`, `anakart.json`, `ram.json`, vb.

## UI ve Stil Notları

- Tailwind CSS v4 kullanılır; gradyan sınıfları `bg-linear-to-r`, `bg-linear-to-br` gibi yazılır.
- Kartlar kompakt, sadece ad ve fiyat gösterir; seçildiğinde border ve arka plan vurgulanır.
- Ürünler stok dışı ise kartlar gri ve tıklanamazdır.
- Sağda “Seçimleriniz” paneli adım adım seçimleri listeler, fiyatlarla birlikte.

## Geliştirme İpuçları

- Adım kümesi ve tip güvenliği:
	- `steps` dizisi `as const` ile literal hale getirilir ve `type Step = (typeof steps)[number]` ile birleşim (union) tip üretilir.
- Uyumluluk mantığını genişletme:
	- M.2/PCIe nesli eşleşmesi, radyatör destekleri, PSU form faktörü vb. ek kurallar kolayca eklenebilir.
- “Uyumsuzları da göster” modu:
	- Şu an filtreleme uyumsuzları gizler. İsterseniz tüm ürünleri gösterip kartta “Uyumsuz” etiketi/badgesi gösterecek bir mod eklenebilir.

## Sık Karşılaşılan Sorular

• “Neden bazı adımlarda tüm ürünleri görüyorum?”
	- Önceki adımda seçim yoksa, kullanıcıyı kısıtlamamak için tüm ürünler listelenir. Seçim yapılınca uyumlu olanlara daralır.

• “Stokta olmayan ürünü neden seçemiyorum?”
	- Gerçek mağaza davranışına uygun şekilde, `out_of_stock` ürünler seçilemez ve gri görünür.

• “Gradyan sınıfları neden `bg-linear-to-*`?”
	- Tailwind v4 söz dizimi. Linter uyarılarıyla uyumlu olacak biçimde kullanılıyor.

## Komutlar

```bash
# Geliştirme
pnpm dev

# Lint
pnpm lint

# Build ve prod çalıştırma
pnpm build
pnpm start
```

## Lisans

Bu proje eğitim/demonstrasyon amaçlıdır. Veriler temsili olup gerçek stok/fiyatları yansıtmayabilir.
