<script lang="ts">
  let url: string = '';
  let extractedText: string = '';
  let isLoading: boolean = false;
  let error: string | null = null;

  async function extractText() {
    isLoading = true;
    error = null;
    extractedText = '';

    try {
      const response = await fetch('http://localhost:8000/extract-text', { // バックエンドのURL
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
</script>

<svelte:head>
  <title>Speed Read App</title>
  <meta name="description" content="Speed Read Web Application" />
</svelte:head>

<section>
  <h1>Webページからテキストを抽出</h1>

  <div class="input-section">
    <input type="url" bind:value={url} placeholder="WebページのURLを入力" />
    <button on:click={extractText} disabled={isLoading}>
      {isLoading ? '抽出中...' : 'テキストを抽出'}
    </button>
  </div>

  {#if error}
    <p class="error-message">{error}</p>
  {/if}

  {#if extractedText}
    <div class="extracted-text-area">
      <h2>抽出されたテキスト:</h2>
      <textarea readonly value={extractedText}></textarea>
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

  h1 {
    margin-bottom: 20px;
    color: #333;
  }

  .input-section {
    display: flex;
    width: 100%;
    margin-bottom: 20px;
  }

  input[type="url"] {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
    margin-right: 10px;
  }

  button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
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
</style>