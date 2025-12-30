const https = require('https');
const readline = require('readline');

// 创建接口以读取用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n--- MiniMax API Key Diagnostics Tool ---');
console.log('This script will test if your API Key is valid and has sufficient balance.');

rl.question('Please enter your MiniMax API Key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.error('Error: API Key cannot be empty.');
    rl.close();
    return;
  }

  const cleanKey = apiKey.trim();
  console.log(`\nTesting key: ${cleanKey.substring(0, 4)}...${cleanKey.substring(cleanKey.length - 4)}`);

  // 构建请求数据 (最小请求以节省 Token)
  const postData = JSON.stringify({
    model: 'music-2.0',
    prompt: 'A short test sound',
    lyrics: 'Test lyrics to check quota',
    stream: false,
    output_format: 'url',
    audio_setting: {
      sample_rate: 44100,
      bitrate: 128000,
      format: 'mp3',
    },
    aigc_watermark: false,
  });

  const options = {
    hostname: 'api.minimax.chat',
    path: '/v1/music_generation',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = '';

    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\nResponse Body:');
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));

        if (json.base_resp && json.base_resp.status_code !== 0) {
          console.error(`\n[FAILURE] API Error Code: ${json.base_resp.status_code}`);
          console.error(`Message: ${json.base_resp.status_msg}`);
          if (json.base_resp.status_code === 1008) {
            console.error(
              "\n>>> DIAGNOSIS: The API returned 1008 (Insufficient Balance). This confirms the key itself has no quota left on the 'music-2.0' model."
            );
          } else if (json.base_resp.status_code === 1004) {
            console.error('\n>>> DIAGNOSIS: Authentication Failed. The key might be invalid.');
          }
        } else if (res.statusCode === 200) {
          console.log('\n>>> SUCCESS: The API accepted the request. Your key is working correctly.');
        }
      } catch (e) {
        console.log(data); // 打印原始响应
      }
      rl.close();
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    rl.close();
  });

  // 写入数据到请求主体
  req.write(postData);
  req.end();
});
