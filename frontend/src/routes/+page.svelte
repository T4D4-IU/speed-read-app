<script lang="ts">
  let url: string = '';
  let extractedText: string = '';
  let isLoading: boolean = false;
  let error: string | null = null;

  // New state for reading functionality
  let wpm: number = 300; // Words Per Minute
  let readingTextTokens: string[] = [];
  let currentWordIndex: number = 0;
  let isPlaying: boolean = false;
  let intervalId: number | undefined;

  async function extractText() {
    isLoading = true;
    error = null;
    extractedText = ''; // Clear previous text
    readingTextTokens = []; // Clear previous tokens
    resetReading(); // Reset reading state

    try {
      const response = await fetch('http://localhost:8000/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract text');
      }

      const data = await response.json();
      extractedText = data.text;
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }

  async function pasteFromClipboard() {
    error = null;
    extractedText = ''; // Clear previous text
    readingTextTokens = []; // Clear previous tokens
    resetReading(); // Reset reading state

    try {
      const text = await navigator.clipboard.readText();
      extractedText = text;
    } catch (e: any) {
      error = 'クリップボードからの貼り付けに失敗しました。ブラウザのセキュリティ設定を確認してください。';
      console.error('Failed to read clipboard contents: ', e);
    }
  }

  async function tokenizeAndStartReading() {
    if (!extractedText) {
      error = '抽出されたテキストがありません。';
      return;
    }

    isLoading = true;
    error = null;
    readingTextTokens = [];
    resetReading();

    try {
      const response = await fetch('http://localhost:8000/tokenize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to tokenize text');
      }

      const data = await response.json();
      readingTextTokens = data.tokens;
      startReading(); // Start reading automatically after tokenization
    } catch (e: any) {
      error = e.message;
    } finally {
      isLoading = false;
    }
  }

  function startReading() {
    if (readingTextTokens.length === 0) return;
    if (isPlaying) return;

    isPlaying = true;
    const delay = (60 / wpm) * 1000; // milliseconds per word

    intervalId = window.setInterval(() => {
      if (currentWordIndex < readingTextTokens.length - 1) {
        currentWordIndex++;
      } else {
        pauseReading(); // End of text
      }
    }, delay);
  }

  function pauseReading() {
    isPlaying = false;
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  }

  function nextWord() {
    pauseReading(); // Pause before manual navigation
    if (currentWordIndex < readingTextTokens.length - 1) {
      currentWordIndex++;
    }
  }

  function prevWord() {
    pauseReading(); // Pause before manual navigation
    if (currentWordIndex > 0) {
      currentWordIndex--;
    }
  }

  function resetReading() {
    pauseReading();
    currentWordIndex = 0;
    isPlaying = false;
  }

  // React to WPM changes
  $: if (isPlaying && intervalId !== undefined) {
    pauseReading();
    startReading();
  }
</script>

<svelte:head>
  <title>Speed Read App</title>
  <meta name="description" content="Speed Read Web Application" />
</svelte:head>

<section>
  <h1>速読アプリ</h1>

  {#if readingTextTokens.length === 0}
    <h2>テキスト入力</h2>
    <div class="input-section">
      <input type="url" bind:value={url} placeholder="WebページのURLを入力" />
      <button on:click={extractText} disabled={isLoading}>
        {isLoading ? '抽出中...' : 'URLから抽出'}
      </button>
    </div>

    <div class="clipboard-section">
      <button on:click={pasteFromClipboard}>
        クリップボードから貼り付け
      </button>
    </div>

    {#if error}
      <p class="error-message">{error}</p>
    {/if}

    {#if extractedText}
      <div class="extracted-text-area">
        <h2>抽出されたテキスト:</h2>
        <textarea readonly bind:value={extractedText}></textarea>
        <button on:click={tokenizeAndStartReading} disabled={isLoading}>
          {isLoading ? '準備中...' : '読書開始'}
        </button>
      </div>
    {/if}
  {:else}
    <h2>読書中</h2>
    <div class="reading-controls">
      <label for="wpm-slider">WPM: {wpm}</label>
      <input
        type="range"
        id="wpm-slider"
        min="50"
        max="1000"
        step="10"
        bind:value={wpm}
      />
      <div class="playback-buttons">
        <button on:click={prevWord} disabled={currentWordIndex === 0}>戻る</button>
        <button on:click={isPlaying ? pauseReading : startReading}>
          {isPlaying ? '一時停止' : '再生'}
        </button>
        <button on:click={nextWord} disabled={currentWordIndex === readingTextTokens.length - 1}>進む</button>
        <button on:click={resetReading}>リセット</button>
      </div>
    </div>

    <div class="reading-display">
      <p class="current-word">
        {readingTextTokens[currentWordIndex] || ''}
      </p>
    </div>
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
  }

  h1, h2 {
    margin-bottom: 20px;
    color: #333;
    text-align: center;
  }

  .input-section, .clipboard-section {
    display: flex;
    width: 100%;
    margin-bottom: 20px;
    gap: 10px; /* Add gap for spacing between input and button */
  }

  input[type="url"] {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
  }

  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    white-space: nowrap; /* Prevent button text from wrapping */
  }

  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }

  .error-message {
    color: red;
    margin-top: 10px;
  }

  .extracted-text-area {
    width: 100%;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  textarea {
    width: 100%;
    height: 300px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
    resize: vertical;
  }

  .reading-controls {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-bottom: 30px;
  }

  .reading-controls label {
    font-size: 1.2em;
    font-weight: bold;
  }

  #wpm-slider {
    width: 80%;
    -webkit-appearance: none;
    height: 8px;
    background: #ddd;
    outline: none;
    opacity: 0.7;
    -webkit-transition: .2s;
    transition: opacity .2s;
    border-radius: 5px;
  }

  #wpm-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
  }

  #wpm-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #007bff;
    cursor: pointer;
  }

  .playback-buttons {
    display: flex;
    gap: 10px;
  }

  .reading-display {
    width: 100%;
    min-height: 150px; /* Ensure some height for display */
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid #007bff;
    border-radius: 10px;
    background-color: #f9f9f9;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .current-word {
    font-size: 3em;
    font-weight: bold;
    color: #007bff;
    text-align: center;
    word-break: break-all; /* Handle long words */
  }
</style>