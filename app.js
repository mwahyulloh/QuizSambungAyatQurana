const state = {
  screen: "home",
  selectedSurah: null,
  isRandomMode: false,
  randomScope: null,
  questionTasks: [],
  questionIndex: 0,
  score: 0,
  correctCount: 0,
  answered: false,
  correctOptionId: null,
  timerInterval: null,
  timeLeft: 15,
  lives: 3,             // Nyawa awal
  playerName: "",       // Nama pemain
  pendingQuizStart: null// Menyimpan fungsi sementara menunggu input nama
};

const screens = {
  home: document.getElementById("home-screen"),
  classSelect: document.getElementById("class-screen"),
  surahSelect: document.getElementById("surah-screen"),
  quiz: document.getElementById("quiz-screen"),
  result: document.getElementById("result-screen"),
  nameSelect: document.getElementById("name-screen"),
  leaderboard: document.getElementById("leaderboard-screen")
};

const letters = ["A", "B", "C", "D"];

// Setup Awal
document.getElementById("start-button").addEventListener("click", () => showScreen("classSelect"));

function showScreen(name) {
  state.screen = name;
  Object.entries(screens).forEach(([key, element]) => {
    if(element) element.classList.toggle("active", key === name);
  });
  if(name !== "quiz") clearInterval(state.timerInterval);
}

function openJilid(jilidName) {
  const grid = document.getElementById("dynamic-surah-grid");
  const title = document.getElementById("surah-screen-title");
  grid.innerHTML = "";
  title.textContent = "Pilih Surat (" + jilidName + ")";

  if (classCatalog[jilidName]) {
    // 1. TAMBAHKAN TOMBOL MODE ACAK KHUSUS JILID INI (Warna Emas)
    const randomBtn = document.createElement("button");
    randomBtn.className = "surah-card";
    randomBtn.style.background = "linear-gradient(135deg, rgb(255, 250, 240), rgb(244, 234, 208))";
    randomBtn.style.borderColor = "#d8af61";
    randomBtn.style.gridColumn = "1 / -1"; // Agar tombol memenuhi lebar penuh
    randomBtn.innerHTML = `
      <strong style="color: var(--forest); font-size: 20px;">MODE ACAK ${jilidName}</strong>
      <span class="card-meta" style="color: rgb(125, 92, 31);">10 Soal acak campuran dari ${jilidName}</span>
    `;
    randomBtn.onclick = () => prepareJilidRandomMode(jilidName);
    grid.appendChild(randomBtn);

    // 2. TAMPILKAN DAFTAR SURAT SEPERTI BIASA DI BAWAHNYA
    classCatalog[jilidName].forEach(surahKey => {
      const sData = surahsData[surahKey];
      const btn = document.createElement("button");
      btn.className = "surah-card";
      btn.innerHTML = `
        <strong style="color: var(--forest); font-size: 20px;">${surahKey}</strong>
        <span class="surah-arabic">${sData.arabic}</span>
      `;
      btn.onclick = () => prepareQuiz(surahKey);
      grid.appendChild(btn);
    });
  }
  showScreen("surahSelect");
}

function fisherYates(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function startQuiz(surahName) {
  state.isRandomMode = false;
  state.selectedSurah = surahName;
  const surahNumber = surahsData[surahName].number;
  
  document.getElementById("loading-overlay").classList.add("show");

  try {
    const response = await fetch(`https://equran.id/api/v2/surat/${surahNumber}`);
    const data = await response.json();

    const ayatList = data.data.ayat.map(a => ({
      surah: surahName,
      no: a.nomorAyat,
      text: a.teksArab,
      trans: a.teksIndonesia
    }));

    // Bentuk ulang struktur task agar seragam
    state.questionTasks = [];
    for(let i = 0; i < ayatList.length - 1; i++){
      state.questionTasks.push({
        surahName: surahName,
        currentAyah: ayatList[i],
        correctAyah: ayatList[i+1],
        distractorsPool: ayatList
      });
    }
    
    state.questionIndex = 0;
    state.score = 0;
    state.correctCount = 0;
    
    document.getElementById("loading-overlay").classList.remove("show");
    state.lives = 3; 
    renderLives();
    showScreen("quiz");
    renderQuestion();

  } catch (error) {
    document.getElementById("loading-overlay").classList.remove("show");
    alert("Gagal memuat data ayat. Pastikan perangkat terhubung internet.");
  }
}

// FUNGSI BARU: MODE ACAK
async function startRandomMode() {
  state.isRandomMode = true;
  state.randomScope = "GLOBAL";
  state.selectedSurah = "MODE ACAK";
  
  document.getElementById("loading-overlay").classList.add("show");

  try {
    // Ambil 5 surat secara acak dari semua katalog
    const allSurahKeys = Object.keys(surahsData);
    const shuffledKeys = fisherYates(allSurahKeys).slice(0, 5);
    
    // Ambil data API secara paralel agar lebih cepat
    const fetchPromises = shuffledKeys.map(key => {
      const sNum = surahsData[key].number;
      return fetch(`https://equran.id/api/v2/surat/${sNum}`).then(res => res.json());
    });
    const results = await Promise.all(fetchPromises);
    
    let allTasks = [];
    
    // Gabungkan soal dari kelima surat
    results.forEach((data, index) => {
      const sName = shuffledKeys[index];
      const ayatList = data.data.ayat.map(a => ({
        no: a.nomorAyat, text: a.teksArab, trans: a.teksIndonesia
      }));
      for(let i = 0; i < ayatList.length - 1; i++) {
        allTasks.push({
          surahName: sName,
          currentAyah: ayatList[i],
          correctAyah: ayatList[i+1],
          distractorsPool: ayatList // pengecoh tetap dari surat yang sama agar masuk akal
        });
      }
    });
    
    // Acak seluruh soal dan ambil 10 saja untuk 1 sesi main
    state.questionTasks = fisherYates(allTasks).slice(0, 10);
    state.questionIndex = 0;
    state.score = 0;
    state.correctCount = 0;
    
    document.getElementById("loading-overlay").classList.remove("show");
    state.lives = 3; 
    renderLives();
    showScreen("quiz");
    renderQuestion();
    
  } catch (error) {
    document.getElementById("loading-overlay").classList.remove("show");
    alert("Gagal memuat mode acak. Cek koneksi internet Anda.");
  }
}

function replayQuiz() {
  if (state.isRandomMode) {
    // Cek apakah pemain tadi main Acak Global atau Acak Per Jilid
    if (state.randomScope === "GLOBAL") {
      startRandomMode();
    } else {
      startJilidRandomMode(state.randomScope);
    }
  } else {
    // Mode satu surat biasa
    startQuiz(state.selectedSurah);
  }
}

function startTimer() {
  clearInterval(state.timerInterval);
  state.timeLeft = 15;
  document.getElementById("timer-value").textContent = state.timeLeft + "s";
  document.getElementById("timer-value").style.color = "var(--forest)";
  
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    document.getElementById("timer-value").textContent = state.timeLeft + "s";
    
    if(state.timeLeft <= 5) document.getElementById("timer-value").style.color = "var(--red)";
    
    if (state.timeLeft <= 0) {
      clearInterval(state.timerInterval);
      handleTimeOut();
    }
  }, 1000);
}

function toggleTranslation() {
  document.getElementById("translation-text").classList.toggle("show");
}

function handleTimeOut() {
  if (state.answered) return;
  state.answered = true;
  
  // Matikan semua tombol
  document.querySelectorAll(".answer-option").forEach(btn => btn.disabled = true);
  
  // Tampilkan jawaban yang benar secara visual
  const correctBtn = document.querySelector(`.answer-option[data-is-correct="true"]`);
  if(correctBtn) correctBtn.classList.add("correct");
  reduceLife();
  // Panggil Popup Feedback (Waktu Habis)
  showFeedbackModal(false, true);
}

function renderQuestion() {
  state.answered = false;
  document.getElementById("translation-text").classList.remove("show");
  
  const task = state.questionTasks[state.questionIndex];
  const currentAyah = task.currentAyah;
  const correctAyah = task.correctAyah;
  
  // Update Header UI
  document.getElementById("selected-surah-label").textContent = state.isRandomMode ? `Mode Acak: ${task.surahName}` : state.selectedSurah;
  document.getElementById("progress-value").textContent = (state.questionIndex + 1) + " / " + state.questionTasks.length;
  document.getElementById("score-value").textContent = state.score;
  document.getElementById("ayah-number").textContent = "Ayat " + currentAyah.no;
  document.getElementById("question-text").textContent = currentAyah.text;
  document.getElementById("translation-text").textContent = currentAyah.trans;

  // Siapkan opsi pengecoh dari surat yang sama
  let distractors = task.distractorsPool.filter(a => a.no !== correctAyah.no);
  distractors = fisherYates(distractors).slice(0, 3);
  
  let options = [{ ...correctAyah, isCorrect: true }, ...distractors.map(d => ({...d, isCorrect: false}))];
  options = fisherYates(options);

  const grid = document.getElementById("answers-grid");
  grid.innerHTML = "";

  options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "answer-option";
    btn.dataset.isCorrect = opt.isCorrect;
    btn.innerHTML = `<span class="choice-label">${letters[idx]}</span><span class="option-arabic">${opt.text}</span>`;
    btn.onclick = () => answerQuestion(btn, opt);
    grid.appendChild(btn);
  });

  startTimer();
}

function answerQuestion(clickedBtn, optionData) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timerInterval);

  const isCorrect = optionData.isCorrect;
  if (isCorrect) {
    state.score += (10 + state.timeLeft); 
    state.correctCount++;
  } else {
    reduceLife(); // <-- Tambahkan baris ini jika jawaban salah
  }

  // Visual Update di Latar Belakang
  document.querySelectorAll(".answer-option").forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.isCorrect === "true") btn.classList.add("correct");
  });
  if (!isCorrect) clickedBtn.classList.add("wrong");

  document.getElementById("score-value").textContent = state.score;

  // Panggil Popup Feedback
  showFeedbackModal(isCorrect, false);
}

// ==========================================
// FUNGSI BARU UNTUK MENGATUR POPUP MODAL
// ==========================================
function showFeedbackModal(isCorrect, isTimeout) {
  const modal = document.getElementById("feedback-modal");
  const mTitle = document.getElementById("modal-title");
  const mAnswer = document.getElementById("modal-answer");
  
  // Ambil teks jawaban benar dari layar
  const correctText = document.querySelector(`.answer-option[data-is-correct="true"] .option-arabic`).textContent;

  if (isTimeout) {
    mTitle.textContent = "WAKTU HABIS ✕";
    mTitle.style.color = "var(--red)";
    mAnswer.innerHTML = `<span class="label">Jawaban yang benar:</span>${correctText}`;
  } else if (isCorrect) {
    mTitle.textContent = "BENAR! ✓";
    mTitle.style.color = "var(--forest)";
    mAnswer.innerHTML = ""; // Kosongkan teks arab jika benar
  } else {
    mTitle.textContent = "SALAH ✕";
    mTitle.style.color = "var(--red)";
    mAnswer.innerHTML = `<span class="label">Jawaban yang benar:</span>${correctText}`;
  }

  // Munculkan popup
  modal.classList.add("show");
}

function closeModalAndNext() {
  // Tutup modal
  document.getElementById("feedback-modal").classList.remove("show");
  
  // Beri jeda sedikit untuk animasi tutup modal sebelum pindah soal
  setTimeout(() => {
    nextQuestion();
  }, 300);
}

function nextQuestion() {
  if (state.questionIndex + 1 < state.questionTasks.length) {
    state.questionIndex++;
    renderQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz(isGameOver = false) {
  clearInterval(state.timerInterval);
  
  saveLeaderboard(); // Simpan nama dan skor ke sistem

  // Ganti teks judul jika mati kehabisan nyawa
  document.querySelector("#result-screen .screen-title").textContent = isGameOver ? "GAME OVER!" : "QUIZ SELESAI!";
  document.querySelector("#result-screen .screen-title").style.color = isGameOver ? "var(--red)" : "var(--forest)";

  document.getElementById("result-surah").textContent = `Pemain: ${state.playerName} • ${state.isRandomMode ? "Mode Acak" : state.selectedSurah}`;
  document.getElementById("score-medallion").textContent = state.score;
  document.getElementById("high-score-display").textContent = "Cek Papan Peringkat"; // Menghilangkan high score personal karena sudah ada leaderboard kelas
  document.getElementById("result-correct").textContent = state.correctCount;
  document.getElementById("result-total").textContent = state.questionTasks.length;
  
  showScreen("result");
}

function endQuizEarly() {
  clearInterval(state.timerInterval);
  showScreen("surahSelect");
}
// ==========================================
// LOGIKA INPUT NAMA & NYAWA
// ==========================================
function prepareQuiz(surahName) {
  state.pendingQuizStart = () => startQuiz(surahName);
  document.getElementById("player-name-input").value = "";
  showScreen("nameSelect");
}

function prepareRandomMode() {
  state.pendingQuizStart = () => startRandomMode();
  document.getElementById("player-name-input").value = "";
  showScreen("nameSelect");
}
// Menyiapkan nama untuk Mode Acak Spesifik Jilid
function prepareJilidRandomMode(jilidName) {
  state.pendingQuizStart = () => startJilidRandomMode(jilidName);
  document.getElementById("player-name-input").value = "";
  showScreen("nameSelect");
}

// Menjalankan Mode Acak Spesifik Jilid
async function startJilidRandomMode(jilidName) {
  state.isRandomMode = true;
  state.randomScope = jilidName;
  state.selectedSurah = `Acak ${jilidName}`; // Nama untuk leaderboard
  
  document.getElementById("loading-overlay").classList.add("show");

  try {
    const surahKeys = classCatalog[jilidName];
    
    // Tarik data API paralel HANYA untuk surat-surat di jilid yang dipilih
    const fetchPromises = surahKeys.map(key => {
      const sNum = surahsData[key].number;
      return fetch(`https://equran.id/api/v2/surat/${sNum}`).then(res => res.json());
    });
    const results = await Promise.all(fetchPromises);
    
    let allTasks = [];
    
    // Gabungkan semua soal dari jilid tersebut
    results.forEach((data, index) => {
      const sName = surahKeys[index];
      const ayatList = data.data.ayat.map(a => ({
        no: a.nomorAyat, text: a.teksArab, trans: a.teksIndonesia
      }));
      for(let i = 0; i < ayatList.length - 1; i++) {
        allTasks.push({
          surahName: sName,
          currentAyah: ayatList[i],
          correctAyah: ayatList[i+1],
          distractorsPool: ayatList 
        });
      }
    });
    
    // Acak seluruh soal dan ambil maksimal 10 soal
    state.questionTasks = fisherYates(allTasks).slice(0, 10);
    state.questionIndex = 0;
    state.score = 0;
    state.correctCount = 0;
    
    // Reset nyawa
    state.lives = 3;
    renderLives();
    
    document.getElementById("loading-overlay").classList.remove("show");
    showScreen("quiz");
    renderQuestion();
    
  } catch (error) {
    document.getElementById("loading-overlay").classList.remove("show");
    alert(`Gagal memuat ${jilidName}. Cek koneksi internet Anda.`);
  }
}

function submitName() {
  const input = document.getElementById("player-name-input").value.trim();
  if (!input) {
    alert("Harap masukkan nama santri!");
    return;
  }
  state.playerName = input;
  if (state.pendingQuizStart) state.pendingQuizStart();
}

function renderLives() {
  const hearts = "❤️".repeat(state.lives) + "🤍".repeat(3 - state.lives);
  document.getElementById("lives-value").textContent = hearts;
}

function reduceLife() {
  state.lives--;
  renderLives();
  if (state.lives <= 0) {
    clearInterval(state.timerInterval);
    setTimeout(() => { finishQuiz(true); }, 1500); // Tunggu sebentar lalu Game Over
  }
}

// ==========================================
// LOGIKA LEADERBOARD KELAS
// ==========================================
function saveLeaderboard() {
  let lb = JSON.parse(localStorage.getItem("kelasLeaderboard")) || [];
  lb.push({
    name: state.playerName,
    score: state.score,
    mode: state.isRandomMode ? "Acak" : state.selectedSurah,
    date: new Date().toLocaleDateString('id-ID')
  });
  // Urutkan skor dari yang tertinggi
  lb.sort((a, b) => b.score - a.score);
  localStorage.setItem("kelasLeaderboard", JSON.stringify(lb));
}

function renderLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";
  
  let lb = JSON.parse(localStorage.getItem("kelasLeaderboard")) || [];
  
  if (lb.length === 0) {
    list.innerHTML = "<p style='color: var(--muted); text-align: center; margin-top: 30px;'>Belum ada data skor di kelas ini.</p>";
  } else {
    lb.forEach((entry, idx) => {
      const li = document.createElement("div");
      li.className = `lb-item ${idx === 0 ? 'rank-1' : ''}`;
      li.innerHTML = `
        <div>
          <strong>#${idx + 1} ${entry.name}</strong>
          <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">${entry.date} • Surat: ${entry.mode}</div>
        </div>
        <span>${entry.score} pts</span>
      `;
      list.appendChild(li);
    });
  }
  showScreen("leaderboard");
}

function resetLeaderboard() {
  if (confirm("Perhatian: Apakah Guru yakin ingin menghapus semua data peringkat di kelas ini secara permanen?")) {
    localStorage.removeItem("kelasLeaderboard");
    renderLeaderboard();
  }
}