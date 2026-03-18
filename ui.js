export const UI = {
    landingPanel: document.getElementById('landingPanel'),
    videoPanel: document.getElementById('videoPanel'),
    btnRandom: document.getElementById('btnRandom'),
    btnCreateRoom: document.getElementById('btnCreateRoom'),
    btnJoinRoom: document.getElementById('btnJoinRoom'),
    roomCodeInput: document.getElementById('roomCodeInput'),
    localVideo: document.getElementById('localVideo'),
    remoteVideo: document.getElementById('remoteVideo'),
    btnToggleAudio: document.getElementById('btnToggleAudio'),
    btnToggleVideo: document.getElementById('btnToggleVideo'),
    btnNext: document.getElementById('btnNext'),
    btnEndCall: document.getElementById('btnEndCall'),
    statusText: document.getElementById('statusText'),
    roomCodeDisplay: document.getElementById('roomCodeDisplay'),
    codeSpan: document.getElementById('codeSpan'),

    showVideoPanel(isRandom = false) {
        this.landingPanel.classList.add('hidden');
        this.videoPanel.classList.remove('hidden');
        if(isRandom) {
            this.btnNext.classList.remove('hidden');
            this.roomCodeDisplay.classList.add('hidden');
        } else {
            this.btnNext.classList.add('hidden');
            this.roomCodeDisplay.classList.remove('hidden');
        }
    },

    showLandingPanel() {
        this.videoPanel.classList.add('hidden');
        this.landingPanel.classList.remove('hidden');
        this.remoteVideo.srcObject = null;
    },

    setStatus(text) {
        this.statusText.innerText = text;
    }
};
