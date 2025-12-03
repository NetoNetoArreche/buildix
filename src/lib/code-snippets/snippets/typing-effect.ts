import { CodeSnippet } from "../types";

const code = `/* Typing Effect - Typewriter Animation */
<style>
/* CSS-only typing effect */
.typing {
  overflow: hidden;
  border-right: 3px solid;
  white-space: nowrap;
  animation:
    typing 3.5s steps(40, end),
    blink-caret 0.75s step-end infinite;
}

@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}

@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: currentColor; }
}

/* Typing with loop */
.typing-loop {
  overflow: hidden;
  border-right: 3px solid;
  white-space: nowrap;
  animation:
    typing-loop 4s steps(40, end) infinite,
    blink-caret 0.75s step-end infinite;
}

@keyframes typing-loop {
  0%, 100% { width: 0; }
  50%, 90% { width: 100%; }
}

/* Multiple lines typing */
.typing-container {
  display: inline-block;
}

.typing-line {
  opacity: 0;
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid;
  animation: typing 2s steps(30) forwards, blink-caret 0.75s step-end infinite;
}

.typing-line:nth-child(1) { animation-delay: 0s; }
.typing-line:nth-child(2) { animation-delay: 2.5s; }
.typing-line:nth-child(3) { animation-delay: 5s; }

@keyframes reveal {
  0% { opacity: 0; }
  1% { opacity: 1; }
}
</style>

<script>
// JavaScript typing effect for dynamic text
class TypeWriter {
  constructor(element, words, wait = 3000) {
    this.element = element;
    this.words = words;
    this.wait = wait;
    this.wordIndex = 0;
    this.txt = '';
    this.isDeleting = false;
    this.type();
  }

  type() {
    const current = this.wordIndex % this.words.length;
    const fullTxt = this.words[current];

    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.element.innerHTML = \`<span class="typing-text">\${this.txt}</span>\`;

    let typeSpeed = 100;

    if (this.isDeleting) {
      typeSpeed /= 2;
    }

    if (!this.isDeleting && this.txt === fullTxt) {
      typeSpeed = this.wait;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
      this.isDeleting = false;
      this.wordIndex++;
      typeSpeed = 500;
    }

    setTimeout(() => this.type(), typeSpeed);
  }
}

// Initialize: new TypeWriter(element, ['Word1', 'Word2', 'Word3'], 2000);
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.typewriter');
  if (el) {
    const words = JSON.parse(el.dataset.words || '["Hello", "World"]');
    new TypeWriter(el, words, 2000);
  }
});
</script>

<!-- Usage Examples -->
<h1 class="typing">Welcome to our website</h1>

<div class="typewriter" data-words='["Developer", "Designer", "Creator"]'>
  <span class="typing-text"></span>
</div>`;

export const TYPING_EFFECT: CodeSnippet = {
  id: "typing-effect",
  name: "Typing Effect",
  description: "Efeito de digitacao estilo maquina de escrever",
  category: "mixed",
  tags: ["typing", "typewriter", "animation", "text", "cursor"],
  charCount: code.length,
  code,
};
