/**
 * 主应用逻辑
 */

const App = {
    currentTopicId: null,
    sentencesMap: {},

    init() {
        // 初始化音频播放器
        AudioPlayer.init();

        // 构建句子映射
        this.buildSentencesMap();

        // 渲染主题导航
        this.renderTopicsNav();

        // 绑定事件
        this.bindEvents();

        // 根据设备类型更新提示
        this.updateSubtitle();

        // 默认显示第一个主题
        if (DATA.topics.length > 0) {
            this.selectTopic(DATA.topics[0].id);
        }
    },

    // 根据设备类型更新提示文字
    updateSubtitle() {
        const subtitle = document.getElementById('subtitle');
        if (subtitle) {
            if (this.isTouchDevice()) {
                subtitle.textContent = '点击单词即可发音';
            } else {
                subtitle.textContent = '双击单词即可发音';
            }
        }
    },

    buildSentencesMap() {
        DATA.sentences.forEach(sentence => {
            this.sentencesMap[sentence.id] = sentence;
        });
    },

    renderTopicsNav() {
        const nav = document.getElementById('topicsNav');
        nav.innerHTML = DATA.topics.map(topic => `
            <button class="topic-btn" data-topic-id="${topic.id}">
                ${topic.name}
            </button>
        `).join('');
    },

    selectTopic(topicId) {
        this.currentTopicId = topicId;

        // 更新导航按钮状态
        document.querySelectorAll('.topic-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.topicId) === topicId);
        });

        // 获取主题信息
        const topic = DATA.topics.find(t => t.id === topicId);
        if (!topic) return;

        // 更新标题
        document.getElementById('topicTitle').textContent = topic.name;
        document.getElementById('topicProgress').textContent = `共 ${topic.sentence_ids.length} 个句子`;

        // 渲染句子列表
        this.renderSentences(topic.sentence_ids);
    },

    renderSentences(sentenceIds) {
        const container = document.getElementById('sentencesList');

        const sentencesHtml = sentenceIds.map(id => {
            const sentence = this.sentencesMap[id];
            if (!sentence) return '';

            return this.createSentenceCard(sentence);
        }).join('');

        container.innerHTML = sentencesHtml;

        // 绑定句子卡片事件
        this.bindSentenceEvents();
    },

    // 转义HTML特殊字符
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    // 生成单个词汇卡片的HTML
    createWordCard(word, type) {
        const typeClass = type === 'core' ? 'core-word-card' : 'topic-word-card';

        // 扩展信息
        let extraHtml = '';

        if (word.collocations && word.collocations.length > 0) {
            extraHtml += `
                <div class="word-info-item collocations">
                    <span class="info-label">搭配</span>
                    <span class="info-content">${word.collocations.map(c => this.escapeHtml(c)).join(' | ')}</span>
                </div>
            `;
        }

        if (word.memory) {
            extraHtml += `
                <div class="word-info-item memory">
                    <span class="info-label">记忆</span>
                    <span class="info-content">${this.escapeHtml(word.memory)}</span>
                </div>
            `;
        }

        if (word.usage) {
            extraHtml += `
                <div class="word-info-item usage">
                    <span class="info-label">用法</span>
                    <span class="info-content">${this.escapeHtml(word.usage)}</span>
                </div>
            `;
        }

        if (word.comparison) {
            extraHtml += `
                <div class="word-info-item comparison">
                    <span class="info-label">辨析</span>
                    <span class="info-content">${this.escapeHtml(word.comparison)}</span>
                </div>
            `;
        }

        return `
            <div class="word-card ${typeClass}" data-word="${this.escapeHtml(word.word)}">
                <div class="word-card-header">
                    <span class="word-name">${this.escapeHtml(word.word)}</span>
                    <span class="word-phonetic">/${this.escapeHtml(word.phonetic)}/</span>
                    <button class="word-play-btn" data-word="${this.escapeHtml(word.word)}" title="播放发音">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                    </button>
                </div>
                <div class="word-definition">${this.escapeHtml(word.definition)}</div>
                ${extraHtml ? `<div class="word-extra">${extraHtml}</div>` : ''}
            </div>
        `;
    },

    createSentenceCard(sentence) {
        // 将英文句子中的单词包装成可点击的元素
        const wrappedEnglish = this.wrapWordsInSentence(sentence.english);

        // 核心词汇 - 展开显示所有信息
        const coreWordsHtml = sentence.core_words.length > 0 ? `
            <div class="words-section">
                <div class="words-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    核心词汇 (${sentence.core_words.length})
                </div>
                <div class="words-grid">
                    ${sentence.core_words.map(w => this.createWordCard(w, 'core')).join('')}
                </div>
            </div>
        ` : '';

        // 主题词汇 - 展开显示所有信息
        const topicWordsHtml = sentence.topic_words.length > 0 ? `
            <div class="words-section topic-words-section">
                <div class="words-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    主题词汇 (${sentence.topic_words.length})
                </div>
                <div class="words-grid">
                    ${sentence.topic_words.map(w => this.createWordCard(w, 'topic')).join('')}
                </div>
            </div>
        ` : '';

        // 语法笔记
        const grammarHtml = sentence.grammar_title ? `
            <div class="grammar-section">
                <div class="grammar-title" data-sentence-id="${sentence.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
                    </svg>
                    语法笔记：${this.escapeHtml(sentence.grammar_title)}
                    <svg class="toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                    </svg>
                </div>
                <div class="grammar-notes" id="grammar-${sentence.id}">
                    ${sentence.grammar_notes.map(note => `<p>${this.escapeHtml(note)}</p>`).join('')}
                </div>
            </div>
        ` : '';

        return `
            <div class="sentence-card" data-sentence-id="${sentence.id}">
                <div class="sentence-header">
                    <span class="sentence-number">${sentence.id}</span>
                    <div class="sentence-english">${wrappedEnglish}</div>
                    <button class="play-btn" data-sentence-id="${sentence.id}" title="播放句子">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                </div>
                <div class="sentence-body">
                    <p class="sentence-chinese">${this.escapeHtml(sentence.chinese)}</p>
                    ${grammarHtml}
                    ${coreWordsHtml}
                    ${topicWordsHtml}
                </div>
            </div>
        `;
    },

    wrapWordsInSentence(text) {
        // 将句子中的每个单词包装成可点击的span
        return text.replace(/([a-zA-Z]+(?:'[a-zA-Z]+)?)/g, '<span class="word">$1</span>');
    },

    bindEvents() {
        // 主题导航点击
        document.getElementById('topicsNav').addEventListener('click', (e) => {
            const btn = e.target.closest('.topic-btn');
            if (btn) {
                const topicId = parseInt(btn.dataset.topicId);
                this.selectTopic(topicId);
            }
        });
    },

    // 检测是否为触摸设备
    isTouchDevice() {
        return ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0);
    },

    bindSentenceEvents() {
        const isMobile = this.isTouchDevice();

        // 播放按钮点击
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sentenceId = parseInt(btn.dataset.sentenceId);
                AudioPlayer.playSentence(sentenceId, btn);
            });
        });

        // 语法笔记展开/收起
        document.querySelectorAll('.grammar-title').forEach(title => {
            title.addEventListener('click', () => {
                const sentenceId = title.dataset.sentenceId;
                const notes = document.getElementById(`grammar-${sentenceId}`);
                title.classList.toggle('expanded');
                notes.classList.toggle('show');
            });
        });

        // 词汇卡片中的播放按钮
        document.querySelectorAll('.word-play-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const word = btn.dataset.word;
                AudioPlayer.playWord(word);

                // 视觉反馈
                btn.classList.add('playing');
                setTimeout(() => btn.classList.remove('playing'), 500);
            });
        });

        // 词汇卡片发音 - 移动端单击，PC端双击
        document.querySelectorAll('.word-card').forEach(card => {
            if (isMobile) {
                // 移动端：单击卡片发音
                card.addEventListener('click', (e) => {
                    // 如果点击的是播放按钮，不重复处理
                    if (e.target.closest('.word-play-btn')) return;

                    const word = card.dataset.word;
                    AudioPlayer.playWord(word);

                    // 视觉反馈
                    card.classList.add('highlight');
                    setTimeout(() => card.classList.remove('highlight'), 500);
                });
            } else {
                // PC端：双击发音
                card.addEventListener('dblclick', () => {
                    const word = card.dataset.word;
                    AudioPlayer.playWord(word);

                    // 视觉反馈
                    card.classList.add('highlight');
                    setTimeout(() => card.classList.remove('highlight'), 500);
                });
            }
        });

        // 句子中的单词发音 - 移动端单击，PC端双击
        document.querySelectorAll('.sentence-english .word').forEach(wordSpan => {
            if (isMobile) {
                // 移动端：单击发音
                wordSpan.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const word = wordSpan.textContent;
                    AudioPlayer.playWord(word);

                    // 添加视觉反馈
                    wordSpan.classList.add('tapped');
                    setTimeout(() => {
                        wordSpan.classList.remove('tapped');
                    }, 500);
                });
            } else {
                // PC端：双击发音
                wordSpan.addEventListener('dblclick', (e) => {
                    e.preventDefault();
                    const word = wordSpan.textContent;
                    AudioPlayer.playWord(word);

                    // 添加视觉反馈
                    wordSpan.style.background = '#c8e6c9';
                    setTimeout(() => {
                        wordSpan.style.background = '';
                    }, 500);
                });
            }
        });
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
