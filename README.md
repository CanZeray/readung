# Readung - Language Learning Platform

Modern dil öğrenme platformu. Next.js, Firebase ve Stripe ile geliştirilmiştir.

## 🚀 Özellikler

- **Çoklu Seviye**: A1'den C2'ye kadar dil seviyeleri
- **Premium Üyelik**: Stripe entegrasyonu ile ödeme sistemi
- **Firebase Auth**: Güvenli kullanıcı yönetimi
- **Responsive**: Tüm cihazlarda uyumlu tasarım

## 🛠️ Teknolojiler

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payment**: Stripe
- **Hosting**: Vercel ready

## ⚙️ Kurulum

### 1. Repository'yi Clone Edin
```bash
git clone [repository-url]
cd readung-main
npm install
```

### 2. Environment Variables

`.env.local` dosyası oluşturun ve aşağıdaki değişkenleri ekleyin:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (Server-side)
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Firebase Kurulumu

1. [Firebase Console](https://console.firebase.google.com/) 'da yeni proje oluşturun
2. Authentication'ı etkinleştirin (Email/Password)
3. Firestore Database oluşturun
4. Service Account key'i indirin ve `FIREBASE_CLIENT_EMAIL` ve `FIREBASE_PRIVATE_KEY` değerlerini alın

### 4. Stripe Kurulumu

1. [Stripe Dashboard](https://dashboard.stripe.com/) 'da hesap oluşturun
2. Test anahtarlarınızı alın
3. Products sayfasında Premium plan için pricing oluşturun
4. Webhook endpoint'i ekleyin: `your-domain.com/api/webhook`
5. Aşağıdaki event'leri dinleyecek şekilde ayarlayın:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 5. Development Server'ı Başlatın

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## 🔧 Development Mode Özellikleri

Development modunda aşağıdaki test endpoint'leri aktiftir:

- `/api/test-env` - Environment variables debug
- `/api/update-user-membership` - Manuel premium üyelik aktivasyonu

⚠️ **Güvenlik**: Bu endpoint'ler production'da otomatik olarak devre dışı kalır.

## 📝 Kullanım

### Premium Üyelik Test Etme

1. Uygulamayı çalıştırın
2. Hesap oluşturun
3. Profile sayfasına gidin
4. "🧪 Test: Activate Premium" butonuna tıklayın (sadece development'da görünür)

### Stripe Test Kartları

Test ödemeleri için:
- **Başarılı**: 4242 4242 4242 4242
- **CVV**: Herhangi 3 haneli sayı
- **Tarih**: Gelecekteki herhangi bir tarih

## 🚀 Production Deployment

### Vercel'e Deploy

1. [Vercel](https://vercel.com) hesabınızı GitHub'a bağlayın
2. Repository'yi import edin
3. Environment variables'ları Vercel dashboard'dan ekleyin
4. Deploy edin

### Stripe Webhook Kurulumu

Production'da webhook URL'ini güncelleyin:
```
https://your-domain.vercel.app/api/webhook
```

## 📚 API Endpoints

### Public Endpoints
- `POST /api/auth/*` - Firebase Authentication
- `GET /api/health` - Health check

### Protected Endpoints  
- `POST /api/create-checkout-session` - Stripe checkout session
- `POST /api/cancel-subscription` - Subscription cancellation
- `POST /api/webhook` - Stripe webhooks

### Development Only
- `GET /api/test-env` - Environment debug
- `POST /api/update-user-membership` - Manual premium activation

## 🔒 Güvenlik

- Environment variables asla commit edilmez
- API route'ları Firebase Auth ile korunur
- Stripe webhook'ları signature ile doğrulanır
- Test endpoint'leri production'da devre dışıdır

## 🐛 Troubleshooting

### Environment Variables Yüklenmiyor
1. `.env.local` dosyasının root directory'de olduğundan emin olun
2. Dosya encoding'inin UTF-8 olduğunu kontrol edin
3. Development server'ı yeniden başlatın

### Stripe Webhook Çalışmıyor
1. Webhook URL'inin doğru olduğunu kontrol edin
2. Webhook secret'ın environment'da tanımlı olduğundan emin olun
3. Stripe Dashboard'da webhook event'lerini kontrol edin

### Firebase Connection Error
1. Service account key'inin doğru format'ta olduğunu kontrol edin
2. Firebase project ID'sinin doğru olduğundan emin olun
3. Firestore rules'ların uygun olduğunu kontrol edin

## 📄 License

MIT License

## 🤝 Contributing

Pull request'ler memnuniyetle karşılanır. Büyük değişiklikler için lütfen önce issue açın.

---

**Not**: Bu proje eğitim amaçlıdır. Production kullanımı için ek güvenlik önlemleri alınmalıdır. 