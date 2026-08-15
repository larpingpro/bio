// 1. Entrance Logic
function enterSite() {
    const splash = document.getElementById('splash');
    const mainContent = document.getElementById('main-content');
    const video = document.getElementById('bg-video');

    gsap.to(splash, {
        opacity: 0,
        duration: 1,
        onComplete: () => splash.style.display = 'none'
    });

    mainContent.classList.remove('hidden');
    gsap.to(mainContent, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.3
    });

    if (video) {
        video.muted = false;
        video.volume = 0.5;
        video.play();
        video.addEventListener('timeupdate', updateMediaUI);
    }
    startTypewriter();
}

// 2. Media Sync
function updateMediaUI() {
    const video = document.getElementById('bg-video');
    const fill = document.getElementById('progress-fill');
    const cur = document.getElementById('current-time');
    const dur = document.getElementById('duration-total');

    if (!video || !fill) return;

    const percent = (video.currentTime / video.duration) * 100;
    fill.style.width = `${percent}%`;

    cur.textContent = formatTime(video.currentTime);
    dur.textContent = formatTime(video.duration);
}

function formatTime(s) {
    if (isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

// 3. Play/Pause
const playBtn = document.getElementById('play-pause');
if (playBtn) {
    playBtn.addEventListener('click', () => {
        const vid = document.getElementById('bg-video');
        if (vid.paused) {
            vid.play();
            playBtn.className = 'fas fa-pause';
        } else {
            vid.pause();
            playBtn.className = 'fas fa-play';
        }
    });
}

// 4. Above-Icon Pop-up
document.querySelectorAll('.icon-link').forEach(link => {
    link.addEventListener('click', function() {
        const val = this.getAttribute('data-value');
        navigator.clipboard.writeText(val);

        const toast = document.getElementById('toast');
        this.appendChild(toast); // Move toast inside current link
        
        toast.textContent = `Copied ${val}`;
        toast.style.display = 'block';

        gsap.fromTo(toast, 
            { opacity: 0, y: 10 }, 
            { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.7)" }
        );

        setTimeout(() => {
            gsap.to(toast, {
                opacity: 0,
                y: 5,
                duration: 0.3,
                onComplete: () => { toast.style.display = 'none'; }
            });
        }, 2000);
    });
});

// 5. Typewriter & Tilt
const phrases = ["owns you", "le", "incredibly rich"];
let pIdx = 0, cIdx = 0, isDel = false;

function startTypewriter() {
    const el = document.getElementById("typewriter-text");
    if (!el) return;
    const txt = phrases[pIdx];
    el.textContent = isDel ? txt.substring(0, cIdx--) : txt.substring(0, cIdx++);

    let d = isDel ? 80 : 150;
    if (!isDel && cIdx > txt.length) { isDel = true; d = 2000; }
    else if (isDel && cIdx < 0) { isDel = false; pIdx = (pIdx + 1) % phrases.length; cIdx = 0; }
    setTimeout(startTypewriter, d);
}

document.addEventListener('mousemove', (e) => {
    const box = document.getElementById('tilt-box');
    if (!box) return;
    const x = (window.innerWidth / 2 - e.pageX) / 30;
    const y = (window.innerHeight / 2 - e.pageY) / 30;
    box.style.transform = `rotateX(${y}deg) rotateY(${-x}deg)`;
});