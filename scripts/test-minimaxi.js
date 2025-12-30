// 测试MiniMaxi API连接
const apiKey =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLlub_lt57nkoPlt57np5HmioDmnInpmZDlhazlj7giLCJVc2VyTmFtZSI6IuW3qeWtkOaDoCIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxODQ4OTEzODU5MDcxNDU5MzU0IiwiUGhvbmUiOiIxNTExMDIxMzIyNCIsIkdyb3VwSUQiOiIxODQ4OTEzODU5MDYzMDcwNzQ2IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiMjQ5MDUzOTU3QHFxLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTEwLTI4IDE3OjQzOjMxIiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.MmLVlKiwVgDFXxE-rdQYY2nCIa7IXLFn2aN85eZr78fvKuGNxswulwejY_OYWFO_DnF5EjIHZW8oiYqTS2a021Z0Nb61FVe-AmyBFsQ6XV1zuRex8hEfCEIe2G0afWVz759Cq6MgSD2jAVvGV8S7kiKPgfwBjntnb9j0U0_GrANr8TMzEOQ4HdyH48bfKHcyGA9ZO3eG3Qdw6rKEx3WXeC44HvgiIEFTR7kv8YzsVYlkwOoqTPdg4ylLPcO-oRhSBsNyJG-quTF9-Kow3A-Wga8MXqhKp20hMF8QJEB09ozrY_iGXQyiVvIamYkfX5L3u4CD2f1lqQvrmxc6DPFb9Q';

const testData = {
  model: 'music-2.0',
  prompt: 'Auto, dynamic, emotional, based on lyrics and story context',
  lyrics:
    '[intro]\nThis is a test song\nTo check if API works\n\n[verse]\nTesting the MiniMaxi API\nHope it returns some audio\nFor our music generation app\n\n[chorus]\nPlease work, MiniMaxi\nGive us some audio data\nWe need to make music\nFor our happy users',
  stream: false,
  output_format: 'url',
  audio_setting: {
    sample_rate: 44100,
    bitrate: 256000,
    format: 'mp3',
  },
  aigc_watermark: false,
};

async function testMiniMaxiAPI() {
  console.log('Testing MiniMaxi API connection...');
  console.log('API Key prefix:', apiKey.substring(0, 20) + '...');
  console.log('Request payload:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch('https://api.minimaxi.com/v1/music_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(testData),
    });

    console.log('\nResponse Status:', response.status, response.statusText);

    const data = await response.json();
    console.log('\nResponse Headers:', Object.fromEntries(response.headers.entries()));
    console.log('\nResponse Data:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ API call successful!');
      console.log('Has audio data:', !!data?.data?.audio);
      console.log('Audio data type:', typeof data?.data?.audio);
      if (data?.data?.audio) {
        console.log('Audio data length:', data.data.audio.length);
        console.log('Audio URL:', data.data.audio.substring(0, 100) + '...');
      }
    } else {
      console.log('\n❌ API call failed!');
      console.log('Error details:', data);
    }
  } catch (error) {
    console.error('\n❌ Network or other error:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testMiniMaxiAPI();
