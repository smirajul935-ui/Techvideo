import { UI } from './ui.js';
import { WebRTC } from './webrtc.js';
import { db, ref, set, get, remove, onValue, off, onDisconnect } from './firebase.js';

let myUserId = Math.random().toString(36).substring(2, 10);
let currentMode = null; // 'random' or 'private'

// Random Chat Logic
UI.btnRandom.addEventListener('click', async () => {
    const streamReady = await WebRTC.initLocalStream(UI.localVideo);
    if (!streamReady) return;
    
    currentMode = 'random';
    UI.showVideoPanel(true);
    UI.setStatus("Searching for a stranger...");

    WebRTC.setupPeerConnection(UI.remoteVideo);

    const waitingRef = ref(db, 'waitingUsers');
    const snapshot = await get(waitingRef);

    let matchFound = false;
    if (snapshot.exists()) {
        const users = snapshot.val();
        const userIds = Object.keys(users);
        if (userIds.length > 0) {
            const partnerId = userIds[0];
            await remove(ref(db, `waitingUsers/${partnerId}`)); // Remove from queue
            
            UI.setStatus("Connected!");
            await WebRTC.joinOffer(partnerId); // partnerId is the room name
            matchFound = true;
        }
    }

    if (!matchFound) {
        // No one waiting, create room and wait
        await set(ref(db, `waitingUsers/${myUserId}`), { timestamp: Date.now() });
        const myWaitRef = ref(db, `waitingUsers/${myUserId}`);
        onDisconnect(myWaitRef).remove();

        await WebRTC.createOffer(myUserId); // myUserId is the room name

        // Listen if someone deleted us from queue (means they joined)
        onValue(myWaitRef, (snap) => {
            if (!snap.exists()) {
                UI.setStatus("Connected!");
                off(myWaitRef);
            }
        });
    }
});

// Private Chat Logic - Create Room
UI.btnCreateRoom.addEventListener('click', async () => {
    const streamReady = await WebRTC.initLocalStream(UI.localVideo);
    if (!streamReady) return;

    currentMode = 'private';
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    UI.codeSpan.innerText = code;
    UI.showVideoPanel(false);
    UI.setStatus("Waiting for someone to join...");

    await set(ref(db, `privateRooms/${code}`), { host: myUserId });
    onDisconnect(ref(db, `privateRooms/${code}`)).remove();

    WebRTC.setupPeerConnection(UI.remoteVideo);
    await WebRTC.createOffer(`priv_${code}`);
    
    // Check connection state
    WebRTC.pc.onconnectionstatechange = () => {
        if(WebRTC.pc.connectionState === 'connected') UI.setStatus("Connected!");
    };
});

// Private Chat Logic - Join Room
UI.btnJoinRoom.addEventListener('click', async () => {
    const code = UI.roomCodeInput.value.trim().toUpperCase();
    if (code.length < 6) return alert("Enter a valid 6-character code!");

    const roomSnap = await get(ref(db, `privateRooms/${code}`));
    if (!roomSnap.exists()) return alert("Room not found!");

    const streamReady = await WebRTC.initLocalStream(UI.localVideo);
    if (!streamReady) return;

    currentMode = 'private';
    UI.codeSpan.innerText = code;
    UI.showVideoPanel(false);
    UI.setStatus("Connecting...");

    WebRTC.setupPeerConnection(UI.remoteVideo);
    const joined = await WebRTC.joinOffer(`priv_${code}`);
    if(joined) UI.setStatus("Connected!");
});

// Controls
UI.btnToggleAudio.addEventListener('click', () => WebRTC.toggleAudio(UI.btnToggleAudio));
UI.btnToggleVideo.addEventListener('click', () => WebRTC.toggleVideo(UI.btnToggleVideo));

UI.btnEndCall.addEventListener('click', () => {
    endCurrentCall();
    UI.showLandingPanel();
    UI.setStatus("Ready to connect");
});

UI.btnNext.addEventListener('click', async () => {
    endCurrentCall();
    UI.btnRandom.click(); // Auto restart random chat
});

function endCurrentCall() {
    WebRTC.hangup();
    if(WebRTC.localStream) {
        WebRTC.localStream.getTracks().forEach(track => track.stop());
    }
    remove(ref(db, `waitingUsers/${myUserId}`));
}
