var app = angular.module('chatterBox', []);

app.controller('MainController', function ($scope, $http, $interval) {

    var updateUnreadService; 
    var updateMessageService;

    $scope.getNewMessage = function(friendId){
        $http.get('/getnewmessage/'+ friendId).then(function(response){

            if(!response.data['msg']){
                $scope.friendInfo = response.data;
    
                // update dates variable
                var temp = [];
                for(var i=0; i<$scope.friendInfo['messages'].length;i++){
                    temp.push($scope.friendInfo['messages'][i].date);
                }
    
                var dates = temp.filter(function(item, pos) {
                    return temp.indexOf(item) == pos;
                })
    
    
                $scope.dates = dates;
                $scope.showProfile = false;
                $scope.showChat = true;
            }else{
                console.log("Error: "+response.data['msg']);
            }
            
            
        }, function(response){
            console.log("Error: "+response.statusText);
        });
    };

    $scope.getNewMsgNum = function(friendId){
        $http.get('/getnewmsgnum/'+ friendId).then(function(response){
            if(!response.data['msg']){
                // update unread
                for(var i=0;i<$scope.user.friends.length;i++){
                    if($scope.user.friends[i]._id==friendId){
                        $scope.user.friends[i]['unread'] = response.data;
                        break;
                    }
                }
            }else{
                console.log("Error: "+response.data['msg']);
            }
        }, function(response){
            console.log("Error: "+response.statusText);
        });
    };

    $scope.setDialogBox = function(){
        var dialogBox = document.getElementById('dialog');
        dialogBox.scrollTop = dialogBox.scrollHeight;
    }

    $scope.changeLoginState = function () {
        $scope.loginState = !$scope.loginState;
        $scope.showLogin = !$scope.showLogin;
    }

    $scope.showChatView = function(friend){
        // cancel previous promise if exist
        $interval.cancel(updateMessageService);

        $scope.temp_friend = friend;
        // set the color of other friend name to default
        var friend_rows = document.getElementsByClassName('friend_row');
        var i;
        for(i=0;i<friend_rows.length;i++){
            friend_rows[i].style.backgroundColor = 'initial';
        }
        // hgihlight the selected friend name
        var friend_row = document.getElementById(friend.name);
        friend_row.style.backgroundColor = 'grey';

        $http.get('/getconversation/'+ friend._id).then(function(response){
            $scope.friendInfo = response.data;
            // update dates variable
            var temp = [];
            for(var i=0; i<$scope.friendInfo['messages'].length;i++){
                temp.push($scope.friendInfo['messages'][i].date);
            }

            var dates = temp.filter(function(item, pos) {
                return temp.indexOf(item) == pos;
            })

            // update unread
            for(var i=0;i<$scope.user.friends.length;i++){
                if($scope.user.friends[i]._id==friend._id){
                    $scope.user.friends[i].unread = 0;
                    break;
                }
            }

            $scope.dates = dates;
            $scope.showProfile = false;
            $scope.showChat = true;
            updateMessageService = $interval($scope.updateMessage, 1000);
        }, function(response){
            console.log("Error: "+response.statusText);
        });

        
    }
    $scope.showProfileView = function(){
        $http.get("/getuserinfo").then(function (response) {
            $interval.cancel(updateMessageService);
            $scope.profile = response.data;
            $scope.showChat = false;        
            $scope.showProfile = true;
        }, function (response) {
            console.log("Error: "+response.statusText);
        });

        
    }

    $scope.load = function(){
        $http.get("/load").then(function (response) {
            if(response.data==''){
                $scope.loginState = false;
                $scope.showLogin = true;
            }
            else{
                $scope.loginState = true;
                $scope.showLogin = false;
            }
            $scope.showChat = false;
            $scope.showProfile = false;
            $scope.user = response.data;
        }, function (response) {
            console.log("Error: "+response.statusText);
        });
    }

    $scope.login = function(loginForm){
        if(!loginForm || !loginForm.username || !loginForm.password){
            alert("You must enter username and password");
        }else{

            $http.post("/login", {username: loginForm.username, password: loginForm.password})
            .then(
                function(response){
                    if(!response.data['msg']){
                        if(response.data!="Login failure"){
                            $scope.user = response.data;
                            $scope.showChat = false;
                            $scope.showProfile = false;
                            $scope.changeLoginState();
                             
                        }else{
                            alert(response.data);
                        }
                    }else{
                        console.log(response.data['msg']);
                    }
                    
                },
                function(response){
                    console.log("Error: "+response.statusText);
                }
            );

            
        }
        
    }

    $scope.logout = function(){
        
        $http.get("/logout").then(function (response) {
            if(response.data==''){
                $interval.cancel(updateMessageService);
                $scope.user = null;
                $scope.friendInfo = null;
                $scope.dates = null;
                $scope.changeLoginState();
            }
            else
                alert("Error occurs when logout...");
        }, function (response) {
            console.log("Error: "+response.statusText);
        });
        
    }

    $scope.saveUserInfo = function(profile){
        $http.put("/saveuserinfo", profile).then(function (response) {
            if (response.data=='') {
                $scope.showProfileView();
            }
            else {
                console.log("Error :" + response.data.msg);
            }
        }, function (response) {
            console.log("Error: "+response.statusText);
        });
    }

    $scope.postMessage = function(friendId, msg){
        if(msg=='' || msg==null){
            return;
        }

        var now = new Date();
        var time = [
          now.getHours(),
          ':',
          now.getMinutes(),
          ':',
          now.getSeconds()
        ].join('');
        var d = new Date();
        var weekday = new Array(7);
        weekday[0] =  "Sun";
        weekday[1] = "Mon";
        weekday[2] = "Tue";
        weekday[3] = "Wed";
        weekday[4] = "Thur";
        weekday[5] = "Fri";
        weekday[6] = "Sat";
        var wd = weekday[d.getDay()];

        var month = new Array();
        month[0] = "Jan";
        month[1] = "Feb";
        month[2] = "Mar";
        month[3] = "Apr";
        month[4] = "May";
        month[5] = "Jun";
        month[6] = "Jul";
        month[7] = "Aug";
        month[8] = "Sep";
        month[9] = "Oct";
        month[10] = "Nov";
        month[11] = "Dec";
        var m = month[d.getMonth()];

        var date = d.getDate();
        var year = d.getFullYear();
        var dDate = wd+' '+m+' '+date+' '+year;

        $http.post("/postmessage/"+friendId, {'message': msg, 'date':dDate, 'time': time})
        .then(
            function(response){
                if(!response.data['msg']){
                    $scope.friendInfo.messages.push(response.data);
                    
                    if($scope.dates.indexOf(response.data.date)==-1){
                        $scope.dates.push(response.data.date);
                    }
                    document.getElementById('message_input').value = "";
                }else{
                    console(response.data['msg']);
                }
                
            },
            function(response){
                console.log("Error: "+response.statusText);
            }
        );

    }

    $scope.deleteMessage = function(msgId){
        if(confirm("Delete the message?")){
            $http.delete('/deletemessage/'+msgId).then(function (response) {
                if(response.data==''){
                    $scope.showChatView($scope.temp_friend);
                }else{
                    console.log("Error: "+response.data['msg']);
                }
            }, function (response) {
                alert("Error:" + response.statusText);
            });
        }
    };

    


    $scope.updateAllUnread = function () {
        if($scope.user){
            for(var i=0;i<$scope.user.friends.length;i++){
                $scope.getNewMsgNum($scope.user.friends[i]._id);
            }
        }
    }
    $scope.updateMessage = function(){
        if($scope.friendInfo){
            $scope.getNewMessage(String($scope.friendInfo._id));
        }
    }

    

    updateUnreadService = $interval($scope.updateAllUnread, 1000);
    
});