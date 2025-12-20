const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

const port = process.argv[2] || 9222;
const url = process.argv[3];
const saveDir = process.argv[4];

if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
}

(async function() {
    let client;
    try {
        client = await CDP({ port });
        const { Page, Runtime, Network } = client;

        // 1. 필요한 도메인 활성화
        await Promise.all([Page.enable(), Runtime.enable(), Network.enable()]);

        // 2. 페이지 이동
        console.log(`Navigating to ${url}...`);
        await Page.navigate({ url });

        // 3. 로딩 대기 (10초)
        // 충분히 기다려야 이미지가 렌더링되고 캐시에 들어갑니다.
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 4. [핵심] 브라우저 내부에서 이미지 데이터를 긁어모으는 스크립트 실행
        console.log('이미지 데이터 추출 중...');

        const expression = `
            (async () => {
                const images = Array.from(document.querySelectorAll('img'));
                const results = [];

                for (const img of images) {
                    try {
                        // src가 없거나 base64인 경우 처리
                        if (!img.src || img.src.startsWith('data:')) continue;

                        // [중요] fetch로 이미지 데이터를 브라우저 캐시에서 가져옴
                        // 브라우저가 이미 로딩한 리소스라면 서버 요청 없이 캐시에서 즉시 반환됨
                        const response = await fetch(img.src);
                        const blob = await response.blob();
                        
                        // Blob -> Base64 변환
                        const reader = new FileReader();
                        const base64Data = await new Promise((resolve) => {
                            reader.onloadend = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        });

                        results.push({
                            src: img.src,
                            data: base64Data
                        });
                    } catch (e) {
                        console.error('이미지 변환 실패:', img.src);
                    }
                }
                return JSON.stringify(results);
            })();
        `;

        // Runtime.evaluate로 스크립트 실행 및 결과 수신
        const result = await Runtime.evaluate({
            expression: expression,
            awaitPromise: true, // 비동기(fetch) 완료될 때까지 대기
            returnByValue: true
        });

        // 5. Node.js 쪽에서 파일 저장
        if (result.result && result.result.value) {
            const imageDataList = JSON.parse(result.result.value);
            console.log(`총 ${imageDataList.length}개의 이미지 발견`);

            imageDataList.forEach((imgObj, index) => {
                try {
                    // Base64 문자열에서 헤더 제거 (data:image/jpeg;base64, 부분)
                    const matches = imgObj.data.match(/^data:(.+);base64,(.+)$/);
                    if (!matches) return;

                    const ext = matches[1].split('/')[1].replace('jpeg', 'jpg'); // 확장자 추출
                    const data = matches[2];;

                    // URL에서 쿼리스트링 제거 후 순수 파일명 추출
                    const urlPath = imgObj.src.split('?')[0];
                    let originalName = path.basename(urlPath);

                    // 파일명에서 확장자 부분 제거 (나중에 .${ext}를 붙일 것이므로) (예: photo.jpg -> photo)
                    const nameWithoutExt = originalName.includes('.')
                        ? originalName.substring(0, originalName.lastIndexOf('.'))
                        : originalName;

                    // 특수문자 제거 및 공백 처리 (파일명으로 안전한 문자만 남김)
                    const cleanBaseName = nameWithoutExt
                        .replace(/[/\\?%*:|"<>]/g, '') // 금지된 문자 제거
                        .replace(/\s+/g, '_')          // 공백을 언더바로 변경
                        .substring(0, 50);             // 너무 길면 자름

                    // 4. 최종 파일명 조립 (중복이 걱정된다면 index만 뒤에 붙임 / 예: product_01.jpg)
                    const safeName = cleanBaseName
                        ? `${cleanBaseName}.${ext}`
                        : `image_${index}.${ext}`;

                    // 바이너리로 변환 후 저장
                    const buffer = Buffer.from(data, 'base64');
                    fs.writeFileSync(path.join(saveDir, safeName), buffer);

                } catch (e) {
                    console.error('파일 저장 중 오류:', e.message);
                }
            });
            console.log('이미지 저장 완료');
        }

        // 6. HTML 소스 출력
        const { DOM } = client;
        const root = await DOM.getDocument();
        const html = await DOM.getOuterHTML({ nodeId: root.root.nodeId });
        console.log(html.outerHTML);

    } catch (err) {
        console.error(err);
    } finally {
        if (client) await client.close();
    }
})();
