const CDP = require('chrome-remote-interface');
const fs = require('fs');

const url = process.argv[2]; // 인덱스 2의 인수를 url 변수에 할당합니다.

(async function() {
    // Chrome에 원격으로 연결합니다.
    const client = await CDP();

    // 디버그 타겟 목록을 가져옵니다.
    const { Target, Page } = client;
    const { targetInfos } = await Target.getTargets();

    // 첫 번째 탭을 대상으로 선택합니다.
    const targetId = targetInfos[0].targetId;
    await Target.activateTarget({ targetId });

    // 원하는 URL에 접속합니다.
    await Page.navigate({ url });

    // 일정 시간(10초) 동안 기다립니다.
    await new Promise(resolve => setTimeout(resolve, 10000));

    // 페이지 소스를 가져옵니다.
    const { DOM } = client;
    const documentNodeId = (await DOM.getDocument()).root.nodeId;
    const { nodeId: listNodeId } = await DOM.querySelector({
        nodeId: documentNodeId,
        selector: '.conList_ull', // ul 태그의 class 이름을 적용하여 가져옵니다.
    });
    const { nodeIds: listItemNodeIds } = await DOM.querySelectorAll({
        nodeId: listNodeId,
        selector: 'li', // ul 태그의 자식인 li 태그들을 가져옵니다.
    });

    // 각 li 태그에 있는 a 태그의 href 값을 가져와서 리스트로 출력합니다.
    for (const listItemNodeId of listItemNodeIds) {
        const { nodeId: anchorNodeId } = await DOM.querySelector({
            nodeId: listItemNodeId,
            selector: 'a', // li 태그의 자식인 a 태그를 가져옵니다.
        });
        const { attributes } = await DOM.getAttributes({ nodeId: anchorNodeId });
        const title = attributes[7];
        const href = attributes[1];
        // URL을 '/' 기준으로 분리합니다.
        const urlParts = href.split('/');
        // 마지막 부분을 추출합니다.
        const pageId = urlParts[urlParts.length - 2];
        const linkText = "<a href=\"http://127.0.0.1:8080/dummy?page=" + pageId + "\">" + title + "</a>";
        console.log(linkText);
    }

    // 연결을 종료합니다.
    await client.close();
})();