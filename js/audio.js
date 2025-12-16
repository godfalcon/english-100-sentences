/**
 * 音频播放模块
 */

const AudioPlayer = {
    sentenceAudio: null,
    currentPlayingBtn: null,

    init() {
        this.sentenceAudio = document.getElementById('sentenceAudio');
        this.sentenceAudio.addEventListener('ended', () => {
            this.onPlayEnd();
        });
        this.sentenceAudio.addEventListener('error', (e) => {
            console.error('音频加载失败:', e);
            this.onPlayEnd();
        });
    },

    /**
     * 播放句子音频
     * @param {number} sentenceId - 句子ID (1-100)
     * @param {HTMLElement} btn - 播放按钮元素
     */
    playSentence(sentenceId, btn) {
        // 如果点击的是正在播放的按钮，则暂停
        if (this.currentPlayingBtn === btn && !this.sentenceAudio.paused) {
            this.sentenceAudio.pause();
            this.onPlayEnd();
            return;
        }

        // 停止之前的播放
        if (this.currentPlayingBtn) {
            this.onPlayEnd();
        }

        // 格式化文件名 (001, 002, ..., 100)
        const fileName = String(sentenceId).padStart(3, '0') + '.mp3';
        const audioPath = `audio/${fileName}`;

        this.sentenceAudio.src = audioPath;
        this.sentenceAudio.play().then(() => {
            this.currentPlayingBtn = btn;
            btn.classList.add('playing');
        }).catch(err => {
            console.error('播放失败:', err);
        });
    },

    onPlayEnd() {
        if (this.currentPlayingBtn) {
            this.currentPlayingBtn.classList.remove('playing');
            this.currentPlayingBtn = null;
        }
    },

    /**
     * 播放单词发音（使用有道词典API）
     * @param {string} word - 要发音的单词
     */
    playWord(word) {
        // 清理单词，只保留字母
        const cleanWord = word.replace(/[^a-zA-Z\s\-\']/g, '').trim().toLowerCase();

        if (!cleanWord) return;

        // 使用有道词典的发音API
        const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanWord)}&type=2`;

        // 创建临时音频元素播放
        const audio = new Audio(audioUrl);
        audio.play().catch(err => {
            console.error('单词发音失败:', err);
            // 备用方案：使用 Web Speech API
            this.playWordWithSpeech(cleanWord);
        });
    },

    /**
     * 使用 Web Speech API 播放单词（备用方案）
     * @param {string} word - 要发音的单词
     */
    playWordWithSpeech(word) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            speechSynthesis.speak(utterance);
        }
    }
};
