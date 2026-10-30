// Testi della piattaforma (caricati solo per la lingua scelta).
export default {
    // Layout
    nav: { home: 'Home', modules: 'Formazione', support: 'Supporto', visitSite: 'Visita il Sito', logout: 'Chiudi Sessione', admin: 'Dashboard Admin' },

    // Welcome
    welcome: {
      tagline: 'Il training\n',
      taglineAccent: 'che accoglie',
      subtitle: 'Preparati a vivere la realtà virtuale in reparto.\nUn percorso formativo semplice, intuitivo e sicuro.',
      badge: 'Lemons in the Room — Guida Operativa',
      badgeSub: 'Lemons in the room Certified',
      title: 'Accedi',
      description: "Inserisci le tue credenziali operative per sbloccare un'esperienza di training immersiva",
      firstName: 'Nome', lastName: 'Cognome', email: 'Email', phone: 'Telefono', phoneOptional: '(opzionale)', hospital: 'Ospedale', department: 'Reparto',
      patientProfile: 'Profilo Paziente', pediatria: 'Pediatrico', adulti: 'Adulto',
      placeholderFirst: 'Mario', placeholderLast: 'Rossi', placeholderEmail: 'mario.rossi@ospedale.it', placeholderPhone: '+39 333 000 0000', placeholderHospital: 'Es. Careggi', placeholderDept: 'Es. Oncologia',
      submit: 'Accedi al training',
    },

    // Home
    home: {
      badge: 'Lemons Hub',
      greeting: 'Ciao,',
      guest: 'Ospite',
      subtitle: 'Benvenuto nel mondo Lemons. Qui troverai tutto il necessario per prepararti.',
      modulesOf: 'di',
      modulesCompleted: 'Moduli completati',
      statusDone: 'Status: operativo',
      statusProgress: 'Prosegui il training',
      descDone: "Eccellente. Hai acquisito tutte le competenze necessarie. Il tuo profilo è ora abilitato all'uso dell'ecosistema.",
      descProgress: 'Manca poco. Completa le sessioni rimanenti per sbloccare la tua certificazione ufficiale e l\'accesso completo.',
      goModules: 'Vai ai moduli',
      getCert: 'Ottieni certificato',
      exploreTitle: 'Esplora i\nContenuti',
      supportTitle: 'Centro\nAssistenza',
      badgeOperativo: 'Operativo',
      badgeInCorso: 'In Corso',
      moduleStepsAdulti:    ['Intro', 'Accens.', 'Posiz.', 'Sanif.', 'Menu', 'Simul.'],
      moduleStepsPediatria: ['Intro', 'Accens.', 'Posiz.', 'Sanif.', 'Paziente', 'Nav.', 'Rabbits', 'Telly', 'Menu'],
      menuClickDescPediatria: 'Come navigare nel menù di Lemo, la nostra applicazione per pazienti adolescenti e adulti.',
      dateLocale: 'it-IT',
      chapterWelcome: 'Benvenuto',
      chapterProgress: 'Avanzamento',
      newsletterTitle: 'Entra nel mondo',
      newsletterTitleAccent: 'Lemons',
      newsletterDesc: 'Novità, aggiornamenti e contenuti esclusivi sull\'uso della realtà virtuale in sanità.',
      newsletterPlaceholder: 'La tua email',
      newsletterSubmit: 'Iscriviti',
      newsletterSubmitting: 'Iscrizione...',
      newsletterNo: 'No grazie',
      newsletterSuccessTitle: 'Grazie!',
      newsletterSuccessDesc: 'Sei iscritto al mondo Lemons.',
      certCode: 'Codice Attestato',
      certTitle: 'Attestato di Qualifica',
      certConferredTo: 'Conferito con merito a:',
      certBody: (ecosystem, hospital, dept) => `Per aver completato con successo l'intero percorso formativo e aver dimostrato piena competenza tecnica, operativa e procedurale nell'utilizzo dell'ecosistema ${ecosystem} presso la struttura ${hospital} (${dept}).`,
      certDate: 'Data di Rilascio',
      certSig: 'Firma Autorizzata',
      certFallbackHospital: 'Struttura Ospedaliera',
      certFallbackDept: 'Reparto',
    },

    // Modules
    modules: {
      badge: 'Training Center',
      titleMain: 'Libreria',
      titleAccent: 'Moduli',
      subtitleFull: 'Accesso libero a tutti i contenuti formativi.',
      subtitleGuided: 'Completa le lezioni in sequenza per abilitare la certificazione.',
      module: 'Modulo',
      completed: 'Completato',
      badgeOperativo: 'Operativo',
      badgeInCorso: 'In Corso',
      freeMode: 'Modalità libera',
      chapterTraining: 'Formazione',
      progressLabel: 'Avanzamento percorso',
      progressDone: 'Percorso completato 🎉',
      progressRemaining: (n) => `${n} moduli rimanenti per la certificazione`,
      nextBadge: 'Prossimo',
      allDone: 'Formazione completata',
      certReady: 'Il tuo certificato è pronto',
      lessons: [
        {
          title: 'Introduzione', duration: '1',
          description: 'Scopri i componenti del kit Lemons e come rendere la postazione operativa in pochi passi.',
          questions: [
            {
              question: 'Quali componenti sono inclusi nel kit Lemons?',
              answers: ['Solo il visore e il caricabatterie', 'Visore, teca, basetta di ricarica e controller', 'Visore, cavo USB-C e manuale', 'Visore, controller e cuffie audio'],
              correct: 1,
            },
            {
              question: 'I controller del dispositivo vengono utilizzati durante la sessione con il paziente?',
              answers: ['Sì, sono indispensabili', 'No, in questo contesto non vengono utilizzati', 'Solo per il profilo pediatrico', 'Solo per avviare l\'esperienza'],
              correct: 1,
            },
            {
              question: 'Qual è la funzione della teca?',
              answers: ['Contenere i controller', 'Ricaricare il visore', 'Proteggere il visore e fungere da elemento espositivo', 'Collegare il caricabatterie alla rete'],
              correct: 2,
            },
            {
              question: 'Come si mantiene il visore sempre pronto all\'uso?',
              answers: ['Collegando il caricabatterie direttamente al visore ogni sera', 'Spegnendolo e riponendolo nella teca dopo ogni utilizzo', 'Tenendolo sempre in carica nella basetta di ricarica e rimettendolo al suo posto dopo ogni utilizzo', 'Caricandolo con il cavo USB-C incluso nel kit'],
              correct: 2,
            },
          ],
          slides: [
            { title: 'I Materiali del Kit', content: 'Il kit Lemons è composto da: visore, teca di esposizione e protezione, basetta di ricarica con il suo caricabatterie. Sono inclusi anche i controller del dispositivo, che però in questo contesto non vengono utilizzati.' },
            { title: 'La Teca', content: 'La teca ha una doppia funzione: proteggere il visore quando non è in uso e fungere da elemento espositivo della postazione. Mantienila sempre in una posizione accessibile e stabile.' },
            { title: 'La Ricarica', content: 'Il visore rimane sempre in carica all\'interno della basetta. Quando serve: tiralo su, dallo al paziente, igienizzallo e rimettilo al suo posto.' },
          ],
        },
        {
          title: 'Accensione & Stand-by', duration: '1',
          description: 'Come accendere il visore, avviare l\'esperienza e metterlo in stand-by in pochi secondi.',
          questions: [
            {
              question: 'Dove viene posizionata la teca all\'interno del reparto?',
              answers: ['In un armadio chiuso a chiave', 'In un punto strategico, ben visibile e comodo per gli operatori', 'Vicino all\'uscita di emergenza', 'Nella stanza del primario'],
              correct: 1,
            },
            {
              question: 'Come si accende il visore?',
              answers: ['Premendo rapidamente il pulsante una volta', 'Premendo contemporaneamente due pulsanti', 'Tenendo premuto il pulsante di accensione per qualche secondo', 'Agitando il visore finché non si avvia'],
              correct: 2,
            },
            {
              question: 'Cosa si deve fare una volta posizionato il visore sulla testa del paziente?',
              answers: ['Bisogna selezionare manualmente ogni volta l\'esperienza dal menu', 'Si deve aspettare che un operatore avvii l\'app da remoto', 'Il visore emette un suono e poi va avviato manualmente', 'Niente, l\'esperienza parte in automatico'],
              correct: 3,
            },
            {
              question: 'Come si mette il visore in stand-by?',
              answers: ['Tenendo premuto il pulsante per 5 secondi', 'Spegnendolo completamente dal menu impostazioni', 'Aspettando che si spenga da solo dopo 10 minuti', 'Premendo una volta il pulsante di accensione o rimuovendolo e posizionandolo nuovamente sulla basetta di ricarica'],
              correct: 3,
            },
          ],
          slides: [
            { title: 'La Postazione', content: 'La teca deve essere posizionata in un punto strategico e ben visibile del reparto. Al suo interno si trovano il visore e la basetta di ricarica, già collegata al caricabatterie. La soluzione è sempre pronta all\'uso.' },
            { title: 'Accensione', content: 'Per accendere il visore, tieni premuto il pulsante di accensione per qualche secondo. Il visore sarà già impostato sull\'applicazione corretta. Una volta indossato, l\'esperienza parte in automatico.' },
            { title: 'Stand-by e Riposizionamento', content: 'Al termine della sessione, premi una volta il pulsante di accensione per mettere il visore in stand-by. Sanificalo e riposizionalo nella teca: è già pronto per il prossimo utilizzo.' },
          ],
        },
        {
          title: 'Posizionamento & Ricarica', duration: '1',
          description: 'Come posizionare correttamente il visore nella basetta e verificare lo stato di ricarica.',
          questions: [
            {
              question: 'Quante spie sono presenti sulla basetta di ricarica?',
              answers: ['Una sola, quella del visore', 'Due, una per il visore e una per i controller', 'Tre, una centrale per il visore e due per i controller', 'Quattro, una per ogni componente del kit'],
              correct: 2,
            },
            {
              question: 'Come si verifica che il visore sia posizionato correttamente in ricarica?',
              answers: ['Il visore emette un suono di conferma', 'Lo schermo interno si accende brevemente', 'La spia centrale della basetta si illumina', 'La basetta inizia a vibrare'],
              correct: 2,
            },
            {
              question: 'Cosa indica la spia rossa sulla basetta?',
              answers: ['Errore di posizionamento', 'Ricarica completata', 'Visore in stand-by', 'Batteria scarica'],
              correct: 3,
            },
            {
              question: 'Cosa indica la spia verde sulla basetta?',
              answers: ['Visore in fase di aggiornamento', 'Batteria carica', 'Connessione al Wi-Fi attiva', 'Controller correttamente posizionati'],
              correct: 1,
            },
          ],
          slides: [
            { title: 'Le Spie della Basetta', content: 'La basetta di ricarica ha tre piccole spie: due per i controller e una centrale, che indica lo stato di carica del visore. È quella a cui prestare attenzione.' },
            { title: 'Posizionamento Corretto', content: 'Per ricaricare, appoggia il visore sulla basetta di ricarica facendo aderire la mascherina allo spinotto. Quando il contatto è corretto, la spia centrale si illumina — è la conferma che il visore sta caricando.' },
            { title: 'Leggere lo Stato della Batteria', content: 'Il colore della spia indica lo stato della batteria: rosso = scarico, verde = carico. Controlla sempre la spia dopo ogni riposizionamento per essere sicuro che il visore sia pronto al prossimo utilizzo.' },
          ],
        },
        {
          title: 'Sanificazione', duration: '1',
          description: 'Come igienizzare correttamente il visore tra un utilizzo e l\'altro, con attenzione particolare alle lenti.',
          questions: [
            {
              question: 'Quando va igienizzato il visore?',
              answers: ['Una volta al giorno, la mattina prima del turno', 'Solo se visibilmente sporco', 'Tra un utilizzo e l\'altro, prima di riporlo nella basetta', 'Una volta a settimana'],
              correct: 2,
            },
            {
              question: 'Come si pulisce la mascherina del visore?',
              answers: ['Solo con acqua e sapone neutro', 'Con un panno in microfibra asciutto', 'Con un panno imbevuto di soluzione alcolica', 'Con salviette umidificate non alcoliche'],
              correct: 2,
            },
            {
              question: 'Come si puliscono le lenti del visore?',
              answers: ['Con soluzione alcolica e panno morbido', 'Con le stesse salviette usate per la mascherina', 'Con acqua distillata e panno in cotone', 'Con un panno in microfibra asciutto, senza alcuna soluzione'],
              correct: 3,
            },
            {
              question: 'In che materiale è costruito il visore?',
              answers: ['Gomma siliconica', 'Vetro temperato e alluminio', 'Plastica, completamente igienizzabile', 'Materiale composito non igienizzabile'],
              correct: 2,
            },
          ],
          slides: [
            { title: 'Quando Igienizzare', content: 'Il visore va sempre igienizzato tra un utilizzo e l\'altro, prima di riporlo nella basetta di ricarica. Il dispositivo è in materiale plastico, quindi completamente igienizzabile, ad eccezione delle lenti.' },
            { title: 'Mascherina e Corpo del Visore', content: 'La parte a contatto con la pelle è la mascherina: si pulisce con un panno imbevuto di soluzione alcolica (quella già presente in reparto). Lo stesso vale per tutto l\'hardware esterno del visore.' },
            { title: 'Attenzione alle Lenti', content: 'Le lenti sono l\'unica parte che richiede cura speciale: vanno pulite come un paio di occhiali, con un panno in microfibra asciutto. Nessun liquido o soluzione alcolica deve entrare in contatto con esse.' },
          ],
        },
        {
          title: 'Menu & Click', duration: '1',
          description: 'Come navigare nel menu di Lemo e selezionare le esperienze usando le mani.',
          questions: [
            {
              question: 'Cosa appare una volta acceso il visore?',
              answers: ['Direttamente l\'esperienza per il paziente', 'Una schermata nera con le istruzioni scritte', 'Una bacheca con le esperienze disponibili tra cui scegliere', 'Il tutorial obbligatorio per l\'operatore'],
              correct: 2,
            },
            {
              question: 'Come funziona il cursore nel menu del visore?',
              answers: ['Si usa il controller destro per puntare', 'Si usa la voce per dire il nome dell\'esperienza', 'Si inclina la testa nella direzione desiderata', 'Si punta con indice e pollice leggermente aperti e appare un puntino giallo'],
              correct: 3,
            },
            {
              question: 'Come si effettua un click nel menu?',
              answers: ['Tenendo premuto il dito indice per 2 secondi', 'Battendo il piede o muovendo la testa', 'Con un piccolo pizzicotto rapido unendo indice e pollice', 'Aprendo completamente la mano verso il pannello'],
              correct: 2,
            },
            {
              question: 'Oltre alle mani, quale altro metodo si può usare per navigare nel menu?',
              answers: ['I controller inclusi nel kit', 'Il touch screen laterale del visore', 'Un telecomando bluetooth esterno', 'La voce, spiegata nel tutorial iniziale dell\'esperienza'],
              correct: 3,
            },
          ],
          slides: [
            { title: 'Il Menu di Lemo', content: 'Una volta acceso, il visore mostra una bacheca con tutte le esperienze disponibili (ecco il menù di Lemo). Da qui l\'operatore sceglie la procedura più adatta al paziente. La navigazione avviene tramite mani o voce (la voce viene spiegata nel tutorial iniziale dell\'esperienza).' },
            { title: 'Il Cursore', content: 'Per navigare, tieni indice e pollice leggermente aperti — come se stessi usando un mouse. Puntando verso il pannello, apparirà un puntino giallo: è il tuo cursore. Muovi la mano per spostarlo sulle opzioni.' },
            { title: 'Il Click', content: 'Per selezionare, esegui un piccolo pizzicotto rapido unendo indice e pollice. Breve e deciso: quello è il tuo click. Con questo gesto puoi scegliere qualsiasi esperienza dal menu.' },
          ],
        },
        {
          title: 'Posizionamento sul Paziente', duration: '1',
          description: 'Come indossare e regolare correttamente il cinturino elastico del visore sulla testa del paziente.',
          questions: [
            {
              question: 'Che tipo di cinturino ha il visore pediatrico?',
              answers: ['Rigido con chiusura a velcro', 'In silicone con fibbia regolabile', 'Elastico', 'Con cuffie integrate e archetto metallico'],
              correct: 2,
            },
            {
              question: 'Come si regola il cinturino del visore?',
              answers: ['Girando una rotella posteriore', 'Allargando l\'archetto rigido laterale', 'Facendo scorrere i nastri elastici', 'Usando il velcro laterale'],
              correct: 2,
            },
            {
              question: 'Come si verifica che il visore sia posizionato correttamente?',
              answers: ['Il visore emette un suono di conferma', 'La spia del cinturino si illumina', 'È centrato sugli occhi, non scivola e la visuale non risulta sgranata', 'Lo schermo interno mostra il messaggio "Pronto"'],
              correct: 2,
            },
          ],
          slides: [
            { title: 'Il Cinturino', content: 'Il cinturino è composto da due nastri elastici che si regolano facilmente scorrendo. Nessun attrezzo necessario.' },
            { title: 'Come Regolarlo', content: 'Fai scorrere i nastri elastici superiore e inferiore fino a trovare la misura giusta per la testa del paziente. La regolazione è rapida. Assicurati che il visore sia stabile e confortevole.' },
            { title: 'Verifica del Posizionamento', content: 'Il visore è posizionato correttamente quando è centrato sugli occhi e non scivola. Chiedi sempre al paziente se è comodo e la visuale non risulta sgranata prima di avviare l\'esperienza.' },
          ],
        },
        {
          title: 'Rabbits', duration: '1',
          description: 'L\'esperienza immersiva per il prelievo pediatrico: quattro fasi guidate dall\'operatore per distrarre e accompagnare il bambino.',
          questions: [
            {
              question: 'Chi decide i tempi dell\'esperienza Rabbits?',
              answers: ['Il bambino, premendo i tasti autonomamente', 'Il visore, in modo completamente automatico', 'Il clinico/operatore, che gestisce i quattro momenti', 'Un timer automatico impostato prima dell\'uso'],
              correct: 2,
            },
            {
              question: 'Quale tasto si preme per avviare il momento del prelievo?',
              answers: ['Il tasto A', 'Il tasto B', 'Il primo tasto', 'Il grilletto'],
              correct: 3,
            },
            {
              question: 'Qual è la sequenza corretta dei tasti?',
              answers: ['Grilletto → Tasto laterale → A → B', 'A → B → Grilletto → Tasto laterale', 'Tasto laterale → Grilletto → B → A', 'B → A → Tasto laterale → Grilletto'],
              correct: 2,
            },
            {
              question: 'Qual è il principio su cui si basa l\'esperienza Rabbits?',
              answers: ['Addormentare il bambino con suoni rilassanti', 'Bloccare fisicamente il braccio con una fascia', 'Mostrare un video animato generico per distrarre', 'Confondere il feedback tattile della puntura con un feedback visivo della mascotte'],
              correct: 3,
            },
          ],
          slides: [
            { title: 'Come Funziona Rabbits', content: 'Rabbits è l\'esperienza pensata per il prelievo pediatrico. È l\'operatore a dettare i tempi: ci sono quattro momenti che corrispondono a introduzione, prelievo, approfondimento e conclusione.' },
            { title: 'I Quattro Momenti', content: '1° tasto: Introduzione — il bambino entra nell\'esperienza. Grilletto: Prelievo — l\'esperienza copre il momento della puntura. Tasto B: Approfondimento — proseguimento della storia. Tasto A: Conclusione — chiusura dell\'esperienza.' },
            { title: 'La Logica dell\'Esperienza', content: 'Rabbits sfrutta la distrazione visiva per confondere il feedback tattile della puntura con un elemento narrativo: la mascotte preleva l\'energia dal braccio del bambino. L\'operatore controlla il ritmo in base alla durata effettiva del prelievo.' },
          ],
        },
        {
          title: 'Telly', duration: '1',
          description: 'L\'esperienza di distrazione attiva per il paziente pediatrico: gamification, allenamento funzionale e training cognitivo in un fondale marino.',
          questions: [
            {
              question: 'Che tipo di esperienza è Telly?',
              answers: ['Un\'esperienza passiva con video rilassanti', 'Un\'esperienza narrativa a fasi come Rabbits', 'Un\'esperienza di distrazione attiva con gamification e interazione', 'Un tutorial per l\'operatore sanitario'],
              correct: 2,
            },
            {
              question: 'Dove si svolge l\'esperienza Telly?',
              answers: ['Nello spazio, tra stelle e pianeti', 'In una foresta incantata', 'In un fondale marino', 'In una città futuristica'],
              correct: 2,
            },
            {
              question: 'Cosa deve fare il paziente durante l\'esperienza?',
              answers: ['Seguire una storia senza interagire', 'Rispondere a domande vocali', 'Sparare alle bolle che escono dalle conchiglie, evitando le bombe', 'Muovere la testa per guidare un personaggio'],
              correct: 2,
            },
          ],
          slides: [
            { title: 'Cos\'è Telly', content: 'Telly è l\'esperienza di distrazione attiva di Lemons in the Room. A differenza di Rabbits, qui il paziente interagisce direttamente con l\'ambiente virtuale attraverso principi di gamification, allenamento funzionale e training cognitivo.' },
            { title: 'Il Fondale Marino', content: 'Il paziente si trova immerso in un fondale marino e impugna un controller — la sua pistola spara bolle. Puntando, vede l\'arma in mano. L\'obiettivo è scoppiare le bolle che escono dalle conchiglie sparse nell\'ambiente.' },
            { title: 'Attenzione alle Bombe', content: 'Non tutte le bolle vanno scoppiate: il paziente deve fare attenzione alle bombe e non spararci. Questo elemento introduce una componente cognitiva che mantiene alta la concentrazione e la distrazione durante la procedura.' },
          ],
        },
        {
          title: 'Simulazione', duration: '1',
          description: 'Prova pratica completa: dalla teca al paziente, tutto il flusso operativo in una volta sola.',
          questions: [
            {
              question: 'Qual è il primo passo della procedura con il paziente?',
              answers: ['Accendere il visore e selezionare l\'esperienza', 'Aprire la teca e prendere il visore', 'Igienizzare il visore prima di toccarlo', 'Verificare il livello della batteria'],
              correct: 1,
            },
            {
              question: 'Come si regola il cinturino del visore adulti?',
              answers: ['Facendo scorrere i nastri elastici laterali', 'Allargando l\'archetto rigido a scatto', 'Usando la rotella posteriore', 'Agganciando il velcro sulla sommità della testa'],
              correct: 2,
            },
            {
              question: 'In che ordine si posiziona il visore?',
              answers: ['Prima dietro la testa, poi sugli occhi', 'Prima sugli occhi, poi si aggancia dietro e si stringe con la rotella', 'Si appoggia sulla fronte e scivola da solo', 'Prima si stringe la rotella, poi si posiziona'],
              correct: 1,
            },
            {
              question: 'Come si verifica che l\'esperienza sia partita?',
              answers: ['Il visore vibra tre volte', 'Il paziente lo conferma verbalmente', 'La luce bianca sulla fronte si accende e si sente l\'audio dell\'esperienza', 'Lo schermo esterno mostra "In corso"'],
              correct: 2,
            },
            {
              question: 'Dove si trovano i controlli del volume sul visore?',
              answers: ['Sul lato sinistro, vicino al pulsante di accensione', 'Sulla parte superiore del cinturino', 'Sopra lo zigomo destro', 'Sul retro del visore, accanto alla rotella'],
              correct: 2,
            },
            {
              question: 'Cosa si deve fare al termine della sessione con il paziente?',
              answers: ['Si spegne il visore dal menu e si lascia sulla scrivania', 'Si rimette il visore nella teca senza toccarlo', 'Si passa il visore al paziente successivo direttamente', 'Si rimuove il visore, lo si igienizza e lo si ripone nella basetta di ricarica'],
              correct: 3,
            },
          ],
          slides: [
            { title: 'Il Flusso Completo', content: 'La simulazione riepiloga tutto il percorso: apri la teca, prendi il visore, allarga il cinturino con la rotella posteriore, posiziona prima sugli occhi poi dietro la testa, e regola la rotella per trovare la giusta aderenza. Non serve selezionare l\'esperienza: parte in automatico.' },
            { title: 'Verificare che Tutto Funzioni', content: 'Due segnali confermano che l\'esperienza è partita correttamente: la luce bianca sulla fronte del visore e il volume (le due barrette sopra lo zigomo destro). Se senti l\'audio, l\'esperienza è avviata.' },
            { title: 'Pronto per il Paziente', content: 'Una volta avviata l\'esperienza, l\'operatore rimane vicino al paziente per tutta la durata. Al termine: rimuovi il visore, igienizzalo e riponilo nella basetta di ricarica. La soluzione è nuovamente pronta.' },
          ],
        },
        {
          title: 'Introduzione', duration: '1',
          description: 'Scopri i componenti del kit Lemons e come rendere la postazione operativa in pochi passi.',
          questions: [
            {
              question: 'Quali componenti sono inclusi nel kit Lemons?',
              answers: ['Solo il visore e il caricabatterie', 'Visore, teca, basetta di ricarica e controller', 'Visore, cavo USB-C e manuale', 'Visore, controller e cuffie audio'],
              correct: 1,
            },
            {
              question: 'Qual è la funzione della teca?',
              answers: ['Contenere i controller', 'Ricaricare il visore', 'Proteggere il visore e fungere da elemento espositivo', 'Collegare il caricabatterie alla rete'],
              correct: 2,
            },
            {
              question: 'Come si mantiene il visore sempre pronto all\'uso?',
              answers: ['Collegando il caricabatterie direttamente al visore ogni sera', 'Spegnendolo e riponendolo nella teca dopo ogni utilizzo', 'Tenendolo sempre in carica nella basetta di ricarica e rimettendolo al suo posto dopo ogni utilizzo', 'Caricandolo con il cavo USB-C incluso nel kit'],
              correct: 2,
            },
          ],
          slides: [
            { title: 'I Materiali del Kit', content: 'Il kit Lemons è composto da: visore, teca di esposizione e protezione, basetta di ricarica con il suo caricabatterie. Sono inclusi anche i controller del dispositivo.' },
            { title: 'La Teca', content: 'La teca ha una doppia funzione: proteggere il visore quando non è in uso e fungere da elemento espositivo della postazione. Mantienila sempre in una posizione accessibile e stabile.' },
            { title: 'La Ricarica', content: 'Il visore rimane sempre in carica all\'interno della basetta. Quando serve: tiralo su, dallo al paziente, igienizzallo e rimettilo al suo posto.' },
          ],
        },
        {
          title: 'Accensione & Stand-by', duration: '1',
          description: 'Come accendere il visore, avviare l\'esperienza e metterlo in stand-by in pochi secondi.',
          questions: [
            {
              question: 'Dove viene posizionata la teca all\'interno del reparto?',
              answers: ['In un armadio chiuso a chiave', 'In un punto strategico, ben visibile e comodo per gli operatori', 'Vicino all\'uscita di emergenza', 'Nella stanza del primario'],
              correct: 1,
            },
            {
              question: 'Come si accende il visore?',
              answers: ['Premendo rapidamente il pulsante una volta', 'Premendo contemporaneamente due pulsanti', 'Tenendo premuto il pulsante di accensione per qualche secondo', 'Agitando il visore finché non si avvia'],
              correct: 2,
            },
            {
              question: 'Cosa si deve fare una volta posizionato il visore sulla testa del paziente?',
              answers: ['Bisogna selezionare manualmente ogni volta l\'esperienza dal menu', 'Si deve aspettare che un operatore avvii l\'app da remoto', 'Il visore emette un suono e poi va avviato manualmente', 'Selezionare l\'esperienza desiderata'],
              correct: 3,
            },
            {
              question: 'Come si mette il visore in stand-by?',
              answers: ['Tenendo premuto il pulsante per 5 secondi', 'Spegnendolo completamente dal menu impostazioni', 'Aspettando che si spenga da solo dopo 10 minuti', 'Premendo una volta il pulsante di accensione o rimuovendolo e posizionandolo nuovamente sulla basetta di ricarica'],
              correct: 3,
            },
          ],
          slides: [
            { title: 'La Postazione', content: 'La teca deve essere posizionata in un punto strategico e ben visibile del reparto. Al suo interno si trovano il visore e la basetta di ricarica, già collegata al caricabatterie. La soluzione è sempre pronta all\'uso.' },
            { title: 'Accensione', content: 'Per accendere il visore, tieni premuto il pulsante di accensione per qualche secondo. Una volta indossato, selezionare l\'esperienza desiderata.' },
            { title: 'Stand-by e Riposizionamento', content: 'Al termine della sessione, premi una volta il pulsante di accensione per mettere il visore in stand-by. Sanificalo e riposizionalo nella teca: è già pronto per il prossimo utilizzo.' },
          ],
        },
        {
          title: 'Navigare tra le Applicazioni Lemons', duration: '1',
          description: 'Come navigare tra le applicazioni usando i controller.',
          questions: [
            {
              question: 'Quale tasto fa apparire e scomparire il menu?',
              answers: ['Il grilletto del controller sinistro', 'Il tasto Oculus sul controller destro', 'Il tasto A sul controller destro', 'Il tasto laterale del controller sinistro'],
              correct: 1,
            },
            {
              question: 'Come si seleziona un\'opzione nel menu?',
              answers: ['Puntando e aspettando 2 secondi', 'Premendo il tasto Oculus', 'Puntando sull\'opzione e premendo il "grilletto"', 'Usando la voce'],
              correct: 2,
            },
            {
              question: 'Cosa succede se premi il tasto Oculus mentre sei dentro un\'applicazione?',
              answers: ['L\'applicazione si riavvia', 'Il visore si mette in stand-by', 'Si torna automaticamente al menu principale senza possibilità di tornare sull\'app', 'Si apre il menu, da cui puoi chiudere l\'app o riprendere l\'esperienza'],
              correct: 3,
            },
          ],
          slides: [
            { title: 'Il Tasto Oculus', content: 'Il tasto Oculus (∞) sul controller destro è il tuo punto di controllo: premendolo una volta il menu appare, premendolo di nuovo scompare. Puoi usarlo in qualsiasi momento, anche mentre sei all\'interno di un\'applicazione.' },
            { title: 'Selezionare con il Grilletto', content: 'Per selezionare un\'opzione nel menu, punta il cursore sull\'elemento desiderato e premi il "grilletto": il tasto frontale del controller, destro o sinistro non è importante.' },
            { title: 'Cambiare Applicazione', content: 'Se sei già all\'interno di un\'app e vuoi cambiarla: premi il tasto Oculus per aprire il menu, chiudi l\'applicazione corrente e scegli quella nuova. Il menu è sempre accessibile, in qualsiasi momento della sessione.' },
          ],
        },
      ],
    },

    // Lesson
    lesson: {
      mandatoryView: 'Visione Obbligatoria',
      additionalResources: 'Risorse Addizionali',
      teachingMaterial: 'Materiale Didattico',
      interactiveCheck: 'Verifica Interattiva',
      technicalNote: 'Nota Tecnica:',
      technicalNoteText: 'La visione integrale del video è necessaria per sbloccare la verifica finale.',
      certify: 'Certifica Completamento',
      waitingCompletion: 'In Attesa Completamento',
      slideOf: 'di',
      slide: 'Slide',
      prev: 'Indietro',
      next: 'Avanti',
      wrongAnswer: 'Risposta errata, riprova!',
      verifyLabel: 'Verifica',
      unlockHint: 'Completa il video per sbloccare',
      slideLabel: 'Slide',
      slidesCount: (n) => `${n} slide di approfondimento`,
      quizPassed: 'Completata con successo',
      quizPassedHint: 'Hai risposto correttamente a tutte le domande',
      questionOf: (current, total) => `Domanda ${current} di ${total}`,
    },

    // Support
    support: {
      badge: 'Support Center',
      titleMain: 'Supporto',
      titleAccent: 'Operativo',
      chapterSupport: 'Supporto',
      tagLabels: { Generale: 'Generale', Sicurezza: 'Sicurezza', Hardware: 'Hardware', Software: 'Software' },
      subtitle: 'Assistenza immediata e risoluzione problemi per il personale sanitario.',
      faqTitle: 'Domande frequenti',
      directTitle: 'Assistenza diretta',
      techSupport: 'Supporto tecnico',
      techDesc: 'Problemi hardware e di sistema.',
      opSupport: 'Assistenza operativa',
      opDesc: "Dubbi sull'utilizzo e informazioni generali.",
      ticketTitle: 'Ticket immediato',
      ticketDesc: 'Invia una segnalazione per ricevere assistenza tecnica o operativa prioritaria.',
      ticketSla: 'Leggiamo ogni ticket il prima possibile e lo risolviamo entro 72 ore. Per le urgenze chiama direttamente il numero qui sotto.',
      ticketType: 'Tipo assistenza',
      ticketSubject: 'Oggetto richiesta',
      ticketDetails: 'Dettagli tecnici',
      optionTech: 'Guasto hardware o sistema',
      optionOp: 'Aiuto app o formazione',
      placeholderSubject: 'Es. Visore bloccato...',
      placeholderDetails: 'Descrivi cosa sta succedendo...',
      submitBtn: 'Invia segnalazione',
      submitting: 'Invio...',
      sentTitle: 'Ticket inviato!',
      sentDesc: 'Il team ti assisterà a breve.',
      callNow: 'Chiama ora',
      gdprNote: 'Le tue informazioni viaggiano cifrate · GDPR compliant',
      errorSend: "Errore durante l'invio del ticket. Riprova più tardi.",
      errorConnection: 'Errore di connessione. Verifica di essere connesso a internet.',
      faqs: [
        { tag: 'Generale',  q: 'Quanto tempo serve per completare il programma di formazione?', a: "Il personale sanitario può completare l'intero percorso formativo in circa 15 minuti. È possibile comunque eseguire il percorso in momenti diversi senza perdere i progressi precedentemente raggiunti." },
        { tag: 'Sicurezza', q: "L'utilizzo del visore è sicuro?", a: "Sì, l'ecosistema Lemons in the room è progettato per essere utilizzato in totale sicurezza dai pazienti. Si consiglia di seguire sempre le linee guida cliniche del proprio reparto." },
        { tag: 'Hardware',  q: 'La luce della base di ricarica lampeggia', a: "Se la luce della basetta di ricarica lampeggia, verificare che il visore sia posizionato correttamente sui pin magnetici. Nel caso in cui il posizionamento sia corretto e la luce continui a lampeggiare, assicurarsi che la spia di carica laterale sul visore sia accesa. Quando lo è, il visore sta caricando correttamente, nonostante la base di ricarica continui a lampeggiare." },
        { tag: 'Hardware',  q: 'Il visore non si ricarica', a: "Verificare che il visore sia posizionato correttamente sui pin magnetici, controllare che i contatti metallici presenti sul visore e sulla base di ricarica siano puliti e assicurarsi che l'alimentatore sia inserita in una presa di corrente funzionante. Laddove il problema dovesse persistere, provare a ricaricare direttamente il visore con un cavo USB-C (può essere usato lo stesso cavo della base di ricarica) e nel caso in cui la spia di carica laterale sul visore non si accenda contattare l'assistenza clienti." },
        { tag: 'Software',  q: 'Vedo lo scenario dell\'esperienza spostato', a: "Premi due volte il tasto di accensione/spegnimento del visore per ricentrare la visuale. Attenzione: in questo modo l'applicazione potrebbe ripartire dall'inizio." },
        { tag: 'Software',  q: 'Sento il suono ma non vedo niente', a: "Il sensore di prossimità (collocato tra le due lenti) potrebbe non rilevare il soggetto. Assicurarsi che il visore sia indossato correttamente e che non ci siano ostacoli davanti al sensore interno tra le due lenti (esempio: capelli). Nel caso in cui il problema dovesse persistere si consiglia di controllare la carica del visore e/o provare a spegnere e riaccendere il dispositivo." },
      ],
    },
  };
