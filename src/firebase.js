import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child, remove, onValue, off, onDisconnect, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAVKA3s_p47oQpptYlfS8cJKoF71DJvDZo",
    authDomain: "techvideo.firebaseapp.com",
    databaseURL: "https://techvideo-default-rtdb.firebaseio.com/",
    projectId: "techvideo",
    storageBucket: "techvideo.firebasestorage.app",
    messagingSenderId: "387777802194",
    appId: "1:387777802194:web:f23abe314773c36478e20b",
    measurementId: "G-345Z0304FZ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, child, remove, onValue, off, onDisconnect, push };
