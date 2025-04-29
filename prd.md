# Ürün Gereksinim Dokümanı (PRD)

## Proje Özeti
"ReadGerman" İngilizce arayüze sahip, Almanca öğrenmek isteyenler için hikayeler sunan bir web uygulamasıdır. Kullanıcılar seviyelerine göre (A1-C2) hikayeler okuyabilirler. Websitesi ingilizce olacak.

## Kullanıcı Türleri
1. **Ücretsiz Kullanıcılar**
   - Günde sadece 1 hikaye okuyabilir
   - Sadece A1 ve A2 seviyesindeki hikayelere erişebilir

2. **Ücretli Kullanıcılar**
   - Sınırsız hikaye okuyabilir
   - Tüm seviyelere (A1, A2, B1, B2, C1, C2) erişebilir

## Temel Özellikler

### Kullanıcı Yönetimi
- Üye kaydı ve girişi 
- Kullanıcı profili yönetimi
- Üyelik seviyesi (ücretsiz/ücretli)

### Ana Sayfa
- Kullanıcının okuduğu hikaye sayısı
- Kullanıcı istatistikleri
- Seviye seçimi (A1, A2, B1, B2, C1, C2)

### Hikaye Listesi
- Seçilen zorluk seviyesine göre hikayelerin listelenmesi
- Her hikaye için:
  - Başlık
  - Kısa açıklama
  - Kelime sayısı
  - Tahmini okuma süresi

### Hikaye Okuma
- Tam metin görüntüleme
- Okuma ilerlemesi takibi

## Kullanıcı Akışı
1. Kullanıcı siteye girer
2. Üye girişi/kayıt sayfasına yönlendirilir
3. Giriş yapıldıktan sonra ana sayfaya yönlendirilir
4. Almanca seviyelerinden birini seçer (A1, A2, B1, B2, C1, C2)
5. Seçilen seviyedeki hikayeler listelenir
6. Kullanıcı bir hikaye seçer ve okur

## Teknik Gereksinimler

- Kullanıcı ve hikaye veritabanı
- Kullanıcı yetkilerinin kontrolü
- Günlük hikaye limiti takibi (ücretsiz kullanıcılar için)

## Gelecek Özellikleri
- Kelime kaydetme
- Ses ile dinleme
- İlerleme testleri
- Topluluk özellikleri