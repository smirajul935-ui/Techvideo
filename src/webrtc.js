import { db, ref, set, get, child, remove, onValue, off, onDisconnect } from './firebase.js';

const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
};

export let pc;
export let localStream;
export let remoteStream;
let roomId = null;
let role = null; // 'caller' or 'callee'

export const WebRTC = {
    async initLocalStream(localVideoElement) {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideoElement.srcObject = localStream;
            return true;
        } catch (error) {
            alert("Camera/Microphone permission denied!");
            return false;
        }
    },

    setupPeerConnection(remoteVideoElement) {
        pc = new RTCPeerConnection(servers);
        remoteStream = new MediaStream();
        remoteVideoElement.srcObject = remoteStream;

        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
        };

        pc.oniceconnectionstatechange = () => {
            if(pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                this.hangup();
            }
        };
    },

    async createOffer(roomStr) {
        roomId = roomStr;
        role = 'caller';
        const roomRef = ref(db, `rooms/${roomId}`);
        
        onDisconnect(roomRef).remove();

        pc.onicecandidate = (event) => {
            if(event.candidate) {
                const id = Math.random().toString(36).substring(2, 9);
                set(ref(db, `rooms/${roomId}/callerCandidates/${id}`), event.candidate.toJSON());
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await set(child(roomRef, 'offer'), {
            type: offer.type,
            sdp: offer.sdp
        });

        onValue(child(roomRef, 'answer'), (snapshot) => {
            if (snapshot.exists() && !pc.currentRemoteDescription) {
                const answer = new RTCSessionDescription(snapshot.val());
                pc.setRemoteDescription(answer);
            }
        });

        onValue(child(roomRef, 'calleeCandidates'), (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const candidate = new RTCIceCandidate(childSnapshot.val());
                pc.addIceCandidate(candidate);
            });
        });
    },

    async joinOffer(roomStr) {
        roomId = roomStr;
        role = 'callee';
        const roomRef = ref(db, `rooms/${roomId}`);

        pc.onicecandidate = (event) => {
            if(event.candidate) {
                const id = Math.random().toString(36).substring(2, 9);
                set(ref(db, `rooms/${roomId}/calleeCandidates/${id}`), event.candidate.toJSON());
            }
        };

        const offerSnapshot = await get(child(roomRef, 'offer'));
        if (!offerSnapshot.exists()) return false;

        const offer = offerSnapshot.val();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await set(child(roomRef, 'answer'), {
            type: answer.type,
            sdp: answer.sdp
        });

        onValue(child(roomRef, 'callerCandidates'), (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const candidate = new RTCIceCandidate(childSnapshot.val());
                pc.addIceCandidate(candidate);
            });
        });

        return true;
    },

    hangup() {
        if (pc) {
            pc.close();
            pc = null;
        }
        if (roomId) {
            off(ref(db, `rooms/${roomId}`));
            remove(ref(db, `rooms/${roomId}`));
            roomId = null;
        }
    },

    toggleAudio(btn) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            btn.innerHTML = audioTrack.enabled ? '<i class="fas fa-microphone"></i>' : '<i class="fas fa-microphone-slash text-red-500"></i>';
        }
    },

    toggleVideo(btn) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            btn.innerHTML = videoTrack.enabled ? '<i class="fas fa-video"></i>' : '<i class="fas fa-video-slash text-red-500"></i>';
        }
    }
};
