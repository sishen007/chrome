/**
 * sishen007破解
 * http://pn201913029.stu.teacher.com.cn/ 视频课程脚本
 */
var insertScriptCode = `
// 1. 获取已经学习的总课程时间
function sishen007FindScoreStudentListByStudyPlanIdAndProjectPhaseId(projectPhaseId=474) {
    // 获取projectPhaseId (第几阶段)
    $.ajax({
        url: '../scoreStudent/findProjectPhaseScore',
        type: 'POST',
        dataType: 'json',
        data: '',
        async: false,
        success: function (result) {
            var name = '未知阶段';
            for(i = 0;i<result.data.projectPhaseScoreList.length;i++){
                phaseName  = result.data.projectPhaseScoreList[i].name;
                projectPhaseId = result.data.projectPhaseScoreList[i].id;
                _studyPlanId = result.data.projectPhaseScoreList[i].studyPlanId;
                if(_studyPlanId != studyPlanId){
                    continue;
                }
                $.ajax({
                        url: '../scoreStudent/findScoreStudentListByStudyPlanIdAndProjectPhaseId',
                        type: 'POST',
                        dataType: 'json',
                        async: false,
                        data: {
                            id: _studyPlanId,
                            projectPhaseId: projectPhaseId
                        }
                    })
                .done(function(result) {
                    if (result.isSuccess == 1) {
                        if (result.data.scoreDetailDTO.contentTypeCourse.alreadyStudyTime) {
                            appendSishen007Log(phaseName+'共学习时间:'+ result.data.scoreDetailDTO.contentTypeCourse.alreadyStudyTime + '分钟',result.data.scoreDetailDTO.contentTypeCourse.contentMemo);
                        }
                    }
                })
            }
        }
    });
}
// 2. 课程已学时间接口
function sishen007GetStudyTime(period) {
    $.ajax({
        url: '../course/findCourseStudyTime',
        type: 'post',
        data: {
            'courseCode': courseCode,
            'userId': userId,
            'studyPlanId': studyPlanId,
            'period': period
        },
        async: false,
        success: function (result) {
            if (result.isSuccess == 1) {
                result.data.studyTime > 0 ? result.data.studyTime : result.data.studyTime = 0;
                // 获取该阶段的总分数
                sishen007FindScoreStudentListByStudyPlanIdAndProjectPhaseId();

                if (result.data.tag == 1 && result.data.studyTime >= result.data.totalTime) { //设置了单科最高累计时长
                    appendSishen007Log('本课程共学习了 ' + result.data.studyTime + ' 分钟,已达到本门课程累计时间上限');
                    sishen007Stop();
                } else {
                    appendSishen007Log('本课程共学习了 ' + result.data.studyTime + '/' + result.data.totalTime  + ' 分钟');
                }
                appendSishen007Log('progress/' + result.data.studyTime + '/' + result.data.totalTime,false);
            }
        }
    });
}
// 3. 更新实时分数
function sishen007GetRealScore(){
    $.ajax({
        url: '../scoreStudent/getRealControl',
        type: 'get',
        data: {
            'projectId': projectId,
            'userId': userId,
        },
        async: false,
        success: function (result) {
            if (result.isSuccess == 1) {
               appendSishen007Log('实时成绩更新成功！');
            }
        }
    });
}
// 4. 发送虚拟分数给服务器
function sishen007SetStudyRecordStorage(type='auto',allTime = 5,everyScoreAdd = 5) {
    if (true) {
        // var studyTime = type ? 0 : Math.round(courseStudyTime / 60);
        var period = $('.addCourseTime').attr('data-period');
        var _subjectTableId = subjectTableId == undefined ? 0 : subjectTableId;
        var _mediumType = mediumType != 1 ? 13 : 1; //1;
        var _fatherTableId =  typeof fatherTableId != 'undefined' ? fatherTableId : courseCataId;
        var obj = {
            'studyCircleId': studyCircleId,
            'userId': userId,
            'subjectTableId': _subjectTableId,
            'fatherTableId': _fatherTableId,//fatherTableId,//courseCataId,
            'studyType': _mediumType,
            'studyTime': 5,
            'action': '学习',
            'deviceType': 'pc端',
            'studyPlanId': studyPlanId,
            'courseCode': courseCode,
            'period': period,
            'videoTime' : sishenInt*60*everyScoreAdd,
            'actionType' : type ? 'self' : 'auto',
        }
        $.ajax({
            url: '../generate/getCode?userId='+userId+'&businessCode=insertStudyRecord'+ '&access_token=' + $.cookie('access_token'),
            type: 'POST',
            async: false,
            success: function (result) {
                appendSishen007Log('=====start======',false);
                appendSishen007Log('成功获取u_code,正在发起第'+sishenInt+'次请求...');
                $.ajax({
                    url: '../studyRecord/insertStudyRecord?u_code='+result.data,
                    type: 'post',
                    contentType: 'application/json',
                    data: JSON.stringify(obj),
                    dataType: 'json',
                    async: false,
                    success: function (result) {
                        //appendSishen007Log(result);
                        if(result.isSuccess == 1 && result.data == null){
                            appendSishen007Log('本次加速请求成功.升速'+everyScoreAdd+'分钟');
                            sishenInt++;
                        }else{
                            appendSishen007Log('本次加速请求失败.正在重试...');
                        }
                        // 加速成功更新获取下最新分数
                        sishen007GetRealScore()
                        sishen007GetStudyTime(period);
                        if (result.isSuccess == 1) {
                            courseStudyTime = 0;
                            window.sessionStorage.courseStudyTime = 0;
                        }
                    }
                })
                //appendSishen007Log('=====end======');
            }
        })
        // 循环多次
        if(sishenInt >= allTime){
            sishen007Stop();
        }
    }
}
// 结束
function sishen007Stop(){
    clearInterval(sishenIntervalId); // 到时清除计时器
    appendSishen007Log('==============结束刷课==============')  ;
}
// 发送给background消息
function sishen007SendBackInfo(msg = ''){
    chrome.runtime.sendMessage(EXTENSION_ID,{cmd:msg},{includeTlsChannelId:false},function(response){
        // 动态赋值扩展ID
        EXTENSION_ID = response.extension_id;
    });
    
}
// 将日志存储到一个div中
function appendSishen007Log(msg='',isBr=true){
    console.log(msg);
    if(isBr){
        sishen007SendBackInfo(msg+'<br/>');
    }else{
        sishen007SendBackInfo(msg);
    }
    
}
function sishen007Test(){
    if(sishenInt==1){
        appendSishen007Log('=====start======',false);
    }else if(sishenInt==20){
        sishen007Stop();
    }else{
        appendSishen007Log('hello world....');   
    }
    sishenInt++;    
}
// 创建日志框
function sishen007CreateLogDiv() {
    var theLogDiv = document.createElement('div');
    theLogDiv.setAttribute('id','sishen007-div-log');
    theLogDiv.style.display = 'none';
    document.body.appendChild(theLogDiv);
}

// 启动配置,请求次数初始化
//appendSishen007Log('==============开始刷课==============');
var sishenInt = 1 ; // 记录循环次数
var EXTENSION_ID = ''; // 声明扩展id,后续传递需要
// 好像只能放在外面
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
//     console.log(request);
// });
checkExtensionId = setInterval(function(){
    if(document.getElementById('sishen007-log-extension-id') != null){
        EXTENSION_ID = document.getElementById('sishen007-log-extension-id').getAttribute('extension_id');
        clearInterval(checkExtensionId);
        console.log('扩展ID:'+EXTENSION_ID);
        sishenIntervalId = setInterval("sishen007SetStudyRecordStorage('auto',100,5)", 30000);//setInterval('sishen007Test()', 3000);//setInterval("sishen007SetStudyRecordStorage('auto',100,5)", 30000);
    };
    console.log('还未获取到扩展ID');
}, 1000);
`;

// 创建js代码
const theScript = document.createElement('script');
theScript.innerHTML = insertScriptCode;
document.body.appendChild(theScript);

// 设置扩展ID
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    var theLogDiv = document.createElement('div');
    theLogDiv.setAttribute('id','sishen007-log-extension-id');
    theLogDiv.style.display = 'none';
    theLogDiv.setAttribute('extension_id',request.extension_id);
    document.body.appendChild(theLogDiv);
    sendResponse(11111);
});

