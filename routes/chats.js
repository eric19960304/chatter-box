var express = require('express');
var router = express.Router();

var ObjectID = require('mongodb').ObjectID;

router.get('/load', function (req, res) {
    if (!req.session.userId) {
        res.send('');
    } else {
        var db = req.db;
        var collection = db.get('userList');
        var collection2 = db.get('messageList');
        var id = new ObjectID(req.session.userId);
        var filter = { '_id': id };
        collection.find(filter, function (err, docs) {
            if (err === null) {

                var getMsgNumber = function (key) {
                    // get friend's _id
                    collection.find({'name': docs[0]['friends'][key]['name']},function(err, docs2){
                        //console.log(docs2[0]['name']+", "+docs2[0]['_id']);
                        if(err === null){
                            var filter = {};
                            if (docs[0]['friends'][key]['lastMsgId'] == "0") {
                                filter = { 'senderId': String(docs2[0]['_id']), 'receiverId': String(docs[0]['_id']) };
                            }
                            else {
                                var oid = new ObjectID(docs[0]['friends'][key]['lastMsgId']);
                                filter = { '_id': { $gt: oid }, 'senderId': String(docs2[0]['_id']) ,'receiverId': String(docs[0]['_id']) };
                            }
                            //console.log(filter);
                            // get all message related to
                            collection2.find(filter, function (err, result) {
                                if (err === null) {
                                    var count = Object.keys(result).length;
                                    if (key == 0) {
                                        // last element, send response
                                        docs[0]['friends'][key]['unread'] = count;
                                        docs[0]['friends'][key]['_id'] = docs2[0]['_id'];
                                        var response={
                                            '_id': docs[0]['_id'],
                                            'name': docs[0]['name'],
                                            'icon': docs[0]['icon'],
                                            'friends': docs[0]['friends']
                                        };
                                        res.json(response);
                                    } else {
                                        // continue
                                        docs[0]['friends'][key]['unread'] = count;
                                        docs[0]['friends'][key]['_id'] = docs2[0]['_id'];
                                        getMsgNumber(key - 1);
                                    }
                                } else {
                                    console.log(err); res.send({ msg: err });
                                }
                            });
                        }else{
                            console.log(err); res.send({ msg: err });
                        }

                    });
                    
                } // end of getMsgNumber

                var friendsSize = Object.keys(docs[0]['friends']).length - 1;
                getMsgNumber(friendsSize);
            }
            else res.send({ msg: err });
        });
    }
});

router.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var db = req.db;
    var collection = db.get('userList');
    var collection2 = db.get('messageList');
    var filter = { 'name': username, 'password': password };
    collection.find(filter,function (err, docs) {
        if (err === null) {
            if (docs.length === 0) {
                res.send("Login failure");
            } else {
                // success
                req.session.userId = String(docs[0]['_id']);

                // update online status
                collection.update({ '_id': docs[0]['_id'] }, { $set: { "status": "online" } }, function (err, result) { });

                var getMsgNumber = function (key) {
                    // get friend's _id
                    collection.find({'name': docs[0]['friends'][key]['name']},function(err, docs2){
                        //console.log(docs2[0]['name']+", "+docs2[0]['_id']);
                        if(err === null){
                            var filter = {};
                            if (docs[0]['friends'][key]['lastMsgId'] == "0") {
                                filter = { 'senderId': String(docs2[0]['_id']), 'receiverId': String(docs[0]['_id']) };
                            }
                            else {
                                var oid = new ObjectID(docs[0]['friends'][key]['lastMsgId']);
                                filter = { '_id': { $gt: oid }, 'senderId': String(docs2[0]['_id']) ,'receiverId': String(docs[0]['_id']) };
                            }
                            //console.log(filter);
                            // get all message related to
                            collection2.find(filter, function (err, result) {
                                if (err === null) {
                                    var count = Object.keys(result).length;
                                    if (key == 0) {
                                        // last element, send response
                                        docs[0]['friends'][key]['unread'] = count;
                                        docs[0]['friends'][key]['_id'] = docs2[0]['_id'];
                                        var response={
                                            '_id': docs[0]['_id'],
                                            'name': docs[0]['name'],
                                            'icon': docs[0]['icon'],
                                            'friends': docs[0]['friends']
                                        };
                                        res.json(response);
                                    } else {
                                        // continue
                                        docs[0]['friends'][key]['unread'] = count;
                                        docs[0]['friends'][key]['_id'] = docs2[0]['_id'];
                                        getMsgNumber(key - 1);
                                    }
                                } else {
                                    console.log(err); res.send({ msg: err });
                                }
                            });
                        }else{
                            console.log(err); res.send({ msg: err });
                        }

                    });
                    
                } // end of getMsgNumber

                var friendsSize = Object.keys(docs[0]['friends']).length - 1;
                getMsgNumber(friendsSize);
            }
        } else {
            console.log(err);
            res.send({ msg: err });
        }
    });
});

router.get('/logout', function (req, res) {
    var db = req.db;
    var collection = db.get('userList');
    var id = new ObjectID(req.session.userId);
    collection.update({ '_id': id }, { $set: { 'status': "offline" } }, function (err, result) {
        if(err===null){
            req.session.userId = null;
            res.send('');
        }else{
            console.log(err);
            res.send({ msg: err });
        }
        
    });
});


router.get('/getuserinfo', function (req, res) {
    var db = req.db;
    var collection = db.get('userList');
    var id = new ObjectID(req.session.userId);
    collection.find({ '_id': id }, function (err, docs) {
        if (err === null) {
            var response={
                mobileNumber: docs[0]['mobileNumber'],
                homeNumber: docs[0]['homeNumber'],
                address: docs[0]['address']
            }
            res.json(response);
        }else{
            console.log(err);
            res.send({ msg: err });
        }
        
    });
});

router.put('/saveuserinfo', function(req, res){
    var db = req.db;
    var collection = db.get('userList');
    var id = new ObjectID(req.session.userId);
    collection.update({ '_id': id }, { $set: req.body }, function (err, result) {
        if(err===null){
            res.send('');
        }else{
            console.log(err);
            res.send({ msg: err });
        }
    });
});

router.get('/getconversation/:friendid', function(req,res){
    var db = req.db;
    var collection = db.get('userList');
    var collection2 = db.get('messageList');
    var id = new ObjectID(req.session.userId);
    var friendId= new ObjectID(req.params.friendid);
    // retreive friend info
    collection.find({ '_id': friendId }, function (err, docs) {
        if (err === null) {
            filter = { $or: [{'senderId': String(req.params.friendid), 'receiverId': req.session.userId},
            {'senderId': req.session.userId, 'receiverId': String(req.params.friendid)}]};
            // retreive all messages with that friend
            collection2.find(filter, function (err, result) {
                
                if (err === null) {
                    var sizeOfResult = Object.keys(result).length;
                    var newLastMsgId=null;
                    for(var i=sizeOfResult-1; i>=0;i--){
                        if(String(result[i]['receiverId'])==req.session.userId){
                            newLastMsgId = result[i]['_id'];
                            break;
                        }
                    }
                    if(newLastMsgId!=null){
                        // update lastMsg
                        collection.update({ '_id': id , 'friends.name': docs[0]['name'] }, { $set: {'friends.$.lastMsgId': String(newLastMsgId) }}, function (err, result2) {
                            if (err === null) {
                                var response= {
                                    '_id': docs[0]['_id'],
                                    'icon': docs[0]['icon'],
                                    'name': docs[0]['name'],
                                    'status': docs[0]['status'],
                                    'messages': result
                                };
                                res.json(response);
                            } else {
                                console.log(err);
                            }
                        });
                    }else{
                        // not found, no need to update
                        var response= {
                            '_id': docs[0]['_id'],
                            'icon': docs[0]['icon'],
                            'name': docs[0]['name'],
                            'status': docs[0]['status'],
                            'messages': result
                        };
                        res.json(response);
                    }
                    
                    
                } else {
                    console.log(err);
                }
            });
        }else{
            console.log(err);
            res.send({ msg: err });
        }
        
    });
});

router.post('/postmessage/:friendid', function (req, res) {
    var db = req.db;
    var collection = db.get('messageList');
    
    req.body['senderId']=req.session.userId;
    req.body['receiverId']=req.params.friendid;
    collection.insert(req.body, function(err, result){
        if(err===null){
            res.send(result);
        }else{
            console.log(err);
            res.send({ msg: err });
        }
    });
});

router.delete('/deletemessage/:msgid', function (req, res) {
    var db = req.db;
    var collection = db.get('messageList');
    var id = new ObjectID(req.params.msgid);
    collection.remove({'_id':id}, function(err, result){
        if(err===null){
            res.send('');
        }else{
            console.log(err);
            res.send({ msg: err });
        }
    });
});

router.get('/getnewmessage/:friendid', function(req, res){
    var db = req.db;
    var collection = db.get('userList');
    var collection2 = db.get('messageList');
    var id = new ObjectID(req.session.userId);
    var friendId= new ObjectID(req.params.friendid);
    // retreive friend info
    collection.find({ '_id': friendId }, function (err, docs) {
        if (err === null) {
            filter = { $or: [{'senderId': String(req.params.friendid), 'receiverId': req.session.userId},
            {'senderId': req.session.userId, 'receiverId': String(req.params.friendid)}]};
            // retreive all messages with that friend
            collection2.find(filter, function (err, result) {
                if (err === null) {
                    var sizeOfResult = Object.keys(result).length;
                    var newLastMsgId=null;
                    for(var i=sizeOfResult-1; i>=0;i--){
                        if(String(result[i]['receiverId'])==req.session.userId){
                            newLastMsgId = result[i]['_id'];
                            break;
                        }
                    }
                    if(newLastMsgId!=null){
                        // update lastMsg
                        collection.update({ '_id': id , 'friends.name': docs[0]['name'] }, { $set: {'friends.$.lastMsgId': String(newLastMsgId) }}, function (err, result2) {
                            if (err === null) {
                                var response= {
                                    '_id': docs[0]['_id'],
                                    'icon': docs[0]['icon'],
                                    'name': docs[0]['name'],
                                    'status': docs[0]['status'],
                                    'messages': result
                                };
                                res.json(response);
                            } else {
                                console.log(err);
                                res.send({ msg: err });
                            }
                        });
                    }else{
                        // not found, no need to update
                        var response= {
                            '_id': docs[0]['_id'],
                            'icon': docs[0]['icon'],
                            'name': docs[0]['name'],
                            'status': docs[0]['status'],
                            'messages': result
                        };
                        res.json(response);
                    }
                    
                    
                } else {
                    console.log(err); res.send({ msg: err });
                }
            });
        }else{
            console.log(err);
            res.send({ msg: err });
        }
        
    });

});

router.get('/getnewmsgnum/:friendid', function(req, res){
    var db = req.db;
    var collection = db.get('userList');
    var collection2 = db.get('messageList');
    var id = new ObjectID(req.session.userId);
    var friendId= new ObjectID(req.params.friendid);
    collection.find({'_id':id}, function (err, docs) {
        if (err === null) {
            collection.find({'_id':friendId}, function (err, docs2) {
                var key = -1;
                for(var x in docs[0]['friends']){
                    if(String(docs[0]['friends'][x]['name'])==docs2[0]['name']){
                        key = x;
                    }
                }
                //console.log(docs2[0]['name']+", "+docs2[0]['_id']);
                var filter = {};
                if (docs[0]['friends'][key]['lastMsgId'] == "0") {
                    filter = { 'senderId': String(docs2[0]['_id']), 'receiverId': String(docs[0]['_id']) };
                }
                else {
                    var oid = new ObjectID(docs[0]['friends'][key]['lastMsgId']);
                    filter = { '_id': { $gt: oid }, 'senderId': String(docs2[0]['_id']) ,'receiverId': String(docs[0]['_id']) };
                }
                // get all message related to
                collection2.count(filter, function (err, count) {
                    res.send(String(count));
                });
    
            }); // end of collection on friend
            
                
        }else res.send({ msg: err });
        
    });
});

module.exports = router;




