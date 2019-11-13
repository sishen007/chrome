var sishen007Log = new function () {
    var I = this, info = {'hasInfo': 0, 'logs': '', 'progress_start': 0},
        logs = {};
    // 设置日志信息
    I.setInfo = function (msg) {
        if (info.hasInfo == 0 && info.logs != '') {
            info.hasInfo = 1;
        }
        if (msg == '=====start======') {
            info.logs = '';
            info.hasInfo = 0;
        } else {
            // 解析progress
            p = msg.split('/');
            if (p[0] == 'progress') {
                info.progress_start = Math.round(p[1] / p[2] * 10000) / 100.00;
            } else {
                info.logs += msg;
            }
        }
    };
    // 获取日志信息
    I.getInfo = function (msg) {
        // 测试数据
        return info;
    };
    // 获取扩展ID
    I.getExtensionId = function(){
        return chrome.runtime.id;
    }

}
chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
    // 监听来自content_script.js的消息并作出响应
    var f = request.cmd;
    sishen007Log.setInfo(f);
    sendResponse({'extension_id':chrome.runtime.id,'msg':'this is background js back.'});
    return true;
});

// 获取tab_id 并向tab发送消息
// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo,tab){
//     chrome.tabs.sendMessage(tabId,{'extension_id':chrome.runtime.id});
// });
