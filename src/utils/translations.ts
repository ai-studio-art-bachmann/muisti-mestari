
export interface Translations {
  // Header texts
  headerTitle: string;
  headerSubtitle: string;
  
  // Voice button states
  startConversation: string;
  greetingInProgress: string;
  listening: string;
  sending: string;
  waitingResponse: string;
  playingResponse: string;
  readyForClick: string;
  
  // Chat messages
  startRecording: string;
  stopRecording: string;
  sendingToServer: string;
  processingResponse: string;
  playingAudio: string;
  readyForNext: string;
  startConversationPrompt: string;
  greetingPlayed: string;
  readyToListen: string;
  listeningClickWhenReady: string;
  processingAudio: string;
  
  // Buttons and controls
  resetConversation: string;
  
  // Empty state
  pressToStart: string;
  
  // Footer
  footerText: string;
  
  // Error messages
  voiceError: string;
  tryAgain: string;
  unknownError: string;
  recordingFailed: string;
  noAudioDetected: string;

  // Tab navigation
  audioTab: string;
  filesTab: string;
  cameraTab: string;

  // Camera component
  startCamera: string;
  takePhoto: string;
  retakePhoto: string;
  sendPhoto: string;
  capturedPhoto: string;
  cameraPlaceholder: string;
  cameraError: string;
  cameraPermissionDenied: string;
  photoSent: string;
  photoSentSuccess: string;

  // File upload component
  selectFile: string;
  sendFile: string;
  cancel: string;
  dragDropFiles: string;
  orClickToUpload: string;
  selectedFile: string;
  fileSent: string;
  fileSentSuccess: string;
  
  // Thought management
  addThought: string;
  searchThoughts: string;
  thoughtTitle: string;
  thoughtContent: string;
  thoughtTags: string;
  saveThought: string;
  deleteThought: string;
  noThoughts: string;
  noMatchingThoughts: string;
  addNewThought: string;
  thoughtDescription: string;
  searchDescription: string;
  tagsLabel: string;
  titlePlaceholder: string;
  contentPlaceholder: string;
  tagsPlaceholder: string;
  searchPlaceholder: string;
}

export const translations: Record<'fi' | 'et' | 'en', Translations> = {
  fi: {
    headerTitle: 'MuistiMestari',
    headerSubtitle: 'Tallentaa ajatuksesi, auttaa analysoimaan ja muistamaan',
    startConversation: 'Aloita keskustelu',
    greetingInProgress: 'Tervehdys käynnissä...',
    listening: 'Kuuntelen...',
    sending: 'Lähetän...',
    waitingResponse: 'Odotan vastausta...',
    playingResponse: 'Toistan vastausta...',
    readyForClick: 'Kliki kun olet valmis!',
    startRecording: 'Alusta puhuminen...',
    stopRecording: 'Pysäytän nauhoituksen...',
    sendingToServer: 'Lähetän palvelimelle...',
    processingResponse: 'Käsittelen vastausta...',
    playingAudio: 'Toistan äänivastauksen...',
    readyForNext: 'Valmis seuraavaan kysymykseen!',
    startConversationPrompt: 'Aloitan keskustelun...',
    greetingPlayed: 'Tervehdys toistettu!',
    readyToListen: 'Valmis kuuntelemaan!',
    listeningClickWhenReady: 'Kuuntelen... Kliki uuesti kun olet valmis!',
    processingAudio: 'Ääniviestin sisältö käsitellään...',
    resetConversation: 'Aloita alusta',
    pressToStart: 'Paina mikrofonia aloittaaksesi keskustelun',
    footerText: '© AI Studio Art Bachmann',
    voiceError: 'Virhe äänikäskyssä',
    tryAgain: 'Yritä uudelleen',
    unknownError: 'Tuntematon virhe',
    recordingFailed: 'Äänitallennus epäonnistui - ei ääntä havaittu',
    noAudioDetected: 'Ei ääntä havaittu',
    
    // Tab navigation
    audioTab: 'Ääni',
    filesTab: 'Tiedostot',
    cameraTab: 'Kamera',
    
    // Camera component
    startCamera: 'Käynnistä kamera',
    takePhoto: 'Ota kuva',
    retakePhoto: 'Ota uusi kuva',
    sendPhoto: 'Lähetä kuva',
    capturedPhoto: 'Otettu kuva',
    cameraPlaceholder: 'Paina käynnistääksesi kameran',
    cameraError: 'Kameravirhe',
    cameraPermissionDenied: 'Kameran käyttöoikeus evätty',
    photoSent: 'Kuva lähetetty',
    photoSentSuccess: 'Kuva lähetetty onnistuneesti',
    
    // File upload component
    selectFile: 'Valitse tiedosto',
    sendFile: 'Lähetä tiedosto',
    cancel: 'Peruuta',
    dragDropFiles: 'Vedä ja pudota tiedostot tähän',
    orClickToUpload: 'tai klikkaa valitaksesi',
    selectedFile: 'Valittu tiedosto',
    fileSent: 'Tiedosto lähetetty',
    fileSentSuccess: 'Tiedosto lähetetty onnistuneesti',
    
    // Thought management
    addThought: 'Lisää ajatus',
    searchThoughts: 'Etsi ajatuksia',
    thoughtTitle: 'Otsikko',
    thoughtContent: 'Sisältö',
    thoughtTags: 'Tagit',
    saveThought: 'Tallenna ajatus',
    deleteThought: 'Poista',
    noThoughts: 'Ei tallennettuja ajatuksia',
    noMatchingThoughts: 'Ei vastaavia ajatuksia',
    addNewThought: 'Lisää uusi ajatus',
    thoughtDescription: 'Tallenna ideoitasi, muistiinpanojasi tai mitä tahansa haluat muistaa',
    searchDescription: 'Etsi tallennettuja ajatuksiasi otsikon, sisällön tai tagien perusteella',
    tagsLabel: 'Tagit (pilkulla erotettuna)',
    titlePlaceholder: 'Anna ajatuksellesi otsikko',
    contentPlaceholder: 'Kirjoita ajatuksesi tähän...',
    tagsPlaceholder: 'työ, idea, tehtävä',
    searchPlaceholder: 'Etsi ajatuksia...'
  },
  et: {
    headerTitle: 'MuistiMestari',
    headerSubtitle: 'Salvestab sinu mõtteid, aitab analüüsida ja mäletada',
    startConversation: 'Alusta vestlust',
    greetingInProgress: 'Tervitus käib...',
    listening: 'Kuulan...',
    sending: 'Saadan...',
    waitingResponse: 'Ootan vastust...',
    playingResponse: 'Mängin vastust...',
    readyForClick: 'Kliki kui oled valmis!',
    startRecording: 'Alusta rääkimist...',
    stopRecording: 'Peatan salvestamise...',
    sendingToServer: 'Saadan serverisse...',
    processingResponse: 'Töötlen vastust...',
    playingAudio: 'Mängin helivastust...',
    readyForNext: 'Valmis järgmiseks küsimuseks!',
    startConversationPrompt: 'Alustan vestlust...',
    greetingPlayed: 'Tervitus mängitud!',
    readyToListen: 'Valmis kuulama!',
    listeningClickWhenReady: 'Kuulan... Kliki uuesti kui oled valmis!',
    processingAudio: 'Helistsõnumi sisu töödeldakse...',
    resetConversation: 'Alusta otsast',
    pressToStart: 'Vajuta mikrofoni vestluse alustamiseks',
    footerText: '© AI Studio Art Bachmann',
    voiceError: 'Viga häälkäskluses',
    tryAgain: 'Proovi uuesti',
    unknownError: 'Tundmatu viga',
    recordingFailed: 'Helisalvestus ebaõnnestus - heli ei tuvastatud',
    noAudioDetected: 'Heli ei tuvastatud',
    
    // Tab navigation
    audioTab: 'Hääl',
    filesTab: 'Tiedostot',
    cameraTab: 'Kaamera',
    
    // Camera component
    startCamera: 'Käivita kaamera',
    takePhoto: 'Tee pilt',
    retakePhoto: 'Tee uus pilt',
    sendPhoto: 'Saada pilt',
    capturedPhoto: 'Tehtud pilt',
    cameraPlaceholder: 'Vajuta kaamera käivitamiseks',
    cameraError: 'Kaamera viga',
    cameraPermissionDenied: 'Kaamera kasutamise õigus keelatud',
    photoSent: 'Pilt saadetud',
    photoSentSuccess: 'Pilt edukalt saadetud',
    
    // File upload component
    selectFile: 'Vali fail',
    sendFile: 'Saada fail',
    cancel: 'Tühista',
    dragDropFiles: 'Lohista ja kukuta failid siia',
    orClickToUpload: 'või klõpsa valimiseks',
    selectedFile: 'Valitud fail',
    fileSent: 'Fail saadetud',
    fileSentSuccess: 'Fail edukalt saadetud',
    
    // Thought management
    addThought: 'Lisa mõte',
    searchThoughts: 'Otsi mõtteid',
    thoughtTitle: 'Pealkiri',
    thoughtContent: 'Sisu',
    thoughtTags: 'Sildid',
    saveThought: 'Salvesta mõte',
    deleteThought: 'Kustuta',
    noThoughts: 'Salvestatud mõtteid pole',
    noMatchingThoughts: 'Vastavaid mõtteid ei leitud',
    addNewThought: 'Lisa uus mõte',
    thoughtDescription: 'Salvesta oma ideid, märkmeid või mida iganes soovid meeles pidada',
    searchDescription: 'Otsi oma salvestatud mõtteid pealkirja, sisu või siltide järgi',
    tagsLabel: 'Sildid (komadega eraldatud)',
    titlePlaceholder: 'Anna oma mõttele pealkiri',
    contentPlaceholder: 'Kirjuta oma mõte siia...',
    tagsPlaceholder: 'töö, idee, ülesanne',
    searchPlaceholder: 'Otsi mõtteid...'
  },
  en: {
    headerTitle: 'MuistiMestari',
    headerSubtitle: 'Saves your thoughts, helps analyze and remember',
    startConversation: 'Start conversation',
    greetingInProgress: 'Greeting in progress...',
    listening: 'Listening...',
    sending: 'Sending...',
    waitingResponse: 'Waiting for response...',
    playingResponse: 'Playing response...',
    readyForClick: 'Click when ready!',
    startRecording: 'Start speaking...',
    stopRecording: 'Stopping recording...',
    sendingToServer: 'Sending to server...',
    processingResponse: 'Processing response...',
    playingAudio: 'Playing audio response...',
    readyForNext: 'Ready for next question!',
    startConversationPrompt: 'Starting conversation...',
    greetingPlayed: 'Greeting played!',
    readyToListen: 'Ready to listen!',
    listeningClickWhenReady: 'Listening... Click again when ready!',
    processingAudio: 'Audio message content being processed...',
    resetConversation: 'Start over',
    pressToStart: 'Press microphone to start conversation',
    footerText: '© AI Studio Art Bachmann',
    voiceError: 'Voice command error',
    tryAgain: 'Try again',
    unknownError: 'Unknown error',
    recordingFailed: 'Audio recording failed - no audio detected',
    noAudioDetected: 'No audio detected',
    
    // Tab navigation
    audioTab: 'Audio',
    filesTab: 'Files',
    cameraTab: 'Camera',
    
    // Camera component
    startCamera: 'Start camera',
    takePhoto: 'Take photo',
    retakePhoto: 'Retake photo',
    sendPhoto: 'Send photo',
    capturedPhoto: 'Captured photo',
    cameraPlaceholder: 'Press to start camera',
    cameraError: 'Camera error',
    cameraPermissionDenied: 'Camera permission denied',
    photoSent: 'Photo sent',
    photoSentSuccess: 'Photo sent successfully',
    
    // File upload component
    selectFile: 'Select file',
    sendFile: 'Send file',
    cancel: 'Cancel',
    dragDropFiles: 'Drag and drop files here',
    orClickToUpload: 'or click to upload',
    selectedFile: 'Selected file',
    fileSent: 'File sent',
    fileSentSuccess: 'File successfully sent',
    
    // Thought management
    addThought: 'Add Thought',
    searchThoughts: 'Search Thoughts',
    thoughtTitle: 'Title',
    thoughtContent: 'Content',
    thoughtTags: 'Tags',
    saveThought: 'Save Thought',
    deleteThought: 'Delete',
    noThoughts: 'No thoughts saved yet',
    noMatchingThoughts: 'No matching thoughts found',
    addNewThought: 'Add New Thought',
    thoughtDescription: 'Record your ideas, notes, or anything you want to remember',
    searchDescription: 'Find your saved thoughts by title, content, or tags',
    tagsLabel: 'Tags (comma separated)',
    titlePlaceholder: 'Give your thought a title',
    contentPlaceholder: 'Write your thought here...',
    tagsPlaceholder: 'work, idea, todo',
    searchPlaceholder: 'Search thoughts...'
  }
};

export const getTranslations = (language: 'fi' | 'et' | 'en'): Translations => {
  return translations[language];
};
