var _ = require("lodash");
var TelegramBot = require('node-telegram-bot-api');
const low = require('lowdb')
var fs = require('fs');
const fileAsync = require('lowdb/lib/storages/file-async')
const id = 188406252; //mehrad id
function isAdmin(id,admins){
    var out = false;
    admins.forEach(function(admin) {
         if (id==admin) out = true;
         console.log(out);
    });
    return out;
}
const db = low('database.json', {
    storage: fileAsync
});
const log = low('log.json', {
    storage: fileAsync
});
db.defaults({ user: [],admis: [],analytics: [] })
    .write();
log.defaults({ sanjaq: [] })
    .write()
;

var token = process.env.TOKEN; //token

// Change this to wenhook fastest as you can (‍‍‍~mehrad)
var bot = new TelegramBot(token, { polling: true });
console.log("[...] Conected...");

var replyKayboardMobile = {keyboard:[[{text: "بفرست",request_contact: true}]],"one_time_keyboard":true};
var replyKayboardRemove = {ReplyKeyboardRemove:true};

//End of decraltions, start of codes
var intro = `سلام، من سنجاق‌قفلی‌ام. ^_^ من سعی می‌کنم که شما رو به کسی که دوستش دارید سنجاق کنم.
اگر اون هم شما رو سنجاق کرده باشه، من به جفتتون اطلاع می‌دم.`;
bot.onText(/((\/start|start|شروع))\b/,  function (msg, match) {
    var mainKey = {
		parse_mode:"HTML",
        reply_markup: JSON.stringify({
           inline_keyboard: [
                [
                    { text: "یکی رو برام سنجاق کن", callback_data: "btn_doSanjaq" }
                ],[
                    { text: "من رو کسی سنجاق کرده؟", callback_data: "btn_whoSanjaq_" + msg.chat.id}
                ],[
                    { text: "من کیا رو سنجاق کردم؟", callback_data: "btn_prevSanjaq" }
                ]
            ]
        })
    };
    if(signup(msg.chat.id,msg.chat.first_name,msg.chat.username)){
        bot.sendMessage(msg.chat.id, intro , mainKey);
    }  
    else
        changeState(msg.chat.id,"normal");
        bot.sendMessage(msg.chat.id, "می‌خواهی کسی رو سنجاق کنی؟", mainKey);
    
});

bot.on('callback_query', function onCallbackQuery(callbackQuery) {
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    console.log("["+callbackQuery.from.first_name+"|"+callbackQuery.from.username+"][callback_query]==> ",action);
    const opts = {
        chat_id: msg.chat.id,
        message_id: msg.message_id,
    };
    var text;
    if(/(btn_)\w+/g.test(action)){
        text = action.substr(4);
        switch(text) {
            case "cansel":
                bot.editMessageText("خب بیخیالش شدیم :)",opts);
                changeState(msg.chat.id,"normal")
                setDraft(msg.chat.id,"","","","");
                break;
            case "doSanjaq":
                bot.editMessageText("خب یه پیام از کسی که می‌خواهی سنجاقش کنم فوروارد می‌کنی برام؟",opts);
                changeState(msg.chat.id,"f")
                break;
            case "prevSanjaq":
                try {
                
                    var sanjaqs = getUserSanjaqs(msg.chat.id);
                    if(sanjaqs){
                        var out = "شما تا به حال " + sanjaqs.length + "نفر را سنجاق کردید:\n\n";
                        var i = 0;
                        sanjaqs.forEach(function(sanjaq) {
                            i = i + 1;
                            out = out + i.toString() + ". " + sanjaq.name + "(@"+sanjaq.username+") \n";
                            console.log("out: ",out);
                        });
                    } else {
                        var out = "شما تا به حال کسی را سنجاق نکردید.";
                    }
                    bot.editMessageText(out,opts);
                    changeState(msg.chat.id,"normal")
                }
                catch(err) {
                    console.log("err:! ",err.message);
                }
                break;   
            case "finishIt":
                bot.editMessageText("خب برات سنجاقش کردم ؛) اگه اون هم تو رو سنجاق کنه، بهتون می ‌گم.",opts);
                var user = getUser(msg.chat.id);
                sanjaq(msg.chat.id,user.draft[0],user.draft[1],user.draft[2],user.draft[3])
                console.log('lvl: ',user.draft[3]);
                changeState(msg.chat.id,"normal");
                break;
            default:
                if(/(whoSanjaq_)\w+/g.test(action)){
                    var uid = text.substr(10);
                    //console.log("uid",uid);
                    bot.answerCallbackQuery(callbackQuery.id, "کسانی شما رو سنجاق کردن اما شما اونا رو سنجاق نکردید. دوست داری بدونی کیان؟ \n فعلا نمی‌دونم باید چیکار کنی :|",true);
                }
                else if(/(lvl_)\w+/g.test(action)){
                    var lvl = text.substr(4);
                    //console.log("text: ",text);

                     var mainKey = {
                        parse_mode:"HTML",
                        reply_markup: JSON.stringify({
                        inline_keyboard: [
                                [
                                    { text: "نه بیخیالش", callback_data: "btn_cansel" }
                                ],[
                                    { text: "آره، سنجاقش کن", callback_data: "btn_finishIt"}
                                ]
                            ]
                        })
                    };
                    var user = getUser(msg.chat.id);
                    //console.log("user: ",user);
                    setDraft(msg.chat.id,user.draft[0],user.draft[1],user.draft[2],lvl);
                    changeState(msg.chat.id,"c");
                    bot.editMessageText("خب، سطح " + lvl + " برای سنجاقت به " + user.draft[1] + "انتخاب شده. آیا تایید می‌کنی؟",opts);
                    bot.editMessageReplyMarkup({
                        inline_keyboard: [
                                [
                                    { text: "نه بیخیالش", callback_data: "btn_cansel" }
                                ],[
                                    { text: "آره، سنجاقش کن", callback_data: "btn_finishIt"}
                                ]
                            ]
                        },opts);
                }
        }
        bot.answerCallbackQuery(callbackQuery.id);
    }
});

bot.on('text',  function (msg, match) {
    var text = msg.text;
    console.log("1");
    if(msg.forward_from){
        console.log("2");
        var user = getUser(msg.chat.id);
        if(user.state == "f"){
            if (msg.chat.id == msg.forward_from.id){
                bot.sendMessage(msg.chat.id, "لوزر عزیز، خودت رو نمی‌تونی سنجاق کنی :) پیام یکی دیگه جز خودت رو فوروارد کن!"); 
            }
            else {
                console.log("3");
                changeState(msg.chat.id,"l");
                if(msg.forward_from.last_name)var last = " " + msg.forward_from.last_name;
                else var last = "";
                setDraft(msg.chat.id,msg.forward_from.id,msg.forward_from.first_name + last,msg.forward_from.username,"");
                var lvlKey = {
                    parse_mode:"HTML",
                    reply_markup: JSON.stringify({
                    inline_keyboard: [
                            [
                                { text: "سطح 1", callback_data: "btn_lvl_1" },
                                { text: "سطح 2", callback_data: "btn_lvl_2" },
                                { text: "سطح 3", callback_data: "btn_lvl_3" },
                                { text: "سطح 4", callback_data: "btn_lvl_4" }
                            ]
                        ]
                    })
                };
                console.log("4");
                bot.sendMessage(msg.chat.id, "خب باشه، پس می‌خواهی " + msg.forward_from.first_name + " رو سنجاق کنی. می‌خواهی سنجاقت از چه نوعی باشه؟" , lvlKey);
            }
        }
        else {
            bot.sendMessage(msg.chat.id, "لطفا /start رو بزن و از اول شروع کن.");    
        }
    }
    else{
        console.log("5");
    }
});

// funstions // ------------------------------------------------------------------------------------------------------------------------------------------
function signup(chatid,first_name,username){
    //bot.sendMessage(id, chatid+" == "+first_name+" == @"+username);
    var chatIdExist = db.get('user').find({ id: chatid }).value()
        console.log("chatId",chatIdExist);
    if(chatIdExist){
        console.log("[...] user is registerd alredy",chatIdExist);
         return false;
    }
    else {
        var test = db.get('user')
        .push({ id: chatid, first_name: first_name,username:username,state:"normal",draft:[],log:[{type:"signup",timestamp:new Date()}] })
        .write();
        console.log("[...] User created");
        return true;
    }
}
function sanjaq(host,target,name,username,lvl){
    //bot.sendMessage(id, chatid+" == "+first_name+" == @"+username);
    var chatIdExist = log.get('sanjaq').find({ id: host }).find({ target_id: target}).value()
        console.log("chatId",chatIdExist);
    if(chatIdExist){
        console.log("[...] sanjaq is registerd alredy",chatIdExist);
         return false;
    }
    else {
        var test = log.get('sanjaq')
        .push({ id: host, target_id: target,username:username,lvl:lvl,name:name,timestamp:new Date(),enable:true})
        .write();
        console.log("[...] sanjaq created");
        return true;
    }
}
/*states:
0:normal (normal)
1:wating for forward msg (f)
2:wating for level (l)
3:wating for confirmation (c)
4: have new msg (hnm)*/
function changeState(theId,theState) {
    var doit = db.get('user')
        .find({ id: theId })
        .assign({ state: theState})
        .write()
    return doit;
}
/*drafts:
0:"target_id"
1:"first and lastname"
2:"username"
3:"lvl"*/
function setDraft(theId,theDraft,theDraft2,theDraft3,theDraft4) {
    var doit = db.get('user')
        .find({ id: theId })
        .assign({ draft: [theDraft,theDraft2,theDraft3,theDraft4]})
        .write()
    return doit;
}
function getUser(theId) {
    var doit = db.get('user')
        .find({ id: theId })
        .value()
    return doit;
}

function isSignUp(chatid) {
    return false;
}

function getUserList(chatid){
    var chatIdExist = db.get('user')
                    .filter({available:true})
                    .filter({user_id:chatid})
                    .sortBy('timestamp')
                    .take(500)
                    .value()
   //("users: ",chatIdExist);
    // if(chatIdExist){return chatIdExist.credit;}
    // else {return false;}
    return chatIdExist;
}
function getUserSanjaqs(chatid){
    var chatIdExist = log.get('sanjaq')
                    .filter({enable:true})
                    .filter({id:chatid})
                    .sortBy('timestamp')
                    .take(10)
                    .value()
    //console.log("sanjaqs: ",chatIdExist);
    return chatIdExist;
}

    var addKey = {
		parse_mode:"HTML",
        reply_markup: JSON.stringify({
            "force_reply": true
        })
    };
