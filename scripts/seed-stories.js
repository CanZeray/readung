// Çevresel değişkenleri yükle
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log("Firebase yapılandırması yükleniyor...");
console.log(`Project ID: ${firebaseConfig.projectId}`);

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Örnek hikayeler
const sampleStories = [
  {
    id: 'a1-1',
    title: 'Meine Familie',
    description: 'A simple story about a German family.',
    content: `Hallo! Ich heiße Anna. Ich bin 25 Jahre alt. Ich komme aus Deutschland. Ich wohne in Berlin.

Das ist meine Familie. Mein Vater heißt Thomas. Er ist 50 Jahre alt. Er ist Lehrer. Meine Mutter heißt Maria. Sie ist 48 Jahre alt. Sie ist Ärztin.

Ich habe einen Bruder und eine Schwester. Mein Bruder heißt Max. Er ist 20 Jahre alt. Er studiert Informatik. Meine Schwester heißt Lena. Sie ist 15 Jahre alt. Sie geht noch zur Schule.

Wir haben auch einen Hund. Er heißt Rex. Er ist 3 Jahre alt. Wir alle lieben Rex sehr.

Am Wochenende essen wir zusammen zu Mittag. Wir sprechen über unsere Woche. Das finde ich schön.`,
    wordCount: 120,
    readTime: 2,
    level: 'a1'
  },
  {
    id: 'a1-2',
    title: 'Im Restaurant',
    description: 'Learn vocabulary for ordering food in a restaurant.',
    content: `Peter geht in ein Restaurant. Er hat Hunger. Er setzt sich an einen Tisch. Eine Kellnerin kommt zu ihm.

"Guten Tag. Was möchten Sie bestellen?", fragt die Kellnerin.

"Ich möchte die Speisekarte sehen, bitte", sagt Peter.

Die Kellnerin gibt ihm die Speisekarte. Peter liest die Speisekarte.

"Ich nehme die Tomatensuppe und ein Schnitzel mit Pommes", sagt Peter.

"Möchten Sie auch etwas trinken?", fragt die Kellnerin.

"Ja, ich möchte ein Glas Wasser und ein Bier, bitte", antwortet Peter.

Die Kellnerin bringt zuerst die Getränke. Später bringt sie die Tomatensuppe. Die Suppe schmeckt gut.

Dann bringt die Kellnerin das Schnitzel mit Pommes. Peter isst alles auf. Es schmeckt sehr gut.

Zum Schluss bestellt Peter einen Kaffee. Die Kellnerin bringt den Kaffee und die Rechnung.

"Das macht 22,50 Euro", sagt die Kellnerin.

Peter bezahlt und gibt Trinkgeld. "Danke und auf Wiedersehen", sagt Peter.`,
    wordCount: 150,
    readTime: 3,
    level: 'a1'
  },
  {
    id: 'a2-1',
    title: 'Ein Tag im Park',
    description: 'A day in the park with friends.',
    content: `Es ist Samstag und das Wetter ist schön. Die Sonne scheint und es ist warm. Lisa und ihre Freunde gehen in den Park.

Lisa trifft ihre Freunde am Parkeingang. Sie heißen Markus, Sophie und David. Sie haben einen Ball, eine Decke und einen Picknickkorb dabei.

Sie suchen einen schönen Platz unter einem Baum. Dort breiten sie die Decke aus. Im Picknickkorb haben sie Brötchen, Käse, Obst und Getränke.

Zuerst essen sie ihr Picknick. Sie unterhalten sich über die Schule und ihre Pläne für die Sommerferien. Sophie möchte ans Meer fahren. Markus will in die Berge gehen. David bleibt zu Hause, aber er will oft schwimmen gehen.

Nach dem Essen spielen sie mit dem Ball. Sie machen einen Kreis und werfen den Ball einander zu. Das macht Spaß!

Im Park gibt es auch einen kleinen See. Sie beobachten die Enten auf dem Wasser. Ein Mann füttert die Enten mit Brot.

Später kaufen sie ein Eis an einem Kiosk. Lisa nimmt Schokoladeneis, Sophie und David nehmen Vanilleeis und Markus nimmt Erdbeereis.

Sie sitzen auf einer Bank und essen ihr Eis. Sie sehen viele Menschen im Park: Familien mit Kindern, Leute, die joggen oder Fahrrad fahren, und Hunde, die mit ihren Besitzern spazieren gehen.

Am Abend gehen sie nach Hause. Sie sind müde, aber glücklich. Es war ein schöner Tag im Park.`,
    wordCount: 250,
    readTime: 4,
    level: 'a2'
  },
  {
    id: 'b1-1',
    title: 'Die Reise nach Berlin',
    description: 'A journey to Berlin and exploring the city.',
    content: `Marie hatte schon lange davon geträumt, Berlin zu besuchen. Als Studentin der Geschichte interessierte sie sich besonders für die bewegte Vergangenheit der deutschen Hauptstadt. Endlich, in den Semesterferien, hatte sie die Gelegenheit, ihre Reisepläne zu verwirklichen.

Die Zugfahrt von München nach Berlin dauerte etwa vier Stunden. Marie nutzte die Zeit, um ihren Reiseführer zu studieren und ihre Besichtigungstour zu planen. Sie hatte nur fünf Tage Zeit und wollte so viel wie möglich sehen.

In Berlin angekommen, nahm Marie die U-Bahn zu ihrem Hostel im Stadtteil Kreuzberg. Das Hostel war einfach, aber sauber und das Personal sehr freundlich. Nach dem Einchecken machte sie sich sofort auf den Weg, um die Stadt zu erkunden.

Am ersten Tag besuchte Marie das Brandenburger Tor, das für sie das Symbol der deutschen Wiedervereinigung darstellte. Sie war beeindruckt von der Größe und Schönheit dieses historischen Bauwerks. Von dort aus ging sie zum Reichstagsgebäude, wo sie sich für eine Führung angemeldet hatte. Die gläserne Kuppel bot einen atemberaubenden Blick über die Stadt.

Am nächsten Tag stand ein Besuch der Museumsinsel auf dem Programm. Marie verbrachte Stunden im Pergamonmuseum und im Neuen Museum, wo sie die berühmte Büste der Nofretete bewunderte.

Ein Höhepunkt ihrer Reise war der Besuch der East Side Gallery, einem Teil der ehemaligen Berliner Mauer, der von Künstlern aus aller Welt bemalt wurde. Die bunten Bilder und politischen Botschaften berührten Marie tief.

In den nächsten Tagen erkundete sie verschiedene Stadtteile, probierte lokale Spezialitäten wie Currywurst und Döner Kebab, und genoss das Nachtleben der Stadt. Sie besuchte auch das Holocaust-Mahnmal und den Checkpoint Charlie, wichtige Orte, die an die dunkleren Kapitel der deutschen Geschichte erinnern.

Am letzten Abend saß Marie in einem gemütlichen Café am Prenzlauer Berg und dachte über ihre Erlebnisse nach. Berlin hatte sie mit seiner Vielfalt, seiner Geschichte und seiner lebendigen Kulturszene beeindruckt. Sie wusste, dass sie wiederkommen würde, um mehr von dieser faszinierenden Stadt zu entdecken.`,
    wordCount: 350,
    readTime: 6,
    level: 'b1'
  }
];

// Firestore'a hikayeleri ekle
async function seedStories() {
  try {
    console.log('Hikayeleri Firestore\'a eklemeye başlıyorum...');
    
    for (const story of sampleStories) {
      const storyId = story.id;
      delete story.id; // ID'yi döküman verilerinden çıkarıyoruz
      
      // Firestore'a hikaye ekle
      await setDoc(doc(db, "stories", storyId), story);
      console.log(`Hikaye eklendi: ${storyId}`);
    }
    
    console.log('Tüm hikayeler başarıyla eklendi!');
  } catch (error) {
    console.error('Hata:', error);
  }
}

seedStories(); 