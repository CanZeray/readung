# Readung

Learn German through stories. A web application that provides level-appropriate German stories for language learners.

## Features

- Level-based stories (A1-C2)
- User authentication
- Free and Premium membership options
- Word translation
- Save words for later review

## Tech Stack

- Next.js
- React
- Firebase (Authentication & Firestore)
- Tailwind CSS

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/readung.git
```

2. Install dependencies:
```bash
cd readung
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

MIT 